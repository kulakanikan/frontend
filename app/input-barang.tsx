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
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
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
  const [isListening, setIsListening] = useState(false);

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
            <Text style={Type.headerTitle}>Tambah Stok Barang</Text>
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

        {/* Content */}
        <ScrollView
          style={SharedStyles.content}
          contentContainerStyle={{ padding: spacing(16), paddingBottom: spacing(40) }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Form */}
          <View style={SharedStyles.formCard}>
            {/* AI Assistant Voice Input */}
            <Pressable
              onPress={() => {
                if (isListening) return;
                setIsListening(true);
                setTimeout(() => {
                  setName("Tongkol Super");
                  setQuantity("50");
                  setBuyPrice("25000");
                  setQuality("Sangat Segar");
                  setIsListening(false);
                }, 2000);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isListening ? "rgba(59, 130, 246, 0.2)" : (pressed ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.08)"),
                paddingVertical: spacing(14),
                borderRadius: radius(12),
                marginBottom: spacing(24),
                borderWidth: 1.5,
                borderColor: Colors.royalBlue,
                borderStyle: isListening ? "solid" : "dashed",
              })}
            >
              <Ionicons name={isListening ? "mic" : "mic-outline"} size={iconSize(20)} color={Colors.royalBlue} style={{ marginRight: spacing(8) }} />
              <Text style={{ color: Colors.royalBlue, fontSize: rfs(14), fontWeight: "800" }}>
                {isListening ? "Mendengarkan Suara..." : "Isi Otomatis via Suara (AI)"}
              </Text>
            </Pressable>

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
