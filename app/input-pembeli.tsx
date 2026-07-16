import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFishStore } from "../src/store";
import { FishStock, TransactionItem } from "../src/types";

export default function InputPembeliScreen() {
  const router = useRouter();
  
  // Zustand Store
  const { fishStocks, customers, transactions, addCustomer, addTransaction, addStock } = useFishStore();

  // Form State Data
  const [buyerName, setBuyerName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [fishName, setFishName] = useState("");
  const [showFishDropdown, setShowFishDropdown] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"lunas" | "tempo">("lunas");
  const [showSuccess, setShowSuccess] = useState(false);

  // Form validations
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter customers for dropdown search
  const uniquePurchasingCustomers = Array.from(
    new Set(transactions.map((tx) => tx.customer_name))
  ).map((name) => {
    return customers.find((c) => c.name === name) || { id: name, name, phone: "" };
  });

  const filteredCustomers = uniquePurchasingCustomers.filter((c) =>
    c.name.toLowerCase().includes(buyerName.toLowerCase())
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

    // Find last transaction for this customer
    const lastTx = transactions.find(
      (tx) => tx.customer_name.toLowerCase() === custName.toLowerCase()
    );

    if (lastTx && lastTx.items.length > 0) {
      const lastItem = lastTx.items[0];
      setFishName(lastItem.fish_name);
      setQuantity(String(lastItem.quantity));
      setSellPrice(String(lastItem.unit_price));
      setPaymentMethod(lastTx.payment_status === "paid" ? "lunas" : "tempo");
    }
  };

  const handleSelectFish = (stockItem: FishStock) => {
    setFishName(stockItem.fish_type.name);
    setSellPrice(String(stockItem.sell_price));
    setShowFishDropdown(false);
  };

  const calculateTotal = () => {
    const qty = Number(quantity) || 0;
    const price = Number(sellPrice) || 0;
    return qty * price;
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!buyerName.trim()) newErrors.buyerName = "Nama pembeli wajib diisi";
    if (!fishName.trim()) newErrors.fishName = "Nama ikan wajib diisi";
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = "Total berat ikan harus berupa angka lebih dari 0";
    }
    if (!sellPrice.trim() || isNaN(Number(sellPrice)) || Number(sellPrice) <= 0) {
      newErrors.sellPrice = "Harga per Kg wajib diisi";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Check if customer already exists in store, if not, create new
    let customerId = "";
    const matchedCustomer = customers.find(
      (c) => c.name.toLowerCase() === buyerName.trim().toLowerCase()
    );

    if (matchedCustomer) {
      customerId = matchedCustomer.id;
    } else {
      const created = addCustomer({
        name: buyerName.trim(),
        phone: "081XXXXXXXXX",
      });
      customerId = created.id;
    }

    // Find matching fish in stock to get or create stock ID
    let fishStockId = "";
    let stockNotFound = false;
    const matchedFish = fishStocks.find(
      (fs) => fs.fish_type.name.toLowerCase() === fishName.trim().toLowerCase()
    );

    if (matchedFish) {
      fishStockId = matchedFish.id;
    } else {
      stockNotFound = true;
      // Auto-create stock item to prevent dependency issues
      const createdStock = addStock({
        fish_type: {
          id: `ft-${Date.now()}`,
          name: fishName.trim(),
          category: "laut",
          unit: "kg",
        },
        quantity: Number(quantity),
        buy_price: Number(sellPrice) * 0.8, // Estimate buy price
        sell_price: Number(sellPrice),
        supplier_id: "Supplier Umum",
        batch_date: new Date().toISOString().split("T")[0],
      });
      fishStockId = createdStock.id;
    }

    const total = calculateTotal();
    const paid = paymentMethod === "lunas" ? total : 0;
    const status = paymentMethod === "lunas" ? "paid" : "unpaid";

    const items: TransactionItem[] = [
      {
        id: `txi-${Date.now()}`,
        fish_stock_id: fishStockId,
        fish_name: fishName.trim(),
        quantity: Number(quantity),
        unit_price: Number(sellPrice),
        subtotal: total,
        stock_not_found: stockNotFound,
      },
    ];

    addTransaction({
      customer_id: customerId,
      customer_name: buyerName.trim(),
      items,
      total_amount: total,
      paid_amount: paid,
      payment_status: status,
      payment_method: paymentMethod === "lunas" ? "cash" : "transfer",
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      router.replace("/transactions");
    }, 1500);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#00072d" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: "#00072d",
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255, 255, 255, 0.08)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                padding: 8,
                borderRadius: 20,
                backgroundColor: pressed ? "rgba(255, 255, 255, 0.1)" : "transparent",
                marginRight: 8,
              })}
            >
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </Pressable>
            <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "bold" }}>
              Input Transaksi Pembeli
            </Text>
          </View>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#15803d" : "#22c55e",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            })}
          >
            <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
              Simpan
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1, backgroundColor: "#e5eaf7" }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Form */}
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20,
              padding: 20,
              borderWidth: 1.5,
              borderColor: "#123499",
              shadowColor: "#123499",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
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
                    }}
                  >
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {filteredCustomers.map((cust) => (
                        <Pressable
                          key={cust.id}
                          onPress={() => handleSelectCustomer(cust.name)}
                          style={({ pressed }) => ({
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            borderBottomWidth: 1,
                            borderBottomColor: "#e5eaf7",
                            backgroundColor: pressed ? "#e5eaf7" : "#ffffff",
                          })}
                        >
                          <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "500" }}>
                            {cust.name}
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
                Rp {calculateTotal().toLocaleString()}
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
