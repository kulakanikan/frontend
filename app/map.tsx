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
  DimensionValue,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect, Path, Circle } from "react-native-svg";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";
import { formatCurrency, formatWeight } from "../src/utils";
import { marketsApi } from "../src/services/api";
import { ApiMarket, ApiMarketBuyer, ApiMarketBuyerOrder } from "../src/services/mockData";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function FullScreenMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [markets, setMarkets] = useState<ApiMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedMarket, setSelectedMarket] = useState<ApiMarket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [expandedBuyerId, setExpandedBuyerId] = useState<string | null>(null);

  const sheetAnim = useRef(new Animated.Value(SCREEN_H)).current;

  useEffect(() => {
    loadMarkets();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "SELECT_MARKET") {
          const found = markets.find((m) => m.id === event.data.marketId);
          if (found) {
            openMarketDetail(found);
          }
        }
      };
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }
  }, [markets]);

  const loadMarkets = async () => {
    setLoading(true);
    try {
      const res = await marketsApi.list();
      setMarkets(res.markets);
    } catch (err) {
      console.error("Failed to load markets:", err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["Semua", "Pasar Tradisional", "TPI Pelelangan", "Pusat Restoran"];

  const filteredMarkets = markets.filter((m) => {
    const matchesSearch =
      m.namaPasar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.alamat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || m.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openMarketDetail = (market: ApiMarket) => {
    setSelectedMarket(market);
    setExpandedBuyerId(market.pembeliList[0]?.id || null);
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

  const handleOpenWa = (buyer: ApiMarketBuyer, marketName: string) => {
    const message = `Halo ${buyer.namaPembeli}, mengenai pesanan kulakan ikan Anda untuk pengiriman ke ${marketName}...`;
    const url = `https://api.whatsapp.com/send?phone=${buyer.telepon}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => console.warn("Cannot open WhatsApp"));
  };

  return (
    <View style={styles.container}>
      {/* 100% FULL-SCREEN MAP CANVAS BACKGROUND */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Render Leaflet OpenStreetMap in Web iframe or Vector Map tiles */}
        {Platform.OS === "web" ? (
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <style>
                  * { box-sizing: border-box; margin: 0; padding: 0; }
                  html, body, #map { width: 100vw; height: 100vh; margin: 0; padding: 0; overflow: hidden; background: #e5eaf0; }
                  .leaflet-container { font-family: system-ui, -apple-system, sans-serif; background: #e5eaf0; width: 100vw; height: 100vh; }
                  
                  .custom-pin-wrapper {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                  }
                  .custom-pin-card {
                    background: #ffffff;
                    color: #0A235C;
                    border: 1.5px solid rgba(43, 120, 228, 0.25);
                    border-radius: 20px;
                    padding: 6px 12px;
                    font-size: 12px;
                    font-weight: 800;
                    box-shadow: 0 4px 14px rgba(10, 35, 92, 0.18);
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                  }
                  .pin-svg-icon {
                    width: 14px;
                    height: 14px;
                    fill: #2B78E4;
                    flex-shrink: 0;
                  }
                  .pin-badge-circle {
                    position: absolute;
                    top: -7px;
                    right: -6px;
                    background: #2B78E4;
                    color: #ffffff;
                    width: 20px;
                    height: 20px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.18);
                  }
                </style>
              </head>
              <body style="margin:0;padding:0;overflow:hidden;width:100vw;height:100vh;">
                <div id="map" style="width:100vw;height:100vh;"></div>
                <script>
                  const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([-6.65, 110.68], 12);
                  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                  }).addTo(map);

                  const markets = ${JSON.stringify(filteredMarkets)};
                  markets.forEach(m => {
                    const customIcon = L.divIcon({
                      className: 'custom-div-icon',
                      html: '<div class="custom-pin-wrapper"><div class="custom-pin-card"><svg class="pin-svg-icon" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg><span>' + m.namaPasar + '</span></div><div class="pin-badge-circle">' + m.totalPesanan + '</div></div>',
                      iconSize: [140, 36],
                      iconAnchor: [70, 18]
                    });
                    const marker = L.marker([m.latitude, m.longitude], { icon: customIcon }).addTo(map);
                    marker.on('click', () => {
                      window.parent.postMessage({ type: 'SELECT_MARKET', marketId: m.id }, '*');
                    });
                  });
                </script>
              </body>
              </html>
            `}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              border: "none",
              margin: 0,
              padding: 0,
              outline: "none",
            } as any}
            title="Full Screen Map"
          />
        ) : (
          /* Native Vector Map Canvas fallback */
          <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
            <Rect width="100%" height="100%" fill="#E1F0FA" />
            {/* Coastal Waters */}
            <Path d="M0,0 Q180,120 400,80 L400,0 Z" fill="#6DB0FF" opacity="0.35" />
            <Path d="M0,0 Q140,80 400,40 L400,0 Z" fill="#2B78E4" opacity="0.25" />
            {/* Roads */}
            <Path d="M-50,400 Q150,300 450,380" stroke="#FFFFFF" strokeWidth="16" fill="none" opacity="0.9" />
            <Path d="M-50,400 Q150,300 450,380" stroke="#CBD5E1" strokeWidth="12" fill="none" />
            <Path d="M200,-50 Q220,400 180,850" stroke="#FFFFFF" strokeWidth="12" fill="none" opacity="0.9" />
            <Path d="M200,-50 Q220,400 180,850" stroke="#CBD5E1" strokeWidth="8" fill="none" />
            <Path d="M80,200 Q280,500 350,750" stroke="#E2E8F0" strokeWidth="6" fill="none" />
          </Svg>
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
          if (filteredMarkets.length > 0) {
            openMarketDetail(filteredMarkets[0]);
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
            </View>

            {/* List of Buyers & Fish Orders (Accordion Format) */}
            <Text style={{ ...Type.h2, fontSize: rfs(15), marginBottom: spacing(12) }}>
              Daftar Pembeli & Pesanan Ikan ({selectedMarket.pembeliList.length})
            </Text>

            {selectedMarket.pembeliList.map((buyer: ApiMarketBuyer) => {
              const isExpanded = expandedBuyerId === buyer.id;
              const fishSummary = buyer.itemPesanan.map((i: ApiMarketBuyerOrder) => `${i.jenisIkan} (${formatWeight(i.beratKg)})`).join(", ");

              return (
                <View key={buyer.id} style={[styles.buyerCard, isExpanded && styles.buyerCardActive]}>
                  {/* Clickable Header Area */}
                  <TouchableOpacity
                    onPress={() => setExpandedBuyerId(isExpanded ? null : buyer.id)}
                    activeOpacity={0.8}
                    style={{ width: "100%" }}
                  >
                    {/* Row 1: Name & Chevron */}
                    <View style={styles.topRow}>
                      <View style={styles.timeGroup}>
                        <Ionicons name="person" size={iconSize(15)} color={Colors.navy} />
                        <Text style={styles.buyerNameText} numberOfLines={1}>
                          {buyer.namaPembeli}
                        </Text>
                      </View>

                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={iconSize(18)}
                        color={Colors.navy}
                      />
                    </View>

                    {/* Row 2: Fish Summary */}
                    <View style={{ marginTop: spacing(4), gap: 3 }}>
                      <View style={[SharedStyles.row, { gap: 5 }]}>
                        <Ionicons name="fish" size={iconSize(13)} color={Colors.textMuted} />
                        <Text style={styles.summaryText} numberOfLines={1}>
                          {fishSummary}
                        </Text>
                      </View>

                      {/* Row 3: Total & Status */}
                      <View style={[SharedStyles.row, { justifyContent: "space-between", marginTop: 2 }]}>
                        <View style={[SharedStyles.row, { gap: 5 }]}>
                          <Ionicons name="cash" size={iconSize(13)} color={Colors.royalBlue} />
                          <Text style={styles.priceSummaryText}>
                            {formatCurrency(buyer.totalHarga)}
                          </Text>
                        </View>

                        <View style={[styles.statusBadge, buyer.statusPesanan === "Lunas / Selesai" ? styles.statusPaid : buyer.statusPesanan === "Disiapkan" ? styles.statusPreparing : styles.statusPending]}>
                          <Text style={[styles.statusBadgeText, buyer.statusPesanan === "Lunas / Selesai" ? styles.statusPaidText : buyer.statusPesanan === "Disiapkan" ? styles.statusPreparingText : styles.statusPendingText]}>
                            {buyer.statusPesanan}
                          </Text>
                        </View>
                      </View>
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
                        <Text style={styles.detailValueBold}>{buyer.tipePembeli}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={[SharedStyles.row, { gap: 5 }]}>
                          <Ionicons name="call" size={iconSize(13)} color={Colors.navy} />
                          <Text style={styles.detailLabel}>No. Telepon:</Text>
                        </View>
                        <Text style={styles.detailValue}>{buyer.telepon}</Text>
                      </View>

                      {/* Fish Items Table */}
                      <View style={styles.fishBox}>
                        <View style={[SharedStyles.row, { gap: 5, marginBottom: 6 }]}>
                          <Ionicons name="fish" size={iconSize(14)} color={Colors.navy} />
                          <Text style={{ color: Colors.textMuted, fontSize: rfs(11), fontWeight: "700" }}>
                            RINCIAN PESANAN IKAN:
                          </Text>
                        </View>
                        {buyer.itemPesanan.map((item: ApiMarketBuyerOrder, idx: number) => (
                          <View key={idx} style={[SharedStyles.row, { justifyContent: "space-between", paddingVertical: 3 }]}>
                            <Text style={{ color: Colors.textPrimary, fontSize: rfs(12.5), fontWeight: "bold" }}>
                              • {item.jenisIkan} ({formatWeight(item.beratKg)})
                            </Text>
                            <Text style={{ color: Colors.navy, fontSize: rfs(12.5), fontWeight: "800" }}>
                              {formatCurrency(item.subtotal)}
                            </Text>
                          </View>
                        ))}

                        <View style={styles.totalRow}>
                          <Text style={{ color: Colors.textPrimary, fontSize: rfs(12), fontWeight: "bold" }}>
                            Total Pesanan:
                          </Text>
                          <Text style={{ color: Colors.royalBlue, fontSize: rfs(14), fontWeight: "900" }}>
                            {formatCurrency(buyer.totalHarga)}
                          </Text>
                        </View>
                      </View>

                      {buyer.catatan && (
                        <View style={[SharedStyles.row, { gap: 5, marginTop: 4 }]}>
                          <Ionicons name="document-text" size={iconSize(13)} color={Colors.textMuted} />
                          <Text style={styles.noteText}>Catatan: "{buyer.catatan}"</Text>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View style={[SharedStyles.row, { gap: 10, marginTop: spacing(12) }]}>
                        <TouchableOpacity
                          onPress={() => handleOpenWa(buyer, selectedMarket.namaPasar)}
                          style={styles.btnWa}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="logo-whatsapp" size={iconSize(16)} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={styles.btnText}>Hubungi WA</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            closeMarketDetail();
                            router.push("/tambah");
                          }}
                          style={styles.btnProcess}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="cart" size={iconSize(16)} color={Colors.royalBlue} style={{ marginRight: 6 }} />
                          <Text style={{ color: Colors.royalBlue, fontSize: rfs(12), fontWeight: "bold" }}>
                            Proses Transaksi
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
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
