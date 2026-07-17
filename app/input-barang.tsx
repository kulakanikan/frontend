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
import { useFishStore, useSupplierStore } from "../src/store";
import VoiceInputModal from "../src/components/VoiceInputModal";

export default function InputBarangScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const addStock = useFishStore((state) => state.addStock);

  // Form states initialized from route parameters (supports AI Voice pre-fill)
  const [name, setName] = useState((params.jenis_ikan as string) || "");
  const [quantity, setQuantity] = useState((params.berat as string) || "");
  const [buyPrice, setBuyPrice] = useState((params.harga_beli_per_kg as string) || "");
  const [quality, setQuality] = useState((params.kondisi_kualitas as string) || "");
  const [showSuccess, setShowSuccess] = useState(false);

  // Voice AI Modal state
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Supplier store integration
  const { suppliers, fetchSuppliers, addSupplier, isLoading: isSupplierLoading } = useSupplierStore();
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // New supplier modal states
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [newSupplierAddress, setNewSupplierAddress] = useState("");
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleVoiceSuccess = (suggestion: any) => {
    if (suggestion.jenis_ikan) setName(suggestion.jenis_ikan);
    if (suggestion.berat !== null) setQuantity(String(suggestion.berat));
    if (suggestion.harga_beli_per_kg !== null) setBuyPrice(String(suggestion.harga_beli_per_kg));
    if (suggestion.kondisi_kualitas) setQuality(suggestion.kondisi_kualitas.toLowerCase());
    
    // Try to match supplier name
    if (suggestion.nama_supplier) {
      const matched = suppliers.find(s => 
        s.namaNelayan.toLowerCase().includes(suggestion.nama_supplier.toLowerCase())
      );
      if (matched) {
        setSelectedSupplierId(matched.id);
      } else {
        // Auto-prefill supplier name in supplier creation modal
        setNewSupplierName(suggestion.nama_supplier);
        setShowNewSupplierModal(true);
      }
    }
  };

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSuppliers().catch((err) => console.error("Failed to load suppliers:", err));
  }, [fetchSuppliers]);

  // Auto-select supplier if passed from Voice AI suggestion
  useEffect(() => {
    if (params.nama_supplier && suppliers.length > 0) {
      const match = suppliers.find(
        (s) => s.namaNelayan.toLowerCase() === (params.nama_supplier as string).toLowerCase()
      );
      if (match) {
        setSelectedSupplierId(match.id);
      }
    }
  }, [params.nama_supplier, suppliers]);

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
    if (!selectedSupplierId) {
      newErrors.supplier = "Nelayan / Supplier wajib dipilih";
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
      sell_price: 0, 
      supplier_id: selectedSupplierId,
      batch_date: new Date().toISOString().split("T")[0],
      notes: quality.trim(), 
    });

    // Show success & redirect
    setShowSuccess(true);
    timerRef.current = setTimeout(() => {
      setShowSuccess(false);
      router.back();
    }, 1500);
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) {
      alert("Nama nelayan wajib diisi");
      return;
    }

    setIsSavingSupplier(true);
    try {
      const created = await addSupplier({
        nama_nelayan: newSupplierName.trim(),
        telepon: newSupplierPhone.trim() || undefined,
        alamat: newSupplierAddress.trim() || undefined,
      });
      setSelectedSupplierId(created.id);
      setShowNewSupplierModal(false);
      setShowSupplierModal(false);
      // Reset inputs
      setNewSupplierName("");
      setNewSupplierPhone("");
      setNewSupplierAddress("");
    } catch (err) {
      alert("Gagal menambahkan nelayan");
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const filteredSuppliers = suppliers.filter(s => 
    s.namaNelayan.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Text style={Type.headerTitle}>Input Barang Masuk</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={SharedStyles.content}
          contentContainerStyle={{ padding: spacing(16), paddingBottom: spacing(40) }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Form */}
          <View style={SharedStyles.formCard}>
            
            {/* Supplier Picker */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "600", marginBottom: 8 }}>
                Pilih Nelayan / Supplier *
              </Text>
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  setShowSupplierModal(true);
                }}
                style={{
                  height: 48,
                  backgroundColor: "#e5eaf7",
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: errors.supplier ? 1 : 0,
                  borderColor: "#ef4444",
                }}
              >
                <Text style={{ color: selectedSupplier ? "#00072d" : "#64748b", fontSize: 14 }}>
                  {selectedSupplier ? selectedSupplier.namaNelayan : "Pilih Nelayan / Supplier"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </Pressable>
              {errors.supplier && (
                <Text style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{errors.supplier}</Text>
              )}
            </View>

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
                Harga Beli (Modal / Kg) *
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
                Berhasil Disimpan!
              </Text>
              <Text style={{ color: "#64748b", fontSize: 12, marginTop: 6, textAlign: "center" }}>
                Stok barang telah ditambahkan ke Gudang.
              </Text>
            </View>
          </View>
        )}

        {/* MODAL: SELECT SUPPLIER */}
        <Modal visible={showSupplierModal} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0, 7, 45, 0.7)", justifyContent: "flex-end" }}>
            <View style={{
              height: "75%",
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              padding: 20,
            }}>
              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ color: "#00072d", fontSize: 18, fontWeight: "bold" }}>Pilih Nelayan / Supplier</Text>
                <Pressable onPress={() => setShowSupplierModal(false)}>
                  <Ionicons name="close-circle" size={26} color="#64748b" />
                </Pressable>
              </View>

              {/* Add New Button */}
              <TouchableOpacity
                onPress={() => setShowNewSupplierModal(true)}
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
                <Text style={{ color: Colors.royalBlue, fontWeight: "bold", fontSize: 13 }}>Tambah Nelayan Baru</Text>
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
                  placeholder="Cari nelayan..."
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {isSupplierLoading ? (
                <ActivityIndicator size="large" color={Colors.royalBlue} style={{ marginTop: 40 }} />
              ) : (
                <FlatList
                  data={filteredSuppliers}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setSelectedSupplierId(item.id);
                        setShowSupplierModal(false);
                      }}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? "#f0f4f9" : "transparent",
                        paddingVertical: 14,
                        paddingHorizontal: 6,
                        borderBottomWidth: 1,
                        borderBottomColor: "#e5eaf7",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      })}
                    >
                      <View>
                        <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold" }}>{item.namaNelayan}</Text>
                        <Text style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{item.alamat || "Alamat tidak ada"}</Text>
                      </View>
                      {selectedSupplierId === item.id && (
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      )}
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={{ textAlign: "center", color: "#64748b", marginTop: 40, fontSize: 13 }}>
                      Nelayan tidak ditemukan.
                    </Text>
                  }
                />
              )}
            </View>
          </View>
        </Modal>

        {/* MODAL: CREATE NEW SUPPLIER */}
        <Modal visible={showNewSupplierModal} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: "rgba(0, 7, 45, 0.7)", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <View style={{ width: "100%", maxWidth: 330, backgroundColor: "#ffffff", borderRadius: 24, padding: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 }}>
              
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <Text style={{ color: "#00072d", fontSize: 17, fontWeight: "bold" }}>Tambah Nelayan Baru</Text>
                <Pressable onPress={() => setShowNewSupplierModal(false)}>
                  <Ionicons name="close" size={24} color="#00072d" />
                </Pressable>
              </View>

              {/* Name */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Nama Nelayan *</Text>
                <TextInput
                  style={{ height: 44, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                  placeholder="Nama nelayan"
                  placeholderTextColor="#64748b"
                  value={newSupplierName}
                  onChangeText={setNewSupplierName}
                />
              </View>

              {/* Phone */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>No. HP / Telepon</Text>
                <TextInput
                  style={{ height: 44, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                  placeholder="Contoh: 08123"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={newSupplierPhone}
                  onChangeText={setNewSupplierPhone}
                />
              </View>

              {/* Address */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Alamat</Text>
                <TextInput
                  style={{ height: 44, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                  placeholder="Contoh: Muara Baru"
                  placeholderTextColor="#64748b"
                  value={newSupplierAddress}
                  onChangeText={setNewSupplierAddress}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  disabled={isSavingSupplier}
                  onPress={() => setShowNewSupplierModal(false)}
                  activeOpacity={0.7}
                  style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: "#051650", alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: "#051650", fontWeight: "bold", fontSize: 13 }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={isSavingSupplier}
                  onPress={handleCreateSupplier}
                  activeOpacity={0.7}
                  style={{ flex: 1, height: 44, backgroundColor: "#123499", borderRadius: 12, alignItems: "center", justifyContent: "center" }}
                >
                  {isSavingSupplier ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 13 }}>Simpan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>

      <VoiceInputModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        formType="batch"
        onSuccess={handleVoiceSuccess}
      />
    </SafeAreaView>
  );
}
