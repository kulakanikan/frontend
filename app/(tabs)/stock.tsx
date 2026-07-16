import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  Animated,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFishStore } from "../../src/store";
import { FishStock } from "../../src/types";

export default function StockTab() {
  const router = useRouter();
  const { fishStocks, editStock, deleteStock, addAddonToStock } = useFishStore();

  // Math stats
  const totalQuantity = fishStocks.reduce((sum, item) => sum + item.quantity, 0);
  const totalAsetValue = fishStocks.reduce((sum, item) => sum + (item.quantity * item.buy_price), 0);
  const totalKinds = fishStocks.length;

  // Selected Stock Item for action sheets/modals
  const [activeStock, setActiveStock] = useState<FishStock | null>(null);

  // Popup Action Sheet State
  const [showActionSheet, setShowActionSheet] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Addon Modal States
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState("");

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editBuyPrice, setEditBuyPrice] = useState("");
  const [editQuality, setEditQuality] = useState("");

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Action sheet trigger
  const handleOpenActionSheet = (item: FishStock) => {
    setActiveStock(item);
    setShowActionSheet(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 60,
    }).start();
  };

  const handleCloseActionSheet = (callback?: () => void) => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowActionSheet(false);
      if (callback) callback();
    });
  };

  // Open operational modals from action sheet
  const triggerAddon = () => {
    handleCloseActionSheet(() => {
      setAddonName("");
      setAddonPrice("");
      setShowAddonModal(true);
    });
  };

  const triggerEdit = () => {
    if (!activeStock) return;
    handleCloseActionSheet(() => {
      setEditName(activeStock.fish_type.name);
      setEditQuantity(String(activeStock.quantity));
      setEditBuyPrice(String(activeStock.buy_price));
      setEditQuality(activeStock.notes || "");
      setShowEditModal(true);
    });
  };

  const triggerDelete = () => {
    handleCloseActionSheet(() => {
      setShowDeleteModal(true);
    });
  };

  // Submit operations
  const handleSaveAddon = () => {
    if (!addonName.trim()) {
      alert("Nama add-on wajib diisi");
      return;
    }
    if (!addonPrice.trim() || isNaN(Number(addonPrice)) || Number(addonPrice) < 0) {
      alert("Harga add-on harus berupa angka");
      return;
    }

    if (activeStock) {
      addAddonToStock(activeStock.id, addonName.trim(), Number(addonPrice));
    }
    setShowAddonModal(false);
    setActiveStock(null);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      alert("Nama ikan wajib diisi");
      return;
    }
    if (!editQuantity.trim() || isNaN(Number(editQuantity)) || Number(editQuantity) <= 0) {
      alert("Berat ikan harus angka lebih dari 0");
      return;
    }
    if (!editBuyPrice.trim() || isNaN(Number(editBuyPrice)) || Number(editBuyPrice) <= 0) {
      alert("Harga beli harus berupa angka");
      return;
    }

    if (activeStock) {
      editStock(activeStock.id, {
        fish_type: {
          ...activeStock.fish_type,
          name: editName.trim(),
        },
        quantity: Number(editQuantity),
        buy_price: Number(editBuyPrice),
        notes: editQuality.trim(),
      });
    }
    setShowEditModal(false);
    setActiveStock(null);
  };

  const handleConfirmDelete = () => {
    if (activeStock) {
      deleteStock(activeStock.id);
    }
    setShowDeleteModal(false);
    setActiveStock(null);
  };

  // Accent color finder helper based on quality notes
  const getQualityColor = (qualityNotes?: string) => {
    if (!qualityNotes) return "#123499";
    const notesLower = qualityNotes.toLowerCase();
    if (notesLower.includes("sangat segar") || notesLower.includes("sangat baik")) return "#22c55e";
    if (notesLower.includes("segar") || notesLower.includes("baik")) return "#f59e0b";
    if (notesLower.includes("cukup") || notesLower.includes("beku")) return "#3b82f6";
    return "#123499";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#00072d" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          paddingHorizontal: 18,
          paddingVertical: 16,
          backgroundColor: "#00072d",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "bold" }}>
          Stok Gudang
        </Text>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: "#e5eaf7" }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: "#ffffff", padding: 14, borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>Total Jenis</Text>
              <Ionicons name="fish-outline" size={16} color="#123499" />
            </View>
            <Text style={{ color: "#00072d", fontSize: 18, fontWeight: "bold" }}>{totalKinds} Ikan</Text>
          </View>

          <View style={{ flex: 1, backgroundColor: "#ffffff", padding: 14, borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>Total Berat</Text>
              <Ionicons name="scale-outline" size={16} color="#051650" />
            </View>
            <Text style={{ color: "#00072d", fontSize: 18, fontWeight: "bold" }}>{totalQuantity} Kg</Text>
          </View>

          <View style={{ flex: 1, backgroundColor: "#ffffff", padding: 14, borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>Nilai Aset</Text>
              <Ionicons name="wallet-outline" size={16} color="#22c55e" />
            </View>
            <Text style={{ color: "#123499", fontSize: 13, fontWeight: "bold", marginTop: 4 }}>
              Rp {totalAsetValue.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Action helper banner */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", padding: 12, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: "rgba(10,36,114,0.08)" }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(18, 52, 153, 0.1)", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
            <Ionicons name="finger-print-outline" size={14} color="#123499" />
          </View>
          <Text style={{ color: "#051650", fontSize: 11, fontWeight: "600", flex: 1 }}>
            Ketuk pada kartu ikan untuk memunculkan pilihan Add-on, Edit, atau Hapus.
          </Text>
        </View>

        {/* Stock List Section */}
        <Text style={{ color: "#00072d", fontSize: 15, fontWeight: "bold", marginBottom: 12 }}>Daftar Inventaris Ikan</Text>

        {fishStocks.length === 0 ? (
          <View style={{ backgroundColor: "#ffffff", padding: 40, borderRadius: 20, alignItems: "center", elevation: 2 }}>
            <Ionicons name="cube-outline" size={56} color="#64748b" style={{ marginBottom: 12 }} />
            <Text style={{ color: "#64748b", fontSize: 15, fontWeight: "500" }}>Belum ada stok di gudang.</Text>
          </View>
        ) : (
          fishStocks.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleOpenActionSheet(item)}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#f8fafc" : "#ffffff",
                marginBottom: 14,
                borderRadius: 16,
                borderWidth: 1.2,
                borderColor: "rgba(18, 52, 153, 0.25)",
                shadowColor: "#051650",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.04,
                shadowRadius: 12,
                elevation: 2,
                overflow: "hidden",
              })}
            >
              {/* Top Accent Line colored by quality */}
              <View style={{ height: 4, backgroundColor: getQualityColor(item.notes) }} />

              <View style={{ padding: 16 }}>
                {/* Header Row */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(18, 52, 153, 0.1)", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="fish" size={16} color="#123499" />
                    </View>
                    <Text style={{ color: "#00072d", fontSize: 16, fontWeight: "bold" }} numberOfLines={1}>
                      {item.fish_type.name}
                    </Text>
                  </View>

                  {/* Weight Capsule Tag */}
                  <View style={{ backgroundColor: "#123499", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                    <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
                      {item.quantity} Kg
                    </Text>
                  </View>
                </View>

                {/* Info Grid (Split into two columns) */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12, backgroundColor: "#f8fafc", padding: 10, borderRadius: 10 }}>
                  <View>
                    <Text style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", fontWeight: "600" }}>Harga Modal</Text>
                    <Text style={{ color: "#051650", fontSize: 14, fontWeight: "bold", marginTop: 2 }}>
                      Rp {item.buy_price.toLocaleString()}/Kg
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", fontWeight: "600" }}>Kualitas</Text>
                    <Text style={{ color: getQualityColor(item.notes), fontSize: 13, fontWeight: "bold", marginTop: 2 }}>
                      {item.notes || "Standar"}
                    </Text>
                  </View>
                </View>

                {/* Metadata row */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: (item.addons && item.addons.length > 0) ? 12 : 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="calendar-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={{ color: "#64748b", fontSize: 11 }}>Masuk: {item.batch_date}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ color: "#123499", fontSize: 11, fontWeight: "700", marginRight: 2 }}>Ketuk Opsi</Text>
                    <Ionicons name="chevron-forward-circle" size={14} color="#123499" />
                  </View>
                </View>

                {/* Add-ons list if present */}
                {item.addons && item.addons.length > 0 && (
                  <View style={{ borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 12, marginTop: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Ionicons name="cube-outline" size={12} color="#123499" style={{ marginRight: 4 }} />
                      <Text style={{ color: "#123499", fontSize: 11, fontWeight: "bold" }}>Add-on Pelengkap:</Text>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {item.addons.map((add) => (
                        <View key={add.id} style={{ backgroundColor: "#e5eaf7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ color: "#051650", fontSize: 10, fontWeight: "600" }}>
                            {add.name} (+Rp {add.price.toLocaleString()})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* BOUNCY POPUP ACTION MODAL IN THE CENTER WITH DARK BLUR BACKDROP */}
      <Modal visible={showActionSheet} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 7, 45, 0.88)", // Deep dark blur backdrop overlay simulation
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Dismiss touch backdrop overlay */}
          <Pressable style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }} onPress={() => handleCloseActionSheet()} />

          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              borderRadius: 28,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.2)",
              padding: 24,
              width: "85%",
              maxWidth: 310,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
            }}
          >
            {/* Title identifying targeted stock item */}
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 6 }}>
              Aksi Produk
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
              {activeStock?.fish_type.name}
            </Text>

            {/* Bulat-bulat di tengah design row */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: 28 }}>
              {/* + Add-on (Kuning Bulat) */}
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Pressable
                  onPress={triggerAddon}
                  style={({ pressed }) => ({
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: pressed ? "#fef08a" : "#ffffff",
                    borderWidth: 2,
                    borderColor: "#eab308",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#eab308",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 5,
                  })}
                >
                  <Ionicons name="add-circle" size={30} color="#eab308" />
                </Pressable>
                <Text style={{ color: "#ffffff", fontSize: 11, marginTop: 8, fontWeight: "bold" }}>
                  + Add-on
                </Text>
              </View>

              {/* Edit (Hijau Bulat) */}
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Pressable
                  onPress={triggerEdit}
                  style={({ pressed }) => ({
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: pressed ? "#bbf7d0" : "#ffffff",
                    borderWidth: 2,
                    borderColor: "#22c55e",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#22c55e",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 5,
                  })}
                >
                  <Ionicons name="create" size={26} color="#22c55e" />
                </Pressable>
                <Text style={{ color: "#ffffff", fontSize: 11, marginTop: 8, fontWeight: "bold" }}>
                  Edit
                </Text>
              </View>

              {/* Hapus (Merah Bulat) */}
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Pressable
                  onPress={triggerDelete}
                  style={({ pressed }) => ({
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: pressed ? "#fecaca" : "#ffffff",
                    borderWidth: 2,
                    borderColor: "#ef4444",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#ef4444",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 5,
                  })}
                >
                  <Ionicons name="trash" size={26} color="#ef4444" />
                </Pressable>
                <Text style={{ color: "#ffffff", fontSize: 11, marginTop: 8, fontWeight: "bold" }}>
                  Hapus
                </Text>
              </View>
            </View>

            {/* Cancel Button inside glassmorphic board */}
            <Pressable
              onPress={() => handleCloseActionSheet()}
              style={({ pressed }) => ({
                width: "100%",
                height: 40,
                backgroundColor: pressed ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.15)",
              })}
            >
              <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>Batal</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL: ADD ADD-ON */}
      <Modal visible={showAddonModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 7, 45, 0.7)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ width: "100%", maxWidth: 330, backgroundColor: "#ffffff", borderRadius: 24, padding: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <Text style={{ color: "#00072d", fontSize: 17, fontWeight: "bold" }}>Tambah Add-on</Text>
              <Pressable onPress={() => { setShowAddonModal(false); setActiveStock(null); }}>
                <Ionicons name="close-outline" size={24} color="#051650" />
              </Pressable>
            </View>

            <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 16 }}>
              Menambahkan add-on untuk produk: <Text style={{ fontWeight: "bold", color: "#123499" }}>{activeStock?.fish_type.name}</Text>
            </Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Nama Add-on</Text>
              <TextInput
                style={{ height: 46, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                placeholder="Contoh: Es Batu, Kotak Gabus"
                placeholderTextColor="#64748b"
                value={addonName}
                onChangeText={setAddonName}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Harga Add-on (Rp)</Text>
              <TextInput
                style={{ height: 46, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                placeholder="Rp 0"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                value={addonPrice}
                onChangeText={setAddonPrice}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => {
                  setShowAddonModal(false);
                  setActiveStock(null);
                }}
                style={{ flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: "#051650", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#051650", fontWeight: "bold", fontSize: 14 }}>Batal</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveAddon}
                style={{ flex: 1, height: 46, backgroundColor: "#123499", borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 14 }}>Simpan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDIT STOCK */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 7, 45, 0.7)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ width: "100%", maxWidth: 330, backgroundColor: "#ffffff", borderRadius: 24, padding: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <Text style={{ color: "#00072d", fontSize: 17, fontWeight: "bold" }}>Edit Data Stok</Text>
              <Pressable onPress={() => { setShowEditModal(false); setActiveStock(null); }}>
                <Ionicons name="close-outline" size={24} color="#051650" />
              </Pressable>
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Nama Ikan</Text>
              <TextInput
                style={{ height: 46, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Berat Ikan (Kg)</Text>
              <TextInput
                style={{ height: 46, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                keyboardType="numeric"
                value={editQuantity}
                onChangeText={setEditQuantity}
              />
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Harga Beli (Modal)</Text>
              <TextInput
                style={{ height: 46, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                keyboardType="numeric"
                value={editBuyPrice}
                onChangeText={setEditBuyPrice}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Kondisi Kualitas</Text>
              <TextInput
                style={{ height: 46, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                value={editQuality}
                onChangeText={setEditQuality}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => {
                  setShowEditModal(false);
                  setActiveStock(null);
                }}
                style={{ flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: "#051650", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#051650", fontWeight: "bold", fontSize: 14 }}>Batal</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                style={{ flex: 1, height: 46, backgroundColor: "#123499", borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 14 }}>Simpan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: CONFIRM DELETE */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 7, 45, 0.7)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ width: "100%", maxWidth: 300, backgroundColor: "#ffffff", borderRadius: 24, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(239, 68, 68, 0.15)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Ionicons name="trash-outline" size={26} color="#ef4444" />
            </View>
            <Text style={{ color: "#00072d", fontSize: 18, fontWeight: "bold", textAlign: "center" }}>Hapus Barang?</Text>
            <Text style={{ color: "#64748b", fontSize: 13, marginTop: 8, textAlign: "center", marginBottom: 24, lineHeight: 18 }}>
              Apakah Anda yakin ingin menghapus <Text style={{ fontWeight: "bold", color: "#00072d" }}>{activeStock?.fish_type.name}</Text> dari Gudang secara permanen?
            </Text>

            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <Pressable
                onPress={() => {
                  setShowDeleteModal(false);
                  setActiveStock(null);
                }}
                style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: "#051650", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#051650", fontWeight: "bold", fontSize: 14 }}>Batal</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmDelete}
                style={{ flex: 1, height: 44, backgroundColor: "#ef4444", borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 14 }}>Hapus</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
