import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";
import { formatCurrency, formatWeight } from "../src/utils";
import { marketsApi, type ApiMarket, type ApiMarketBuyer } from "../src/services/api";
import { useMarketsStore, useDeliveryStore, useTransactionStore } from "../src/store";
import { haversineDistanceKm } from "../src/utils";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Generate the stable map HTML once — NO market data baked in.
// Markets and coords are pushed in via injectJavaScript after the map loads.
function getMapHtml(centerLat = -6.5925, centerLng = 110.6698) {
  const cLat = typeof centerLat === "number" && !isNaN(centerLat) ? centerLat : -6.5925;
  const cLng = typeof centerLng === "number" && !isNaN(centerLng) ? centerLng : 110.6698;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #e5eaf0; }
    #map { position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; background: #e5eaf0; }
    .leaflet-container { font-family: system-ui, -apple-system, sans-serif; background: #e5eaf0; width: 100%; height: 100%; }
    .custom-pin-wrapper { position: relative; display: inline-flex; align-items: center; }
    .custom-pin-card { background: #ffffff; color: #0A235C; border: 1.5px solid rgba(43, 120, 228, 0.25); border-radius: 20px; padding: 6px 12px; font-size: 12px; font-weight: 800; box-shadow: 0 4px 14px rgba(10, 35, 92, 0.18); white-space: nowrap; display: flex; align-items: center; gap: 6px; cursor: pointer; }
    .pin-svg-icon { width: 14px; height: 14px; fill: #2B78E4; flex-shrink: 0; }
    .pin-badge-circle { position: absolute; top: -7px; right: -6px; background: #2B78E4; color: #ffffff; width: 20px; height: 20px; border-radius: 10px; font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.18); }
    #diag { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: rgba(180,0,0,0.88); color: white; font-size: 11px; font-family: monospace; padding: 6px 8px; pointer-events: none; white-space: pre-wrap; max-height: 50vh; overflow: auto; }
  </style>
</head>
<body>
  <div id="diag">STAGE-0: HTML parsing started</div>
  <div id="map"></div>
  <script>
    window.onerror = function(msg, url, line, col, err) {
      var el = document.getElementById("diag");
      if (el) el.textContent += "\\nJS-ERR: " + msg + " (L" + line + ")";
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "DIAG", text: "JS-ERR: " + msg + " L" + line }));
      }
    };
    function sendMsg(payload) {
      var msg = JSON.stringify(payload);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else {
        try { window.parent.postMessage(msg, "*"); } catch(e) {}
      }
    }
    function diag(text) {
      var el = document.getElementById("diag");
      if (el) el.textContent += "\\n" + text;
      sendMsg({ type: "DIAG", text: text });
    }
    diag("STAGE-1: Inline script executing");
    var map = null;
    var markerLayer = null;
    var pickerMarker = null;

    window.updateMarkers = function(markets) {
      diag("updateMarkers: count=" + (markets ? markets.length : "null"));
      if (!map) { diag("updateMarkers: map not ready"); return; }
      if (markerLayer) { markerLayer.clearLayers(); }
      else { markerLayer = L.layerGroup().addTo(map); }
      if (!Array.isArray(markets)) return;
      markets.forEach(function(m) {
        var mLat = parseFloat(m.latitude);
        var mLng = parseFloat(m.longitude);
        if (isNaN(mLat) || isNaN(mLng)) return;
        var name = m.namaPasar || m.nama_pasar || "Pasar";
        var count = (m.totalBuyers || m.total_buyers || m.totalPesanan || m.total_pesanan || (m.buyers ? m.buyers.length : (m.pembeliList ? m.pembeliList.length : 0)));
        var customIcon = L.divIcon({
          className: "custom-div-icon",
          html: '<div class="custom-pin-wrapper"><div class="custom-pin-card"><span>' + name + '</span></div><div class="pin-badge-circle">' + count + '</div></div>',
          iconSize: [140, 36], iconAnchor: [70, 18]
        });
        var marker = L.marker([mLat, mLng], { icon: customIcon });
        marker.on("click", function(e) {
          if (e && e.originalEvent) e.originalEvent.stopPropagation();
          sendMsg({ type: "SELECT_MARKET", marketId: m.id });
        });
        markerLayer.addLayer(marker);
      });
    };

    var userLocationMarker = null;
    var userLocationCircle = null;
    window.setCenter = function(lat, lng) {
      if (!map) return;
      map.setView([lat, lng], 14);
      if (!userLocationMarker) {
        var userIcon = L.divIcon({
          className: "user-location-marker",
          html: '<div style="position:relative;width:26px;height:26px;"><div style="position:absolute;width:26px;height:26px;border-radius:13px;background:rgba(43,120,228,0.35);"></div><div style="position:absolute;top:4px;left:4px;width:18px;height:18px;border-radius:9px;background:#2B78E4;border:3px solid #ffffff;box-shadow:0 3px 10px rgba(10,35,92,0.4);"></div></div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        userLocationMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        userLocationCircle = L.circle([lat, lng], { radius: 200, color: '#2B78E4', fillColor: '#2B78E4', fillOpacity: 0.12, weight: 1.5 }).addTo(map);
      } else {
        userLocationMarker.setLatLng([lat, lng]);
        if (userLocationCircle) userLocationCircle.setLatLng([lat, lng]);
      }
    };

    function loadCss(url) {
      var link = document.createElement("link");
      link.rel = "stylesheet"; link.href = url;
      document.head.appendChild(link);
    }
    var cdns = [
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
      "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"
    ];
    var cdnCss = [
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css",
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    ];
    cdnCss.forEach(loadCss);

    function tryLoadCdn(index) {
      if (index >= cdns.length) {
        diag("FATAL: All CDNs failed to load Leaflet JS");
        return;
      }
      var url = cdns[index];
      diag("CDN try [" + index + "]: " + url);
      var script = document.createElement("script");
      script.src = url;
      script.onload = function() {
        diag("CDN SUCCESS [" + index + "]: Leaflet loaded");
        initMap();
      };
      script.onerror = function(err) {
        diag("CDN FAIL [" + index + "]");
        tryLoadCdn(index + 1);
      };
      document.head.appendChild(script);
    }

    function initMap() {
      diag("STAGE-2: initMap started");
      if (typeof L === "undefined") { diag("L is undefined"); return; }
      try {
        var mapEl = document.getElementById("map");
        diag("STAGE-3: #map size=" + (mapEl ? mapEl.offsetWidth + "x" + mapEl.offsetHeight : "NULL"));
        map = L.map("map", { zoomControl: false, attributionControl: false }).setView([${cLat}, ${cLng}], 12);
        diag("STAGE-4: L.map() ok");
        var tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 });
        tileLayer.on("tileload", function() { diag("TILE-OK"); });
        tileLayer.on("tileerror", function(e) { diag("TILE-ERR"); });
        tileLayer.addTo(map);
        markerLayer = L.layerGroup().addTo(map);
        window.setCenter(${cLat}, ${cLng});
        map.on("click", function(e) {
          var lat = e.latlng.lat; var lng = e.latlng.lng;
          if (!pickerMarker) {
            pickerMarker = L.marker([lat, lng], { draggable: true }).addTo(map);
            pickerMarker.bindPopup("<b>Lokasi Pasar Terpilih</b><br>Geser pin ini untuk ubah koordinat.").openPopup();
            pickerMarker.on("dragend", function() {
              var pos = pickerMarker.getLatLng();
              sendMsg({ type: "PICKED_LOCATION", lat: pos.lat, lng: pos.lng });
            });
          } else { pickerMarker.setLatLng([lat, lng]); pickerMarker.openPopup(); }
          sendMsg({ type: "PICKED_LOCATION", lat: lat, lng: lng });
        });
        setTimeout(function() {
          map.invalidateSize();
          var sz = map.getSize();
          diag("STAGE-7: size=" + sz.x + "x" + sz.y);
          if (sz.x > 0 && sz.y > 0) {
            diag("SUCCESS");
            document.getElementById("diag").style.display = "none";
            sendMsg({ type: "MAP_READY" });
          } else {
            diag("ERROR: zero size");
          }
        }, 600);
      } catch (err) {
        diag("CATCH: " + String(err));
      }
    }
    tryLoadCdn(0);
  </script>
</body>
</html>`;
}

export default function FullScreenMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { markets, isLoading: marketsLoading, fetchMarkets, addMarket, updateMarket, deleteMarket } = useMarketsStore();
  const { schedules, fetchSchedules } = useDeliveryStore();
  const { sales, fetchSales } = useTransactionStore();

  // WebView ref for injectJavaScript (stable HTML — no reload loop)
  const webViewRef = useRef<any>(null);
  // Stable HTML generated once on mount — never regenerated to avoid reload
  const stableMapHtml = useRef<string>(getMapHtml(-6.5925, 110.6698));
  const mapReadyRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedMarket, setSelectedMarket] = useState<ApiMarket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [expandedBuyerId, setExpandedBuyerId] = useState<string | null>(null);

  // User GPS Location State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.5925,
    lng: 110.6698,
  });
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  // Market CRUD form state
  const [showMarketForm, setShowMarketForm] = useState(false);
  const [editingMarket, setEditingMarket] = useState<ApiMarket | null>(null);
  const [formNama, setFormNama] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [formKategori, setFormKategori] = useState<"Pasar Tradisional" | "TPI Pelelangan" | "Pusat Restoran">("Pasar Tradisional");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [isSavingMarket, setIsSavingMarket] = useState(false);

  const sheetAnim = useRef(new Animated.Value(SCREEN_H)).current;

  // Request Location Permissions & Fetch GPS Position
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setHasLocationPermission(true);
          const location = await Location.getCurrentPositionAsync({});
          setUserCoords({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        } else {
          setHasLocationPermission(false);
        }
      } catch (err) {
        console.warn("Location permission error:", err);
      }
    })();
  }, []);

  const marketsWithDistance: ApiMarket[] = markets.map((m) => ({
    ...m,
    jarakKm: haversineDistanceKm(userCoords.lat, userCoords.lng, m.latitude, m.longitude),
  }));

  useEffect(() => {
    fetchMarkets().catch(console.error);
    fetchSchedules().catch(console.error);
    fetchSales().catch(console.error);
  }, [fetchMarkets, fetchSchedules, fetchSales]);

  // Re-center map when GPS location becomes available (no WebView reload)
  useEffect(() => {
    if (webViewRef.current && mapReadyRef.current) {
      const js = `window.setCenter && window.setCenter(${userCoords.lat}, ${userCoords.lng}); true;`;
      webViewRef.current.injectJavaScript(js);
    }
  }, [userCoords]);


  useEffect(() => {
    if (Platform.OS === "web") {
      const handleMessage = (event: MessageEvent) => {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "SELECT_MARKET") {
          const found = marketsWithDistance.find((m) => m.id === data.marketId);
          if (found) {
            openMarketDetail(found);
          }
        } else if (data?.type === "PICKED_LOCATION") {
          setFormLat(Number(data.lat).toFixed(7));
          setFormLng(Number(data.lng).toFixed(7));
        }
      };
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }
  }, [marketsWithDistance]);

  const categories = ["Semua", "Pasar Tradisional", "TPI Pelelangan", "Pusat Restoran"];

  const filteredMarkets = marketsWithDistance.filter((m) => {
    const marketName = m.namaPasar || (m as any).nama_pasar || "";
    const marketAddress = m.alamat || "";
    const matchesSearch =
      marketName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      marketAddress.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || m.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Inject market markers into the already-running Leaflet map (no WebView reload)
  const injectMarkersRef = useRef<ApiMarket[]>([]);
  useEffect(() => {
    injectMarkersRef.current = filteredMarkets;
    if (webViewRef.current && mapReadyRef.current) {
      const js = `window.updateMarkers && window.updateMarkers(${JSON.stringify(filteredMarkets)}); true;`;
      webViewRef.current.injectJavaScript(js);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filteredMarkets)]);


  const openMarketDetail = (market: ApiMarket) => {
    setSelectedMarket(market);
    setExpandedBuyerId(market.buyers?.[0]?.id || market.pembeliList?.[0]?.id || null);
    setIsSheetOpen(true);
    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeMarketDetail = () => {
    Animated.timing(sheetAnim, {
      toValue: SCREEN_H,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsSheetOpen(false);
      setSelectedMarket(null);
    });
  };

  const handleSaveMarket = async () => {
    if (!formNama.trim() || !formAlamat.trim()) {
      Alert.alert("Validasi", "Nama dan alamat pasar wajib diisi.");
      return;
    }
    const lat = parseFloat(formLat);
    const lng = parseFloat(formLng);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert("Validasi", "Koordinat harus berupa angka desimal.");
      return;
    }

    setIsSavingMarket(true);
    try {
      if (editingMarket) {
        await updateMarket(editingMarket.id, {
          nama_pasar: formNama.trim(),
          alamat: formAlamat.trim(),
          latitude: lat,
          longitude: lng,
          kategori: formKategori,
        });
      } else {
        await addMarket({
          nama_pasar: formNama.trim(),
          alamat: formAlamat.trim(),
          latitude: lat,
          longitude: lng,
          kategori: formKategori,
        });
      }
      setShowMarketForm(false);
      setEditingMarket(null);
      setFormNama("");
      setFormAlamat("");
      setFormLat("");
      setFormLng("");
    } catch {
      Alert.alert("Gagal", "Tidak dapat menyimpan pasar.");
    } finally {
      setIsSavingMarket(false);
    }
  };

  const handleDeleteMarket = (market: ApiMarket) => {
    Alert.alert(
      "Hapus Pasar",
      `Yakin ingin menghapus "${market.namaPasar}"? Pastikan tidak ada pembeli yang terhubung.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMarket(market.id);
              closeMarketDetail();
            } catch (err: any) {
              const msg = err?.response?.data?.error?.message ?? "Tidak dapat menghapus pasar.";
              Alert.alert("Gagal", msg);
            }
          },
        },
      ]
    );
  };

  const handleOpenWa = (buyer: ApiMarketBuyer, marketName: string) => {
    const buyerName = buyer.namaPembeli || buyer.nama || "Pembeli";
    const message = `Halo ${buyerName}, mengenai pesanan kulakan ikan Anda untuk pengiriman ke ${marketName}...`;
    const url = `https://api.whatsapp.com/send?phone=${buyer.telepon}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => console.warn("Cannot open WhatsApp"));
  };

  return (
    <View style={styles.container}>
      {/* 100% FULL-SCREEN MAP CANVAS BACKGROUND */}
      <View style={StyleSheet.absoluteFillObject}>
        {Platform.OS === "web" ? (
          <iframe
            srcDoc={getMapHtml(userCoords.lat, userCoords.lng)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              border: "none",
              margin: 0,
              padding: 0,
              outline: "none",
            } as any}
            title="Full Screen Map"
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: stableMapHtml.current }}
            onLoadStart={() => console.log("[MAP-WV] onLoadStart")}
            onLoadEnd={() => console.log("[MAP-WV] onLoadEnd")}
            onError={(e: any) => console.error("[MAP-WV] onError:", e.nativeEvent)}
            onHttpError={(e: any) => console.error("[MAP-WV] onHttpError:", e.nativeEvent.statusCode, e.nativeEvent.url)}
            onMessage={(event: any) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === "DIAG") {
                  console.log("[MAP-DIAG]", data.text);
                } else if (data.type === "MAP_READY") {
                  console.log("[MAP-WV] MAP_READY — injecting initial data");
                  mapReadyRef.current = true;
                  // Inject initial markers after map is ready
                  const js = `window.updateMarkers && window.updateMarkers(${JSON.stringify(injectMarkersRef.current)}); true;`;
                  webViewRef.current?.injectJavaScript(js);
                } else if (data.type === "SELECT_MARKET") {
                  const found = marketsWithDistance.find((m) => m.id === data.marketId);
                  if (found) openMarketDetail(found);
                } else if (data.type === "PICKED_LOCATION") {
                  const newLat = Number(data.lat).toFixed(7);
                  const newLng = Number(data.lng).toFixed(7);
                  setFormLat(newLat);
                  setFormLng(newLng);
                  // Open modal directly when user taps a location on map
                  if (!showMarketForm) {
                    setFormNama("");
                    setFormAlamat("");
                    setEditingMarket(null);
                    setShowMarketForm(true);
                  }
                }
              } catch (err) {
                console.error("[MAP-WV] message parse error:", err);
              }
            }}
            style={{ flex: 1, width: "100%", height: "100%" }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
          />
        )}
      </View>

      {/* FLOATING OVERLAY: TOP SEARCH & FILTER BAR */}
      <View style={[styles.topFloatingControls, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.floatingBackButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={iconSize(22)} color={Colors.navy} />
          </TouchableOpacity>

          {/* Search Bar Input */}
          <View style={styles.searchBarBox}>
            <Ionicons name="search-outline" size={iconSize(18)} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari pasar atau alamat kulakan..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={iconSize(18)} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Horizontal Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* GPS RE-CENTER FLOATING BUTTON */}
      <TouchableOpacity
        style={[styles.gpsButton, { bottom: isSheetOpen ? SCREEN_H * 0.74 : 30 }]}
        onPress={() => {
          if (userCoords && userCoords.lat && userCoords.lng) {
            if (webViewRef.current && mapReadyRef.current) {
              const js = `window.setCenter && window.setCenter(${userCoords.lat}, ${userCoords.lng}); true;`;
              webViewRef.current.injectJavaScript(js);
            }
          }
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="locate" size={iconSize(22)} color={Colors.navy} />
      </TouchableOpacity>

      {/* BOTTOM SHEET DRAWER FOR SELECTED MARKET DETAILS */}
      {isSheetOpen && selectedMarket && (
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: sheetAnim }],
            },
          ]}
        >
          {/* Drag Handle Bar Header */}
          <View style={styles.sheetHandleArea}>
            <View style={styles.handleBar} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: spacing(20), paddingBottom: spacing(40) }}
            showsVerticalScrollIndicator={false}
          >
            {/* Market Title & Category */}
            <View style={styles.sheetHeader}>
              <View style={[SharedStyles.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
                <Text style={{ ...Type.h1, fontSize: rfs(20), color: Colors.navy, flex: 1 }}>
                  {selectedMarket.namaPasar}
                </Text>
                <TouchableOpacity onPress={closeMarketDetail} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={iconSize(24)} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={[SharedStyles.row, { gap: 5, marginTop: 4, marginBottom: 8 }]}>
                <Ionicons name="location" size={iconSize(14)} color={Colors.navy} />
                <Text style={{ color: Colors.textSecondary, fontSize: rfs(12), flex: 1 }}>
                  {selectedMarket.alamat}
                </Text>
              </View>

              <View style={[SharedStyles.row, { gap: 12 }]}>
                <View style={styles.badgeCategory}>
                  <Text style={styles.badgeCategoryText}>{selectedMarket.kategori}</Text>
                </View>
                <View style={[SharedStyles.row, { gap: 4 }]}>
                  <Ionicons name="navigate" size={iconSize(13)} color={Colors.royalBlue} />
                  <Text style={{ color: Colors.royalBlue, fontSize: rfs(12), fontWeight: "bold" }}>
                    {selectedMarket.jarakKm} km dari lokasi Anda
                  </Text>
                </View>
              </View>

              {/* Edit & Hapus Pasar */}
              <View style={[SharedStyles.row, { gap: 8, marginTop: spacing(8) }]}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingMarket(selectedMarket);
                    setFormNama(selectedMarket.namaPasar);
                    setFormAlamat(selectedMarket.alamat);
                    setFormKategori(selectedMarket.kategori);
                    setFormLat(String(selectedMarket.latitude));
                    setFormLng(String(selectedMarket.longitude));
                    setShowMarketForm(true);
                  }}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: Colors.royalBlueMuted, borderRadius: radius(8) }}
                >
                  <Ionicons name="create-outline" size={iconSize(14)} color={Colors.royalBlue} />
                  <Text style={{ color: Colors.royalBlue, fontSize: rfs(11), fontWeight: "700" }}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteMarket(selectedMarket)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: radius(8) }}
                >
                  <Ionicons name="trash-outline" size={iconSize(14)} color="#ef4444" />
                  <Text style={{ color: "#ef4444", fontSize: rfs(11), fontWeight: "700" }}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* List of Buyers (Accordion Format) */}
            {(() => {
              const buyersList = selectedMarket.buyers || selectedMarket.pembeliList || [];
              return (
                <>
                  <Text style={{ ...Type.h2, fontSize: rfs(15), marginBottom: spacing(12) }}>
                    Daftar Pembeli ({buyersList.length})
                  </Text>

                  {buyersList.map((buyer: ApiMarketBuyer) => {
                    const isExpanded = expandedBuyerId === buyer.id;
                    const buyerName = buyer.namaPembeli || buyer.nama || "Pembeli";
                    const buyerSchedules = schedules.filter(
                      (s) => s.buyer?.id === buyer.id && s.market?.id === selectedMarket.id
                    );

                    return (
                      <View key={buyer.id} style={[styles.buyerCard, isExpanded && styles.buyerCardActive]}>
                        {/* Clickable Header Area */}
                        <TouchableOpacity
                          onPress={() => setExpandedBuyerId(isExpanded ? null : buyer.id)}
                          activeOpacity={0.8}
                          style={{ width: "100%" }}
                        >
                          <View style={styles.topRow}>
                            <View style={[styles.timeGroup, { flex: 1 }]}>
                              <Ionicons name="person" size={iconSize(15)} color={Colors.navy} />
                              <Text style={styles.buyerNameText} numberOfLines={1}>
                                {buyerName}
                              </Text>
                            </View>

                            {/* Status Pembeli Badge: Lunas / Utang (Tempo) */}
                            {(() => {
                              const bId = (buyer as any).id;
                              const buyerSales = sales.filter((s) => s.buyerId === bId || (s as any).buyer_id === bId);
                              const isTempo = buyerSales.some((s) => s.statusBayar === "tempo" || (s as any).status_bayar === "tempo");
                              return (
                                <View
                                  style={{
                                    backgroundColor: isTempo ? "rgba(239, 68, 68, 0.12)" : "rgba(34, 197, 94, 0.12)",
                                    borderColor: isTempo ? "#ef4444" : "#22c55e",
                                    borderWidth: 1,
                                    paddingHorizontal: 8,
                                    paddingVertical: 2,
                                    borderRadius: 6,
                                    marginRight: 6,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: rfs(10.5),
                                      fontWeight: "800",
                                      color: isTempo ? "#dc2626" : "#16a34a",
                                    }}
                                  >
                                    {isTempo ? "Utang (Tempo)" : "Lunas"}
                                  </Text>
                                </View>
                              );
                            })()}

                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={iconSize(18)}
                              color={Colors.navy}
                            />
                          </View>

                          <View style={{ marginTop: spacing(4), gap: 3 }}>
                            <Text style={styles.summaryText} numberOfLines={1}>
                              {buyer.tipePembeli ?? "Pembeli"} • {buyer.telepon ?? "Tidak ada telepon"}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {/* Extended Details Box (When Expanded) */}
                        {isExpanded && (
                          <View style={styles.expandedContent}>
                            <View style={styles.detailRow}>
                              <View style={[SharedStyles.row, { gap: 5 }]}>
                                <Ionicons name="person" size={iconSize(13)} color={Colors.navy} />
                                <Text style={styles.detailLabel}>Tipe Pembeli:</Text>
                              </View>
                              <Text style={styles.detailValueBold}>{buyer.tipePembeli ?? "-"}</Text>
                            </View>

                            <View style={styles.detailRow}>
                              <View style={[SharedStyles.row, { gap: 5 }]}>
                                <Ionicons name="card-outline" size={iconSize(13)} color={Colors.navy} />
                                <Text style={styles.detailLabel}>Status Pembayaran:</Text>
                              </View>
                              {(() => {
                                const bId = (buyer as any).id;
                                const buyerSales = sales.filter((s) => s.buyerId === bId || (s as any).buyer_id === bId);
                                const isTempo = buyerSales.some((s) => s.statusBayar === "tempo" || (s as any).status_bayar === "tempo");
                                return (
                                  <Text style={{ fontSize: rfs(12), fontWeight: "bold", color: isTempo ? "#dc2626" : "#16a34a" }}>
                                    {isTempo ? "🚨 Utang / Tempo" : "✅ Lunas"}
                                  </Text>
                                );
                              })()}
                            </View>

                            <View style={styles.detailRow}>
                              <View style={[SharedStyles.row, { gap: 5 }]}>
                                <Ionicons name="call" size={iconSize(13)} color={Colors.navy} />
                                <Text style={styles.detailLabel}>No. Telepon:</Text>
                              </View>
                              <Text style={styles.detailValue}>{buyer.telepon ?? "-"}</Text>
                            </View>

                            {/* Delivery Schedules Join */}
                            {buyerSchedules.length === 0 ? (
                              <View style={{ backgroundColor: "#F8FAFC", borderRadius: radius(10), padding: spacing(10), marginTop: spacing(8), borderWidth: 1, borderColor: Colors.divider }}>
                                <Text style={{ color: Colors.textMuted, fontSize: rfs(11.5), textAlign: "center" }}>
                                  Belum ada jadwal pengantaran aktif.
                                </Text>
                              </View>
                            ) : (
                              <View style={{ marginTop: spacing(8) }}>
                                <Text style={{ color: Colors.textMuted, fontSize: rfs(11), fontWeight: "700", marginBottom: 4 }}>JADWAL PENGANTARAN:</Text>
                                {buyerSchedules.slice(0, 2).map((sch) => (
                                  <View key={sch.id} style={{ backgroundColor: "#F0F4FF", borderRadius: radius(8), padding: spacing(8), marginBottom: 6 }}>
                                    <Text style={{ color: Colors.navy, fontSize: rfs(12), fontWeight: "bold" }}>
                                      {new Date(sch.scheduledAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} — {new Date(sch.scheduledAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                                    </Text>
                                    {sch.catatan && <Text style={{ color: Colors.textMuted, fontSize: rfs(11) }}>{sch.catatan}</Text>}
                                    {sch.sale && (
                                      <Text style={{ color: Colors.royalBlue, fontSize: rfs(12), fontWeight: "800", marginTop: 2 }}>
                                        Total: {formatCurrency(sch.sale.total)}
                                      </Text>
                                    )}
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Action Buttons */}
                            <View style={[SharedStyles.row, { gap: 10, marginTop: spacing(12) }]}>
                              <TouchableOpacity
                                onPress={() => handleOpenWa(buyer, selectedMarket!.namaPasar)}
                                style={styles.btnWa}
                                activeOpacity={0.85}
                              >
                                <Ionicons name="logo-whatsapp" size={iconSize(16)} color="#ffffff" style={{ marginRight: 6 }} />
                                <Text style={styles.btnText}>Hubungi WA</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => {
                                  closeMarketDetail();
                                  router.push("/transactions" as any);
                                }}
                                style={styles.btnProcess}
                                activeOpacity={0.85}
                              >
                                <Ionicons name="document-text-outline" size={iconSize(16)} color={Colors.royalBlue} style={{ marginRight: 6 }} />
                                <Text style={{ color: Colors.royalBlue, fontSize: rfs(12), fontWeight: "bold" }}>
                                  Detail Transaksi
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </>
              );
            })()}
          </ScrollView>
        </Animated.View>
      )}

      {/* FAB (+) Button for Adding New Market */}
      <TouchableOpacity
        style={[styles.gpsButton, { bottom: isSheetOpen ? SCREEN_H * 0.74 + 60 : 90, backgroundColor: Colors.navy }]}
        onPress={() => {
          setEditingMarket(null);
          setFormNama("");
          setFormAlamat("");
          setFormKategori("Pasar Tradisional");
          setFormLat("");
          setFormLng("");
          setShowMarketForm(true);
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={iconSize(24)} color="#ffffff" />
      </TouchableOpacity>

      {/* Bottom Sheet Modal: Form Tambah / Edit Pasar */}
      {showMarketForm && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: radius(24), borderTopRightRadius: radius(24), padding: spacing(24), paddingBottom: spacing(40) }}>
            <Text style={{ ...Type.h2, fontSize: rfs(16), marginBottom: spacing(16) }}>
              {editingMarket ? "Edit Pasar" : "Tambah Pasar Baru"}
            </Text>

            {/* Nama Pasar */}
            <View style={{ marginBottom: spacing(12) }}>
              <Text style={{ color: Colors.navy, fontSize: rfs(12), fontWeight: "600", marginBottom: 4 }}>Nama Pasar *</Text>
              <TextInput
                style={{ height: 44, backgroundColor: "#e5eaf7", borderRadius: radius(10), paddingHorizontal: 12, fontSize: rfs(13), color: "#00072d" }}
                value={formNama}
                onChangeText={setFormNama}
                placeholder="Contoh: Pasar Ratu Jepara"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Alamat */}
            <View style={{ marginBottom: spacing(12) }}>
              <Text style={{ color: Colors.navy, fontSize: rfs(12), fontWeight: "600", marginBottom: 4 }}>Alamat *</Text>
              <TextInput
                style={{ height: 44, backgroundColor: "#e5eaf7", borderRadius: radius(10), paddingHorizontal: 12, fontSize: rfs(13), color: "#00072d" }}
                value={formAlamat}
                onChangeText={setFormAlamat}
                placeholder="Alamat lengkap pasar"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Form Lat/Lng Info */}
            {formLat && formLng ? (
              <View style={{ marginBottom: spacing(12), padding: spacing(10), backgroundColor: "#f0f4ff", borderRadius: radius(10), flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="location" size={iconSize(16)} color={Colors.royalBlue} />
                <Text style={{ color: Colors.navy, fontSize: rfs(11.5), fontWeight: "bold" }}>
                  Koordinat: {formLat}, {formLng}
                </Text>
              </View>
            ) : null}

            {/* Kategori Picker */}
            <View style={{ marginBottom: spacing(16) }}>
              <Text style={{ color: Colors.navy, fontSize: rfs(12), fontWeight: "600", marginBottom: 4 }}>Kategori</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["Pasar Tradisional", "TPI Pelelangan", "Pusat Restoran"] as const).map((kat) => (
                  <TouchableOpacity
                    key={kat}
                    onPress={() => setFormKategori(kat)}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: radius(8), alignItems: "center", backgroundColor: formKategori === kat ? Colors.navy : "#e5eaf7" }}
                  >
                    <Text style={{ fontSize: rfs(10), fontWeight: "700", color: formKategori === kat ? "#fff" : Colors.navy, textAlign: "center" }}>{kat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Form Buttons */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => { setShowMarketForm(false); setEditingMarket(null); }}
                style={{ flex: 1, height: 48, borderRadius: radius(12), alignItems: "center", justifyContent: "center", backgroundColor: "#e5eaf7" }}
              >
                <Text style={{ color: Colors.navy, fontWeight: "bold", fontSize: rfs(13) }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveMarket}
                disabled={isSavingMarket}
                style={{ flex: 2, height: 48, borderRadius: radius(12), alignItems: "center", justifyContent: "center", backgroundColor: Colors.navy }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: rfs(13) }}>
                  {isSavingMarket ? "Menyimpan..." : editingMarket ? "Simpan Perubahan" : "Tambah Pasar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5eaf0",
  },
  topFloatingControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: spacing(16),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(10),
    marginBottom: spacing(10),
  },
  floatingBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.button,
  },
  searchBarBox: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing(14),
    gap: spacing(8),
    ...Shadow.button,
  },
  searchInput: {
    flex: 1,
    fontSize: rfs(12.5),
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  categoryScrollContent: {
    gap: spacing(8),
    paddingBottom: spacing(8),
  },
  categoryChip: {
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(8),
    borderRadius: radius(20),
    backgroundColor: "#ffffff",
    ...Shadow.button,
  },
  categoryChipSelected: {
    backgroundColor: Colors.navy,
  },
  categoryChipText: {
    fontSize: rfs(12),
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  categoryChipTextSelected: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  gpsButton: {
    position: "absolute",
    right: spacing(16),
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 40,
    ...Shadow.button,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_H * 0.72,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: radius(28),
    borderTopRightRadius: radius(28),
    zIndex: 100,
    ...Shadow.cardLift,
  },
  sheetHandleArea: {
    alignItems: "center",
    paddingVertical: 14,
    width: "100%",
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: "#CBD5E1",
    borderRadius: 3,
  },
  sheetHeader: {
    marginBottom: spacing(16),
    paddingBottom: spacing(14),
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  badgeCategory: {
    backgroundColor: Colors.royalBlueMuted,
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(3),
    borderRadius: radius(6),
  },
  badgeCategoryText: {
    color: Colors.royalBlue,
    fontSize: rfs(11),
    fontWeight: "bold",
  },
  buyerCard: {
    backgroundColor: "#ffffff",
    borderRadius: radius(16),
    padding: spacing(14),
    marginBottom: spacing(12),
    borderWidth: 1.5,
    borderColor: "rgba(43, 120, 228, 0.15)",
    ...Shadow.card,
  },
  buyerCardActive: {
    borderColor: Colors.royalBlue,
  },
  timeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  buyerNameText: {
    fontSize: rfs(14),
    fontWeight: "800",
    color: Colors.navy,
  },
  summaryText: {
    fontSize: rfs(11.5),
    color: Colors.textMuted,
  },
  priceSummaryText: {
    fontSize: rfs(12.5),
    fontWeight: "800",
    color: Colors.royalBlue,
  },
  statusBadge: {
    paddingHorizontal: spacing(8),
    paddingVertical: spacing(3),
    borderRadius: radius(6),
  },
  statusBadgeText: {
    fontSize: rfs(10.5),
    fontWeight: "bold",
  },
  statusPaid: { backgroundColor: "rgba(34, 197, 94, 0.12)" },
  statusPaidText: { color: "#16a34a" },
  statusPreparing: { backgroundColor: "rgba(245, 158, 11, 0.12)" },
  statusPreparingText: { color: "#d97706" },
  statusPending: { backgroundColor: "rgba(59, 130, 246, 0.12)" },
  statusPendingText: { color: "#2563eb" },
  expandedContent: {
    marginTop: spacing(10),
    paddingTop: spacing(10),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: rfs(11.5),
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: rfs(12),
    color: Colors.textPrimary,
  },
  detailValueBold: {
    fontSize: rfs(12),
    color: Colors.textPrimary,
    fontWeight: "bold",
  },
  fishBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: radius(12),
    padding: spacing(12),
    borderWidth: 1,
    borderColor: Colors.divider,
    marginTop: spacing(6),
    marginBottom: spacing(8),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  noteText: {
    fontSize: rfs(11),
    color: Colors.textMuted,
    fontStyle: "italic",
    marginBottom: spacing(4),
  },
  btnWa: {
    flex: 1,
    backgroundColor: "#25D366",
    height: hp(38),
    borderRadius: radius(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnProcess: {
    flex: 1,
    backgroundColor: Colors.royalBlueMuted,
    height: hp(38),
    borderRadius: radius(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#ffffff",
    fontSize: rfs(12),
    fontWeight: "bold",
  },
});
