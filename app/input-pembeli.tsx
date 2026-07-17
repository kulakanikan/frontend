import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
import { useFishStore, useBuyerStore, useTransactionStore } from "../src/store";
import { FishStock } from "../src/types";
import { formatCurrency, formatWeight } from "../src/utils";

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

  // Form validations
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStocks().catch((err) => console.error(err));
    fetchBuyers().catch((err) => console.error(err));
  }, [fetchStocks, fetchBuyers]);

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
    return qty * price;
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
      // 1. Check if customer already exists in store, if not, create new
      let buyerId = "";
      const matchedBuyer = buyers.find(
        (b) => b.nama.toLowerCase() === buyerName.trim().toLowerCase()
      );

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
      await createSale({
        batch_id: matchedFish!.id,
        buyer_id: buyerId,
        berat_jual: qtyNum,
        harga_satuan: priceNum,
        status_bayar: paymentMethod,
        tanggal: new Date().toISOString(),
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.replace("/transactions");
      }, 1500);
    } catch (err) {
      alert("Gagal menyimpan transaksi");
    }
  };

  return (
    <SafeAreaView style={SharedStyles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
            <Text style={Type.headerTitle}>Input Transaksi Pembeli</Text>
          </View>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => ({
              ...SharedStyles.headerSaveButton,
              backgroundColor: pressed ? Colors.successDark : Colors.success,
            })}
          >
            <Text style={{ color: Colors.textWhite, fontSize: rfs(13), fontWeight: "700" }}>
              Simpan
            </Text>
          </Pressable>
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
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: "#123499",
                      maxHeight: 150,
                      overflow: "hidden",
                      elevation: 5,
                      shadowColor: "#123499",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 6,
                      zIndex: 9999,
                    }}
                  >
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {filteredCustomers.map((cust) => (
                        <Pressable
                          key={cust.id}
                          onPress={() => handleSelectCustomer(cust.nama)}
                          style={({ pressed }) => ({
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: "#e5eaf7",
                            backgroundColor: pressed ? "#e5eaf7" : "#ffffff",
                          })}
                        >
                          <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "500" }}>
                            {cust.nama}
                          </Text>
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
                      borderRadius: 12,
                      borderWidth: 1.2,
                      borderColor: "rgba(18, 52, 153, 0.25)",
                      maxHeight: 150,
                      overflow: "hidden",
                      elevation: 5,
                      shadowColor: "#123499",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 6,
                      zIndex: 9999,
                    }}
                  >
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {filteredFishStocks.map((stock) => (
                        <Pressable
                          key={stock.id}
                          onPress={() => handleSelectFish(stock)}
                          style={({ pressed }) => ({
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: "#e5eaf7",
                            backgroundColor: pressed ? "#e5eaf7" : "#ffffff",
                          })}
                        >
                          <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "500" }}>
                            {stock.fish_type.name} (Tersedia: {stock.quantity} Kg)
                          </Text>
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

            {/* Save Transaction Button */}
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => ({
                height: 46,
                backgroundColor: pressed ? "#15803d" : "#22c55e",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 3,
              })}
            >
              <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold" }}>
                Simpan
              </Text>
            </Pressable>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
