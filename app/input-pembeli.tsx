import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
import { useFishStore, useBuyerStore, useTransactionStore } from "../src/store";
import { FishStock } from "../src/types";
import { formatCurrency, formatWeight } from "../src/utils";
import VoiceInputModal from "../src/components/VoiceInputModal";

export default function InputPembeliScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Zustand Stores
  const { fishStocks, fetchStocks } = useFishStore();
  const { buyers, fetchBuyers, addBuyer } = useBuyerStore();
  const { createSale } = useTransactionStore();

  // Form State Data initialized from route params (supports AI Voice pre-fill)
  const [buyerName, setBuyerName] = useState((params.buyer_name as string) || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [fishName, setFishName] = useState((params.jenis_ikan as string) || "");
  const [showFishDropdown, setShowFishDropdown] = useState(false);
  const [quantity, setQuantity] = useState((params.berat as string) || "");
  const [sellPrice, setSellPrice] = useState((params.harga_jual_per_kg as string) || "");
  const [paymentMethod, setPaymentMethod] = useState<"lunas" | "tempo">((params.status_bayar as "lunas" | "tempo") || "lunas");
  const [showSuccess, setShowSuccess] = useState(false);

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
  }, [fetchStocks, fetchBuyers]);

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
    b.nama.toLowerCase().includes(buyerName.toLowerCase())
  );

  // Filter unique fish types in stock for dropdown search
  const uniqueStockFish = Array.from(
    new Set(fishStocks.map((fs) => fs.fish_type.name))
  ).map((name) => {
    return fishStocks.find((fs) => fs.fish_type.name === name)!;
  });

  const filteredFishStocks = uniqueStockFish.filter((fs) =>
    fs.fish_type.name.toLowerCase().includes(fishName.toLowerCase())
  );

  // Auto-fill logic when selecting an existing customer
  const handleSelectCustomer = (custName: string) => {
    setBuyerName(custName);
    setShowDropdown(false);
  };

  const handleSelectFish = (stockItem: FishStock) => {
    setFishName(stockItem.fish_type.name);
    setSellPrice(String(stockItem.sell_price || stockItem.buy_price));
    setShowFishDropdown(false);
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
      });

      setShowSuccess(true);
      timerRef.current = setTimeout(() => {
        setShowSuccess(false);
        if (newSale.receipt?.id) {
          router.replace(`/receipts/${newSale.receipt.id}`);
        } else {
          router.replace("/transactions");
        }
      }, 1500);
    } catch (err) {
      alert("Gagal menyimpan transaksi");
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
            
            {/* Buyer Name Input with Autocomplete Dropdown */}
            <View style={{ marginBottom: 16, zIndex: 10 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Nama Pembeli *
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={{
                    height: 46,
                    backgroundColor: "#e5eaf7",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    fontSize: 14,
                    color: "#00072d",
                    borderWidth: errors.buyerName ? 1 : 0,
                    borderColor: "#ef4444",
                  }}
                  placeholder="Ketik nama pembeli..."
                  placeholderTextColor="#64748b"
                  value={buyerName}
                  onChangeText={(txt) => {
                    setBuyerName(txt);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                
                {showDropdown && filteredCustomers.length > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 50,
                      left: 0,
                      right: 0,
                      backgroundColor: "#ffffff",
                      borderRadius: radius(12),
                      borderWidth: 1.5,
                      borderColor: Colors.royalBlue,
                      maxHeight: 200,
                      overflow: "hidden",
                      elevation: 8,
                      shadowColor: Colors.navy,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 10,
                      zIndex: 9999,
                    }}
                  >
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {filteredCustomers.map((cust) => (
                        <Pressable
                          key={cust.id}
                          onPress={() => handleSelectCustomer(cust.nama)}
                          style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: spacing(12),
                            paddingHorizontal: spacing(16),
                            borderBottomWidth: 1,
                            borderBottomColor: "#e5eaf7",
                            backgroundColor: pressed ? "#e5eaf7" : "#ffffff",
                          })}
                        >
                          <Ionicons name="person-circle-outline" size={20} color={Colors.royalBlue} style={{ marginRight: 10 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: Colors.textPrimary, fontSize: rfs(14), fontWeight: "600" }}>
                              {cust.nama}
                            </Text>
                            {cust.telepon ? (
                              <Text style={{ color: Colors.textMuted, fontSize: rfs(11), marginTop: 2 }}>
                                {cust.telepon}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              {errors.buyerName && (
                <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.buyerName}</Text>
              )}
            </View>

            {/* Product selection (Ikan Apa) as TextInput */}
            <View style={{ marginBottom: 16, zIndex: 9 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Ikan Apa / Produk *
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={{
                    height: 46,
                    backgroundColor: "#e5eaf7",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    fontSize: 14,
                    color: "#00072d",
                    borderWidth: errors.fishName ? 1 : 0,
                    borderColor: "#ef4444",
                  }}
                  placeholder="Contoh: Tongkol, Kembung, Tuna"
                  placeholderTextColor="#64748b"
                  value={fishName}
                  onChangeText={(txt) => {
                    setFishName(txt);
                    setShowFishDropdown(true);
                  }}
                  onFocus={() => setShowFishDropdown(true)}
                />
                
                {showFishDropdown && filteredFishStocks.length > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 50,
                      left: 0,
                      right: 0,
                      backgroundColor: "#ffffff",
                      borderRadius: radius(12),
                      borderWidth: 1.5,
                      borderColor: Colors.royalBlue,
                      maxHeight: 200,
                      overflow: "hidden",
                      elevation: 8,
                      shadowColor: Colors.navy,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 10,
                      zIndex: 9999,
                    }}
                  >
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {filteredFishStocks.map((stock) => (
                        <Pressable
                          key={stock.id}
                          onPress={() => handleSelectFish(stock)}
                          style={({ pressed }) => ({
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: spacing(12),
                            paddingHorizontal: spacing(16),
                            borderBottomWidth: 1,
                            borderBottomColor: "#e5eaf7",
                            backgroundColor: pressed ? "#e5eaf7" : "#ffffff",
                          })}
                        >
                          <Ionicons name="fish-outline" size={20} color={Colors.royalBlue} style={{ marginRight: 10 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: Colors.textPrimary, fontSize: rfs(14), fontWeight: "600" }}>
                              Ikan {stock.fish_type.name}
                            </Text>
                            <Text style={{ color: Colors.textMuted, fontSize: rfs(11), marginTop: 2 }}>
                              Stok: {formatWeight(Number(stock.quantity))} | Harga Beli: {formatCurrency(Number(stock.buy_price))}/Kg
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
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
          </View>
        </ScrollView>

        {/* Sticky Bottom Action Buttons */}
        <View
          style={{
            backgroundColor: "#ffffff",
            paddingHorizontal: spacing(16),
            paddingVertical: spacing(12),
            borderTopWidth: 1.5,
            borderTopColor: "rgba(18, 52, 153, 0.1)",
            gap: 10,
            ...Shadow.card,
          }}
        >
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => ({
              height: 48,
              backgroundColor: pressed ? Colors.navyLight : Colors.navy,
              borderRadius: radius(12),
              alignItems: "center",
              justifyContent: "center",
              ...Shadow.button,
            })}
          >
            <Text style={{ color: "#ffffff", fontSize: rfs(15), fontWeight: "bold" }}>
              Simpan Transaksi
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowVoiceModal(true)}
            style={({ pressed }) => ({
              height: 48,
              backgroundColor: pressed ? "rgba(43, 120, 228, 0.2)" : "rgba(43, 120, 228, 0.1)",
              borderRadius: radius(12),
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(43, 120, 228, 0.25)",
              flexDirection: "row",
              gap: 8,
            })}
          >
            <Ionicons name="mic" size={20} color={Colors.royalBlue} />
            <Text style={{ color: Colors.royalBlue, fontSize: rfs(15), fontWeight: "bold" }}>
              Input via Suara (AI)
            </Text>
          </Pressable>
        </View>

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
      </KeyboardAvoidingView>

      <VoiceInputModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        formType="sale"
        onSuccess={handleVoiceSuccess}
      />
    </SafeAreaView>
  );
}
