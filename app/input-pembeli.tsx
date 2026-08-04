import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
import { useFishStore, useBuyerStore, useTransactionStore, useMarketsStore } from "../src/store";
import { FishStock } from "../src/types";
import { formatCurrency, formatWeight } from "../src/utils";
import { deliverySchedulesApi } from "../src/services/api";
import VoiceInputModal from "../src/components/VoiceInputModal";
import GoogleDateTimePickerModal from "../src/components/GoogleDateTimePickerModal";

export default function InputPembeliScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Zustand Stores
  const { fishStocks, fetchStocks } = useFishStore();
  const { buyers, fetchBuyers, addBuyer } = useBuyerStore();
  const { createSale } = useTransactionStore();
  const { markets, fetchMarkets } = useMarketsStore();

  // Form State Data initialized from route params (supports AI Voice pre-fill)
  const [buyerName, setBuyerName] = useState((params.buyer_name as string) || "");
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [fishName, setFishName] = useState((params.jenis_ikan as string) || "");
  const [showFishModal, setShowFishModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFishQuery, setSearchFishQuery] = useState("");

  // New buyer modal states
  const [showNewBuyerModal, setShowNewBuyerModal] = useState(false);
  const [newBuyerName, setNewBuyerName] = useState("");
  const [newBuyerPhone, setNewBuyerPhone] = useState("");
  const [isSavingBuyer, setIsSavingBuyer] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [quantity, setQuantity] = useState((params.berat as string) || "");
  const [sellPrice, setSellPrice] = useState((params.harga_jual_per_kg as string) || "");
  const [paymentMethod, setPaymentMethod] = useState<"lunas" | "tempo">((params.status_bayar as "lunas" | "tempo") || "lunas");

  // Market Location state
  const [selectedMarketName, setSelectedMarketName] = useState((params.lokasi_pasar as string) || "Pasar Ratu Jepara");
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [searchMarketQuery, setSearchMarketQuery] = useState("");

  // Delivery Schedule state
  const getTodayStr = () => new Date().toISOString().split("T")[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };
  const getLusaStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  };

  const [enableDeliverySchedule, setEnableDeliverySchedule] = useState<boolean>(true);
  const [deliveryDate, setDeliveryDate] = useState<string>(getTodayStr());
  const [deliveryTime, setDeliveryTime] = useState<string>("05:30");
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");
  const [showGooglePicker, setShowGooglePicker] = useState<boolean>(false);

  const filteredMarketsList = markets.filter(
    (m) =>
      m.namaPasar.toLowerCase().includes(searchMarketQuery.toLowerCase()) ||
      m.alamat.toLowerCase().includes(searchMarketQuery.toLowerCase())
  );

  // Interactive Map Picker state
  const [showMapPickerModal, setShowMapPickerModal] = useState(false);
  const [pickedMarketName, setPickedMarketName] = useState("Pasar Mlonggo Jepara");
  const [detailAddress, setDetailAddress] = useState("");
  const [pickedCoords, setPickedCoords] = useState({ lat: -6.521, lng: 110.712 });

  useEffect(() => {
    if (Platform.OS === "web") {
      const handlePickerMessage = (event: MessageEvent) => {
        if (event.data?.type === "PICKED_LOCATION") {
          const { lat, lng, name } = event.data;
          setPickedCoords({ lat: Number(lat), lng: Number(lng) });
          if (name) {
            setPickedMarketName(name);
          } else {
            if (lat < -6.65) {
              setPickedMarketName(`Pasar Kedung (${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)})`);
            } else if (lat < -6.55) {
              setPickedMarketName(`Pasar Tahunan (${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)})`);
            } else {
              setPickedMarketName(`Pasar Mlonggo (${Number(lat).toFixed(3)}, ${Number(lng).toFixed(3)})`);
            }
          }
        }
      };
      window.addEventListener("message", handlePickerMessage);
      return () => window.removeEventListener("message", handlePickerMessage);
    }
  }, []);

  const handleConfirmMapPicker = () => {
    const fullLoc = detailAddress.trim()
      ? `${pickedMarketName} (${detailAddress.trim()})`
      : pickedMarketName;
    setSelectedMarketName(fullLoc);
    setShowMapPickerModal(false);
  };

  const handleSelectMarket = (market: { id: string; namaPasar: string }) => {
    setSelectedMarketName(market.namaPasar);
    setSelectedMarketId(market.id);
    setShowMarketModal(false);
  };

  // Voice AI Modal state
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Form validations
  const [errors, setErrors] = useState<Record<string, string>>({});

  interface SaleExtraItem {
    nama_item: string;
    jumlah: number;
    harga_satuan: number;
  }
  const [extras, setExtras] = useState<SaleExtraItem[]>([]);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraName, setExtraName] = useState("");
  const [extraQty, setExtraQty] = useState("");
  const [extraPrice, setExtraPrice] = useState("");

  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleVoiceSuccess = (suggestion: any) => {
    if (suggestion.nama_pembeli) setBuyerName(suggestion.nama_pembeli);
    if (suggestion.jenis_ikan) setFishName(suggestion.jenis_ikan);
    if (suggestion.berat_jual !== null) setQuantity(String(suggestion.berat_jual));
    if (suggestion.harga_satuan !== null) setSellPrice(String(suggestion.harga_satuan));
    if (suggestion.status_bayar) setPaymentMethod(suggestion.status_bayar === "tempo" ? "tempo" : "lunas");
  };

  useEffect(() => {
    fetchStocks().catch((err) => console.error(err));
    fetchBuyers().catch((err) => console.error(err));
    fetchMarkets().catch((err) => console.error(err));
  }, [fetchStocks, fetchBuyers, fetchMarkets]);

  // Auto-set price if fishName is pre-filled from Voice but price was not parsed
  useEffect(() => {
    if (fishName && fishStocks.length > 0 && !sellPrice) {
      const match = fishStocks.find(
        (fs) => fs.fish_type.name.toLowerCase() === fishName.toLowerCase()
      );
      if (match) {
        setSellPrice(String(match.sell_price || match.buy_price));
      }
    }
  }, [fishName, fishStocks, sellPrice]);



  // Filter customers for dropdown search
  const filteredCustomers = buyers.filter((b) =>
    b.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter unique fish types in stock for dropdown search
  const uniqueStockFish = Array.from(
    new Set(fishStocks.map((fs) => fs.fish_type.name))
  ).map((name) => {
    return fishStocks.find((fs) => fs.fish_type.name === name)!;
  });

  const filteredFishStocks = uniqueStockFish.filter((fs) =>
    fs.fish_type.name.toLowerCase().includes(searchFishQuery.toLowerCase())
  );

  // Auto-fill logic when selecting an existing customer
  const handleSelectCustomer = (custName: string) => {
    setBuyerName(custName);
    setShowBuyerModal(false);
  };

  const handleSelectFish = (stockItem: FishStock) => {
    setFishName(stockItem.fish_type.name);
    setSellPrice(String(stockItem.sell_price || stockItem.buy_price));
    setShowFishModal(false);
  };

  const handleCreateBuyer = async () => {
    if (!newBuyerName.trim()) {
      alert("Nama pembeli wajib diisi");
      return;
    }

    setIsSavingBuyer(true);
    try {
      const created = await addBuyer({
        nama: newBuyerName.trim(),
        telepon: newBuyerPhone.trim() || undefined,
        tipe_pembeli: "perorangan",
        market_id: selectedMarketId,
      });
      setBuyerName(created.nama);
      setShowNewBuyerModal(false);
      setShowBuyerModal(false);
      setNewBuyerName("");
      setNewBuyerPhone("");
    } catch (err) {
      alert("Gagal menambahkan pembeli");
    } finally {
      setIsSavingBuyer(false);
    }
  };

  const calculateTotal = () => {
    const qty = Number(quantity) || 0;
    const price = Number(sellPrice) || 0;
    const extrasTotal = extras.reduce((sum, item) => sum + (item.jumlah * item.harga_satuan), 0);
    return (qty * price) + extrasTotal;
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!buyerName.trim()) newErrors.buyerName = "Nama pembeli wajib diisi";
    if (!fishName.trim()) newErrors.fishName = "Nama ikan wajib diisi";
    
    const qtyNum = Number(quantity);
    if (!quantity.trim() || isNaN(qtyNum) || qtyNum <= 0) {
      newErrors.quantity = "Total berat ikan harus berupa angka lebih dari 0";
    }

    const priceNum = Number(sellPrice);
    if (!sellPrice.trim() || isNaN(priceNum) || priceNum <= 0) {
      newErrors.sellPrice = "Harga per Kg wajib diisi";
    }

    // Match fish stock to get its batch UUID
    const matchedFish = fishStocks.find(
      (fs) => fs.fish_type.name.toLowerCase() === fishName.trim().toLowerCase()
    );

    if (!matchedFish) {
      newErrors.fishName = "Ikan wajib dipilih dari stok tersedia di gudang";
    } else if (matchedFish.quantity < qtyNum) {
      newErrors.quantity = `Stok di gudang tidak mencukupi (Tersedia: ${matchedFish.quantity} Kg)`;
    }

    // Delivery Schedule Validation: If deliveryDate is TODAY, jam/time is REQUIRED
    if (enableDeliverySchedule) {
      const todayStr = getTodayStr();
      const isToday = deliveryDate.trim() === todayStr;
      if (isToday && !deliveryTime.trim()) {
        newErrors.deliveryTime = "Jam pengantaran wajib diisi jika tanggal pengiriman adalah hari ini";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    try {
      // 1. Create or match customer/buyer first
      const matchedBuyer = buyers.find(
        (b) => b.nama.toLowerCase() === buyerName.trim().toLowerCase()
      );
      let buyerId = "";
      if (matchedBuyer) {
        buyerId = matchedBuyer.id;
      } else {
        const created = await addBuyer({
          nama: buyerName.trim(),
          tipe_pembeli: "perorangan",
          market_id: selectedMarketId,
        });
        buyerId = created.id;
      }

      // 2. Submit transaction to database
      const newSale = await createSale({
        batch_id: matchedFish!.id,
        buyer_id: buyerId,
        berat_jual: qtyNum,
        harga_satuan: priceNum,
        status_bayar: paymentMethod,
        tanggal: new Date().toISOString(),
        extras: extras,
        market_id: selectedMarketId,
      });

      // 3. Create delivery schedule if enabled
      if (enableDeliverySchedule && newSale.id) {
        try {
          const targetDateStr = deliveryDate.trim() || getTodayStr();
          const timeParts = deliveryTime.trim().split(":");
          const hours = Number(timeParts[0]) || 5;
          const minutes = Number(timeParts[1]) || 30;

          const schedDate = new Date(targetDateStr);
          if (isNaN(schedDate.getTime())) {
            schedDate.setTime(Date.now());
          }
          schedDate.setHours(hours, minutes, 0, 0);

          await deliverySchedulesApi.create(newSale.id, {
            scheduled_at: schedDate.toISOString(),
            catatan: deliveryNotes.trim() || `Pengantaran ke ${selectedMarketName}`,
          });
        } catch (schedErr) {
          console.warn("Could not save delivery schedule:", schedErr);
        }
      }

      // Show success modal and navigate to receipt or transaction history
      setShowSuccess(true);
      timerRef.current = setTimeout(() => {
        setShowSuccess(false);
        if (newSale?.receipt?.id) {
          router.replace(`/receipts/${newSale.receipt.id}`);
        } else {
          router.replace("/transactions");
        }
      }, 1400);
    } catch (err: any) {
      alert(err?.message || "Gagal menyimpan transaksi");
    }
  };

  return (
    <SafeAreaView style={SharedStyles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={SharedStyles.header}>
          <View style={SharedStyles.row}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                ...SharedStyles.backButton,
                backgroundColor: pressed ? "rgba(0,0,0,0.05)" : "transparent",
              })}
            >
              <Ionicons name="chevron-back" size={iconSize(24)} color={Colors.textPrimary} />
            </Pressable>
            <Text style={Type.headerTitle}>Input Transaksi</Text>
          </View>
        </View>

        <ScrollView
          style={SharedStyles.content}
          contentContainerStyle={{ padding: spacing(16), paddingBottom: spacing(40) }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Form */}
          <View style={SharedStyles.formCard}>
            
            {/* Buyer Name Input Selector Modal style */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Nama Pembeli *
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setShowBuyerModal(true);
                }}
                activeOpacity={0.7}
                style={{
                  height: 48,
                  backgroundColor: "#e5eaf7",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: errors.buyerName ? 1 : 0,
                  borderColor: "#ef4444",
                }}
              >
                <Text style={{ color: buyerName ? "#00072d" : "#64748b", fontSize: 14 }}>
                  {buyerName || "Pilih Pembeli"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>
              {errors.buyerName && (
                <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.buyerName}</Text>
              )}
            </View>

            {/* Product selection (Ikan Apa) Selector Modal style */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Ikan Apa / Produk *
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchFishQuery("");
                  setShowFishModal(true);
                }}
                activeOpacity={0.7}
                style={{
                  height: 48,
                  backgroundColor: "#e5eaf7",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: errors.fishName ? 1 : 0,
                  borderColor: "#ef4444",
                }}
              >
                <Text style={{ color: fishName ? "#00072d" : "#64748b", fontSize: 14 }}>
                  {fishName ? `Ikan ${fishName}` : "Pilih Ikan / Produk"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>
              {errors.fishName && (
                <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.fishName}</Text>
              )}
            </View>

            {/* Quantity / Weight */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Total Berat Ikan (Kg) *
              </Text>
              <TextInput
                style={{
                  height: 46,
                  backgroundColor: "#e5eaf7",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  fontSize: 14,
                  color: "#00072d",
                  borderWidth: errors.quantity ? 1 : 0,
                  borderColor: "#ef4444",
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#64748b"
                value={quantity}
                onChangeText={setQuantity}
              />
              {errors.quantity && (
                <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.quantity}</Text>
              )}
            </View>

            {/* Price Per Unit */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Harga per Kg (Rp) *
              </Text>
              <TextInput
                style={{
                  height: 46,
                  backgroundColor: "#e5eaf7",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  fontSize: 14,
                  color: "#00072d",
                  borderWidth: errors.sellPrice ? 1 : 0,
                  borderColor: "#ef4444",
                }}
                keyboardType="numeric"
                placeholder="Rp 0"
                placeholderTextColor="#64748b"
                value={sellPrice}
                onChangeText={setSellPrice}
              />
              {errors.sellPrice && (
                <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.sellPrice}</Text>
              )}
            </View>

            {/* Payment Status (Toggle) */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Status Pembayaran *
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => setPaymentMethod("lunas")}
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: paymentMethod === "lunas" ? "#22c55e" : "#e5eaf7",
                  }}
                >
                  <Text
                    style={{
                      color: paymentMethod === "lunas" ? "#ffffff" : "#051650",
                      fontWeight: "bold",
                    }}
                  >
                    LUNAS
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentMethod("tempo")}
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: paymentMethod === "tempo" ? "#ef4444" : "#e5eaf7",
                  }}
                >
                  <Text
                    style={{
                      color: paymentMethod === "tempo" ? "#ffffff" : "#051650",
                      fontWeight: "bold",
                    }}
                  >
                    TEMPO
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Market Location Field */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Lokasi Pasar *
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchMarketQuery("");
                  setShowMarketModal(true);
                }}
                activeOpacity={0.7}
                style={{
                  height: 48,
                  backgroundColor: "#e5eaf7",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: errors.marketLocation ? 1 : 0,
                  borderColor: "#ef4444",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <Ionicons name="location" size={iconSize(18)} color={Colors.navy} />
                  <Text style={{ color: selectedMarketName ? "#00072d" : "#64748b", fontSize: 14, fontWeight: "600" }} numberOfLines={1}>
                    {selectedMarketName || "Pilih Lokasi Pasar"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>
              {errors.marketLocation && (
                <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.marketLocation}</Text>
              )}
            </View>

            {/* Jam & Jadwal Pengantaran Ke Pasar */}
            <View style={{ marginBottom: 20, backgroundColor: "#f0f4ff", padding: 14, borderRadius: radius(16), borderWidth: 1, borderColor: "rgba(43, 120, 228, 0.2)" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.royalBlue} />
                  <Text style={{ color: Colors.navy, fontSize: 14, fontWeight: "bold" }}>
                    Jadwal & Jam Pengantaran
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEnableDeliverySchedule(!enableDeliverySchedule)}>
                  <Ionicons name={enableDeliverySchedule ? "checkbox" : "square-outline"} size={22} color={Colors.navy} />
                </TouchableOpacity>
              </View>

              {enableDeliverySchedule && (
                <View style={{ gap: 12 }}>
                  <Text style={{ color: Colors.textMuted, fontSize: rfs(11.5) }}>
                    Pilih tanggal kalender & jam circular ala Google untuk pengingat pengantaran.
                  </Text>

                  {/* Google Material Picker Trigger Button */}
                  <TouchableOpacity
                    onPress={() => setShowGooglePicker(true)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: radius(12),
                      padding: 14,
                      borderWidth: errors.deliveryTime ? 1.5 : 1,
                      borderColor: errors.deliveryTime ? "#ef4444" : Colors.royalBlue,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ gap: 2 }}>
                      <Text style={{ fontSize: rfs(11), color: Colors.textMuted, fontWeight: "600" }}>
                        Tanggal & Jam Terpilih:
                      </Text>
                      <Text style={{ fontSize: rfs(13.5), color: Colors.navy, fontWeight: "bold" }}>
                        📅 {deliveryDate}  ⏰ {deliveryTime} WIB
                      </Text>
                    </View>
                    <View style={{ backgroundColor: "rgba(43, 120, 228, 0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius(8) }}>
                      <Text style={{ color: Colors.royalBlue, fontSize: rfs(11.5), fontWeight: "bold" }}>Ubah</Text>
                    </View>
                  </TouchableOpacity>

                  {errors.deliveryTime && (
                    <Text style={{ color: "#ef4444", fontSize: 11, marginTop: -4 }}>{errors.deliveryTime}</Text>
                  )}

                  {/* Optional Notes */}
                  <View style={{ marginTop: 2 }}>
                    <Text style={{ color: Colors.navy, fontSize: rfs(12), fontWeight: "600", marginBottom: 6 }}>
                      Catatan Pengantaran (Opsional)
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        height: 42,
                        fontSize: rfs(12),
                        color: Colors.navy,
                        borderWidth: 1,
                        borderColor: Colors.divider,
                      }}
                      placeholder="Misal: Titip lapak no 12 / WA sebelum sampai"
                      placeholderTextColor="#94a3b8"
                      value={deliveryNotes}
                      onChangeText={setDeliveryNotes}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* GOOGLE MATERIAL DATETIME PICKER MODAL */}
            <GoogleDateTimePickerModal
              visible={showGooglePicker}
              onClose={() => setShowGooglePicker(false)}
              onConfirm={(dStr, tStr) => {
                setDeliveryDate(dStr);
                setDeliveryTime(tStr);
              }}
              minimumDate={new Date()}
            />

             {/* Biaya Tambahan / Extras Section */}
            <View style={{ marginBottom: 20, borderTopWidth: 1, borderTopColor: "#e5eaf7", paddingTop: 16 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Biaya Tambahan / Extras (Opsional)
              </Text>
              
              {extras.length === 0 ? (
                <Text style={{ color: Colors.textMuted, fontSize: rfs(12), fontStyle: "italic", marginBottom: 12 }}>
                  Belum ada biaya tambahan (misal: es batu, plastik, ongkir).
                </Text>
              ) : (
                <View style={{ marginBottom: 12 }}>
                  {extras.map((item, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#f8fafc",
                        padding: 10,
                        borderRadius: radius(8),
                        marginBottom: 6,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#00072d", fontSize: rfs(13), fontWeight: "600" }}>
                          {item.nama_item}
                        </Text>
                        <Text style={{ color: Colors.textMuted, fontSize: rfs(11) }}>
                          {item.jumlah}x @ {formatCurrency(item.harga_satuan)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <Text style={{ color: "#00072d", fontSize: rfs(13), fontWeight: "bold" }}>
                          {formatCurrency(item.jumlah * item.harga_satuan)}
                        </Text>
                        <Pressable
                          onPress={() => {
                            setExtras(extras.filter((_, i) => i !== idx));
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Toggle Inline Extra Form */}
              {!showExtraForm ? (
                <Pressable
                  onPress={() => setShowExtraForm(true)}
                  style={{
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    backgroundColor: "rgba(43, 120, 228, 0.1)",
                    borderRadius: radius(8),
                  }}
                >
                  <Ionicons name="add-circle-outline" size={16} color={Colors.royalBlue} />
                  <Text style={{ color: Colors.royalBlue, fontSize: rfs(12), fontWeight: "700" }}>
                    Tambah Biaya Lainnya
                  </Text>
                </Pressable>
              ) : (
                <View style={{ backgroundColor: "#f0f4fc", padding: 12, borderRadius: radius(12), borderWidth: 1, borderColor: "rgba(43, 120, 228, 0.2)" }}>
                  <Text style={{ color: "#00072d", fontSize: rfs(12), fontWeight: "bold", marginBottom: 8 }}>
                    Form Biaya Tambahan
                  </Text>
                  <TextInput
                    style={{
                      height: 38,
                      backgroundColor: "#ffffff",
                      borderRadius: radius(8),
                      paddingHorizontal: 10,
                      fontSize: rfs(12),
                      color: "#00072d",
                      marginBottom: 8,
                    }}
                    placeholder="Nama item (misal: Es Batu, Plastik)"
                    placeholderTextColor="#94a3b8"
                    value={extraName}
                    onChangeText={setExtraName}
                  />
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                    <TextInput
                      style={{
                        flex: 1,
                        height: 38,
                        backgroundColor: "#ffffff",
                        borderRadius: radius(8),
                        paddingHorizontal: 10,
                        fontSize: rfs(12),
                        color: "#00072d",
                      }}
                      placeholder="Jumlah"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={extraQty}
                      onChangeText={setExtraQty}
                    />
                    <TextInput
                      style={{
                        flex: 2,
                        height: 38,
                        backgroundColor: "#ffffff",
                        borderRadius: radius(8),
                        paddingHorizontal: 10,
                        fontSize: rfs(12),
                        color: "#00072d",
                      }}
                      placeholder="Harga Satuan (Rp)"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={extraPrice}
                      onChangeText={setExtraPrice}
                    />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
                    <Pressable
                      onPress={() => {
                        setShowExtraForm(false);
                        setExtraName("");
                        setExtraQty("");
                        setExtraPrice("");
                      }}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: radius(6),
                        backgroundColor: "#e2e8f0",
                      }}
                    >
                      <Text style={{ color: Colors.textSecondary, fontSize: rfs(11), fontWeight: "bold" }}>
                        Batal
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (!extraName.trim()) {
                          alert("Nama item wajib diisi");
                          return;
                        }
                        const eqty = Number(extraQty);
                        if (!extraQty.trim() || isNaN(eqty) || eqty <= 0) {
                          alert("Jumlah harus berupa angka lebih dari 0");
                          return;
                        }
                        const eprice = Number(extraPrice);
                        if (!extraPrice.trim() || isNaN(eprice) || eprice <= 0) {
                          alert("Harga harus berupa angka lebih dari 0");
                          return;
                        }
                        setExtras([...extras, {
                          nama_item: extraName.trim(),
                          jumlah: eqty,
                          harga_satuan: eprice,
                        }]);
                        setExtraName("");
                        setExtraQty("");
                        setExtraPrice("");
                        setShowExtraForm(false);
                      }}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: radius(6),
                        backgroundColor: Colors.royalBlue,
                      }}
                    >
                      <Text style={{ color: "#ffffff", fontSize: rfs(11), fontWeight: "bold" }}>
                        Tambah
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Total Transaction Price Display */}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#e5eaf7",
                paddingTop: 16,
                marginBottom: 24,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#64748b", fontSize: 14, fontWeight: "500" }}>
                Harga Total:
              </Text>
              <Text style={{ color: "#123499", fontSize: 20, fontWeight: "bold" }}>
                {formatCurrency(calculateTotal())}
              </Text>
            </View>
            {/* Action Buttons (Row Layout) */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowVoiceModal(true)}
                activeOpacity={0.7}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  backgroundColor: "#dce6ff",
                  borderWidth: 2,
                  borderColor: "#123499",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="mic" size={24} color="#123499" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  height: 50,
                  backgroundColor: "#123499",
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  elevation: 3,
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold" }}>
                  Simpan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Success Modal Overlay */}
        {showSuccess && (
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(0, 7, 45, 0.8)",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
            }}
          >
            <View
              style={{
                width: 260,
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 30,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "#22c55e",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Ionicons name="checkmark" size={36} color="#ffffff" />
              </View>
              <Text style={{ color: "#00072d", fontSize: 18, fontWeight: "bold", textAlign: "center" }}>
                Transaksi Berhasil!
              </Text>
              <Text style={{ color: "#64748b", fontSize: 12, marginTop: 6, textAlign: "center" }}>
                Data transaksi disimpan dan stok gudang dideputasikan.
              </Text>
            </View>
          </View>
        )}
        {/* MODAL: SELECT BUYER */}
        <Modal visible={showBuyerModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0, 7, 45, 0.5)", justifyContent: "flex-end" }}>
            <View style={{
              height: "75%",
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              padding: 20,
            }}>
              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ color: "#00072d", fontSize: 18, fontWeight: "bold" }}>Pilih Pembeli</Text>
                <Pressable onPress={() => setShowBuyerModal(false)}>
                  <Ionicons name="close-circle" size={26} color="#64748b" />
                </Pressable>
              </View>

              {/* Add New Button */}
              <TouchableOpacity
                onPress={() => setShowNewBuyerModal(true)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(43, 120, 228, 0.08)",
                  height: 46,
                  borderRadius: 12,
                  marginBottom: 16,
                  borderWidth: 1.5,
                  borderColor: Colors.royalBlue,
                  borderStyle: "dashed",
                }}
              >
                <Ionicons name="person-add" size={16} color={Colors.royalBlue} style={{ marginRight: 8 }} />
                <Text style={{ color: Colors.royalBlue, fontWeight: "bold", fontSize: 13 }}>Tambah Pembeli Baru</Text>
              </TouchableOpacity>

              {/* Search Bar */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f0f4f9",
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 42,
                marginBottom: 16,
              }}>
                <Ionicons name="search" size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, height: "100%", color: "#00072d", fontSize: 13 }}
                  placeholder="Cari pembeli..."
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectCustomer(item.nama)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: "transparent",
                      paddingVertical: 14,
                      paddingHorizontal: 6,
                      borderBottomWidth: 1,
                      borderBottomColor: "#e5eaf7",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold" }}>{item.nama}</Text>
                      <Text style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{item.telepon || "No Telepon tidak ada"}</Text>
                    </View>
                    {buyerName === item.nama && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={{ textAlign: "center", color: "#64748b", marginTop: 40, fontSize: 13 }}>
                    Pembeli tidak ditemukan.
                  </Text>
                }
              />
            </View>
          </View>
        </Modal>

        {/* MODAL: CREATE NEW BUYER */}
        <Modal visible={showNewBuyerModal} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: "rgba(0, 7, 45, 0.7)", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <View style={{ width: "100%", maxWidth: 330, backgroundColor: "#ffffff", borderRadius: 24, padding: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 }}>
              
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <Text style={{ color: "#00072d", fontSize: 17, fontWeight: "bold" }}>Tambah Pembeli Baru</Text>
                <Pressable onPress={() => setShowNewBuyerModal(false)}>
                  <Ionicons name="close" size={24} color="#00072d" />
                </Pressable>
              </View>

              {/* Name */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Nama Pembeli *</Text>
                <TextInput
                  style={{ height: 44, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                  placeholder="Nama pembeli"
                  placeholderTextColor="#64748b"
                  value={newBuyerName}
                  onChangeText={setNewBuyerName}
                />
              </View>

              {/* Phone */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>No. HP / Telepon</Text>
                <TextInput
                  style={{ height: 44, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                  placeholder="Contoh: 08123"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={newBuyerPhone}
                  onChangeText={setNewBuyerPhone}
                />
              </View>

              {/* Actions */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  disabled={isSavingBuyer}
                  onPress={() => setShowNewBuyerModal(false)}
                  activeOpacity={0.7}
                  style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: "#051650", alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: "#051650", fontWeight: "bold", fontSize: 13 }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={isSavingBuyer}
                  onPress={handleCreateBuyer}
                  activeOpacity={0.7}
                  style={{ flex: 1, height: 44, backgroundColor: "#123499", borderRadius: 12, alignItems: "center", justifyContent: "center" }}
                >
                  {isSavingBuyer ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 13 }}>Simpan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL: SELECT FISH/PRODUCT */}
        <Modal visible={showFishModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0, 7, 45, 0.5)", justifyContent: "flex-end" }}>
            <View style={{
              height: "75%",
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              padding: 20,
            }}>
              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ color: "#00072d", fontSize: 18, fontWeight: "bold" }}>Pilih Ikan / Produk</Text>
                <Pressable onPress={() => setShowFishModal(false)}>
                  <Ionicons name="close-circle" size={26} color="#64748b" />
                </Pressable>
              </View>

              {/* Search Bar */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f0f4f9",
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 42,
                marginBottom: 16,
              }}>
                <Ionicons name="search" size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, height: "100%", color: "#00072d", fontSize: 13 }}
                  placeholder="Cari ikan..."
                  placeholderTextColor="#64748b"
                  value={searchFishQuery}
                  onChangeText={setSearchFishQuery}
                />
              </View>

              <FlatList
                data={filteredFishStocks}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectFish(item)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: "transparent",
                      paddingVertical: 14,
                      paddingHorizontal: 6,
                      borderBottomWidth: 1,
                      borderBottomColor: "#e5eaf7",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold" }}>Ikan {item.fish_type.name}</Text>
                      <Text style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                        Stok: {formatWeight(Number(item.quantity))} | Harga Beli: {formatCurrency(Number(item.buy_price))}/Kg
                      </Text>
                    </View>
                    {fishName === item.fish_type.name && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={{ textAlign: "center", color: "#64748b", marginTop: 40, fontSize: 13 }}>
                    Stok ikan tidak ditemukan atau kosong.
                  </Text>
                }
              />
            </View>
          </View>
        </Modal>

        {/* MODAL: SELECT MARKET LOCATION */}
        <Modal visible={showMarketModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0, 7, 45, 0.5)", justifyContent: "flex-end" }}>
            <View style={{
              height: "75%",
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              padding: 20,
            }}>
              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ color: "#00072d", fontSize: 18, fontWeight: "bold" }}>Pilih Lokasi Pasar Tujuan</Text>
                <Pressable onPress={() => setShowMarketModal(false)}>
                  <Ionicons name="close-circle" size={26} color="#64748b" />
                </Pressable>
              </View>



              {/* Search Bar */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f0f4f9",
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 42,
                marginBottom: 16,
              }}>
                <Ionicons name="search" size={16} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, height: "100%", color: "#00072d", fontSize: 13 }}
                  placeholder="Cari pasar atau ketik nama pasar baru..."
                  placeholderTextColor="#64748b"
                  value={searchMarketQuery}
                  onChangeText={setSearchMarketQuery}
                />
              </View>

              {/* Custom Location Option if Typed */}
              {searchMarketQuery.trim().length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSelectMarket({ id: "", namaPasar: searchMarketQuery.trim() })}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(43, 120, 228, 0.08)",
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: Colors.royalBlue,
                  }}
                >
                  <Ionicons name="location" size={18} color={Colors.royalBlue} style={{ marginRight: 8 }} />
                  <Text style={{ color: Colors.royalBlue, fontWeight: "bold", fontSize: 13, flex: 1 }}>
                    Gunakan lokasi: "{searchMarketQuery.trim()}"
                  </Text>
                </TouchableOpacity>
              )}

              <FlatList
                data={filteredMarketsList}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectMarket({ id: item.id, namaPasar: item.namaPasar })}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 6,
                      borderBottomWidth: 1,
                      borderBottomColor: "#e5eaf7",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="location" size={16} color={Colors.navy} />
                        <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold" }}>{item.namaPasar}</Text>
                      </View>
                      <Text style={{ color: "#64748b", fontSize: 11, marginTop: 2, marginLeft: 22 }}>
                        {item.alamat} • {item.kategori}
                      </Text>
                    </View>
                    {selectedMarketName === item.namaPasar && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>

        {/* MODAL: INTERACTIVE MAP LOCATION PICKER */}
        <Modal visible={showMapPickerModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "#ffffff", position: "relative" }}>
            {/* Floating Close Button */}
            <TouchableOpacity
              onPress={() => {
                setShowMapPickerModal(false);
                setShowMarketModal(true);
              }}
              activeOpacity={0.8}
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                zIndex: 2000,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#ffffff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={22} color={Colors.navy} />
            </TouchableOpacity>

            {/* Map Area */}
            <View style={{ flex: 1, position: "relative" }}>
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
                        html, body, #map { width: 100vw; height: 100vh; margin: 0; padding: 0; overflow: hidden; background: #e5eaf0; font-family: system-ui, -apple-system, sans-serif; }
                        .leaflet-container { width: 100vw; height: 100vh; }
                        .map-controls-box {
                          position: absolute;
                          top: 14px;
                          left: 62px;
                          right: 14px;
                          z-index: 1000;
                        }
                        .search-input {
                          width: 100%;
                          height: 40px;
                          background: #ffffff;
                          border: 1px solid #cbd5e1;
                          border-radius: 20px;
                          padding: 0 14px;
                          font-size: 13px;
                          color: #00072d;
                          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                          outline: none;
                        }
                        .gps-btn {
                          position: absolute;
                          bottom: 20px;
                          right: 14px;
                          z-index: 1000;
                          background: #ffffff;
                          width: 46px;
                          height: 46px;
                          border: 1.5px solid rgba(10, 35, 92, 0.15);
                          border-radius: 23px;
                          box-shadow: 0 4px 14px rgba(10,35,92,0.25);
                          cursor: pointer;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        }
                        .gps-btn:active {
                          transform: scale(0.92);
                        }
                      </style>
                    </head>
                    <body>
                      <div class="map-controls-box">
                        <input id="search-input" class="search-input" placeholder="Cari pasar..." />
                      </div>

                      <div id="map"></div>

                      <button class="gps-btn" onclick="locateUserGPS()" title="Lokasi GPS HP Saya">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0A235C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="7"/>
                          <line x1="12" y1="2" x2="12" y2="5"/>
                          <line x1="12" y1="19" x2="12" y2="22"/>
                          <line x1="2" y1="12" x2="5" y2="12"/>
                          <line x1="19" y1="12" x2="22" y2="12"/>
                          <circle cx="12" cy="12" r="2.5" fill="#0A235C"/>
                        </svg>
                      </button>

                      <script>
                        const map = L.map('map', { zoomControl: false }).setView([-6.65, 110.68], 13);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

                        const pushpinIcon = L.divIcon({
                          className: 'custom-pushpin-icon',
                          html: '<div style="position:relative;width:34px;height:34px;transform:translate(-50%,-100%);"><svg viewBox="0 0 24 24" width="34" height="34" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));"><path d="M12 13v9" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="7.5" r="5.5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/><circle cx="10.5" cy="6" r="1.6" fill="#ffffff" opacity="0.7"/></svg></div>',
                          iconSize: [34, 34],
                          iconAnchor: [17, 34]
                        });

                        let marker = L.marker([-6.65, 110.68], { icon: pushpinIcon, draggable: true }).addTo(map);

                        function reverseGeocode(lat, lng) {
                          fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng)
                            .then(res => res.json())
                            .then(data => {
                              let resolvedName = "Lokasi Peta (" + lat.toFixed(3) + ", " + lng.toFixed(3) + ")";
                              if (data && data.display_name) {
                                const parts = data.display_name.split(',');
                                resolvedName = parts.slice(0, 3).join(',').trim();
                              }
                              window.parent.postMessage({ type: 'PICKED_LOCATION', lat: lat, lng: lng, name: resolvedName }, '*');
                            })
                            .catch(() => {
                              window.parent.postMessage({ type: 'PICKED_LOCATION', lat: lat, lng: lng }, '*');
                            });
                        }

                        map.on('click', function(e) {
                          marker.setLatLng(e.latlng);
                          reverseGeocode(e.latlng.lat, e.latlng.lng);
                        });

                        marker.on('dragend', function(e) {
                          const latlng = marker.getLatLng();
                          reverseGeocode(latlng.lat, latlng.lng);
                        });

                        function locateUserGPS() {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              function(position) {
                                const lat = position.coords.latitude;
                                const lng = position.coords.longitude;
                                map.setView([lat, lng], 15);
                                marker.setLatLng([lat, lng]);
                                reverseGeocode(lat, lng);
                              },
                              function(error) {
                                alert("Akses GPS HP tidak tersedia / mohon izinkan akses lokasi.");
                              },
                              { enableHighAccuracy: true }
                            );
                          }
                        }

                        const searchInput = document.getElementById('search-input');
                        searchInput.addEventListener('keypress', function(e) {
                          if (e.key === 'Enter') {
                            const query = searchInput.value.trim();
                            if (!query) return;
                            fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query + ' Jepara'))
                              .then(res => res.json())
                              .then(data => {
                                if (data && data.length > 0) {
                                  const lat = parseFloat(data[0].lat);
                                  const lon = parseFloat(data[0].lon);
                                  const displayName = data[0].display_name.split(',')[0];
                                  map.setView([lat, lon], 15);
                                  marker.setLatLng([lat, lon]);
                                  sendLocation(lat, lon, displayName);
                                } else {
                                  alert('Pasar "' + query + '" tidak ditemukan.');
                                }
                              })
                              .catch(err => console.error(err));
                          }
                        });
                      </script>
                    </body>
                    </html>
                  `}
                  style={{ width: "100%", height: "100%", border: "none" } as any}
                  title="Map Picker"
                />
              ) : (
                <View style={{ flex: 1, backgroundColor: "#E1F0FA", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="map" size={48} color={Colors.royalBlue} />
                  <Text style={{ color: Colors.navy, fontWeight: "bold", marginTop: 8 }}>Tandai Lokasi Peta</Text>
                </View>
              )}

            </View>

            {/* Bottom Confirmation Card */}
            <View style={{
              backgroundColor: "#ffffff",
              padding: 18,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 10,
            }}>
              {/* Location Name Field */}
              <TextInput
                style={{
                  height: 44,
                  backgroundColor: "#e5eaf7",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  fontSize: 14,
                  fontWeight: "bold",
                  color: Colors.navy,
                  marginBottom: 10,
                }}
                value={pickedMarketName}
                onChangeText={setPickedMarketName}
                placeholder="Nama Pasar / Lokasi"
              />

              {/* Multiline Detail Address / Description Textarea Box */}
              <TextInput
                style={{
                  height: 72,
                  backgroundColor: "#f0f4f9",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingTop: 10,
                  paddingBottom: 10,
                  fontSize: 13,
                  color: "#00072d",
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  textAlignVertical: "top",
                  marginBottom: 14,
                }}
                multiline
                numberOfLines={3}
                value={detailAddress}
                onChangeText={setDetailAddress}
                placeholder="Detail alamat / patokan (opsional)..."
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                onPress={handleConfirmMapPicker}
                activeOpacity={0.85}
                style={{
                  backgroundColor: Colors.navy,
                  height: 46,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 13.5 }}>
                  Gunakan Lokasi Ini
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      <VoiceInputModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        formType="sale"
        onSuccess={handleVoiceSuccess}
      />
    </SafeAreaView>
  );
}
