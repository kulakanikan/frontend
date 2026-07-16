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

export default function InputBarangScreen() {
  const router = useRouter();
  const addStock = useFishStore((state) => state.addStock);

  // Form states
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [quality, setQuality] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Nama ikan wajib diisi";
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = "Berat ikan harus angka lebih dari 0";
    }
    if (!buyPrice.trim() || isNaN(Number(buyPrice)) || Number(buyPrice) <= 0) {
      newErrors.buyPrice = "Harga beli harus berupa angka";
    }
    if (!quality.trim()) {
      newErrors.quality = "Kondisi kualitas wajib diisi";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    // Add to Zustand
    addStock({
      fish_type: {
        id: `ft-${Date.now()}`,
        name: name.trim(),
        category: "laut",
        unit: "kg",
      },
      quantity: Number(quantity),
      buy_price: Number(buyPrice),
      sell_price: Number(buyPrice), // Default target sell price is same as buy price
      supplier_id: "Supplier Umum",
      batch_date: new Date().toISOString().split("T")[0],
      notes: quality.trim(), // Save Kondisi Kualitas to notes
    });

    // Show success & redirect
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      router.back();
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
              Tambah Stok Barang
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

        {/* Content */}
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
            {/* Input Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Nama Ikan *
              </Text>
              <TextInput
                style={{
                  height: 46,
                  backgroundColor: "#e5eaf7",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  fontSize: 14,
                  color: "#00072d",
                  borderWidth: errors.name ? 1 : 0,
                  borderColor: "#ef4444",
                }}
                placeholder="Masukkan nama ikan (contoh: Tongkol)"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
              />
              {errors.name && (
                <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.name}</Text>
              )}
            </View>

            {/* Quantity */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Berat Ikan (Kg) *
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

            {/* Buy Price */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Harga Beli *
              </Text>
              <TextInput
                style={{
                  height: 46,
                  backgroundColor: "#e5eaf7",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  fontSize: 14,
                  color: "#00072d",
                  borderWidth: errors.buyPrice ? 1 : 0,
                  borderColor: "#ef4444",
                }}
                keyboardType="numeric"
                placeholder="Rp 0"
                placeholderTextColor="#64748b"
                value={buyPrice}
                onChangeText={setBuyPrice}
              />
              {errors.buyPrice && (
                <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.buyPrice}</Text>
              )}
            </View>

            {/* Quality (Kondisi Kualitas) */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Kondisi Kualitas *
              </Text>
              <TextInput
                style={{
                  height: 46,
                  backgroundColor: "#e5eaf7",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  fontSize: 14,
                  color: "#00072d",
                  borderWidth: errors.quality ? 1 : 0,
                  borderColor: "#ef4444",
                }}
                placeholder="Contoh: Sangat Segar, Segar, Beku"
                placeholderTextColor="#64748b"
                value={quality}
                onChangeText={setQuality}
              />
              {errors.quality && (
                <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.quality}</Text>
              )}
            </View>

            {/* Save Button */}
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
                Berhasil Disimpan!
              </Text>
              <Text style={{ color: "#64748b", fontSize: 12, marginTop: 6, textAlign: "center" }}>
                Stok barang telah ditambahkan ke Gudang.
              </Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
