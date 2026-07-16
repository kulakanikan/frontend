import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFishStore } from "../../src/store";
import { FishStock } from "../../src/types";
import { Colors, Type, Shadow, SharedStyles } from "../../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../../src/utils/responsive";

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
    <SafeAreaView style={SharedStyles.screen}>
      <View style={[SharedStyles.header, { backgroundColor: "transparent", paddingVertical: spacing(20) }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: rfs(22), fontWeight: "900", letterSpacing: 0.5 }}>
            Gudang & Stok
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing(100) }} showsVerticalScrollIndicator={false}>
        
        {/* Big Card Overview */}
        <View style={{ paddingHorizontal: spacing(16) }}>
          <View style={{
            backgroundColor: Colors.cardBlue,
            borderRadius: radius(28),
            padding: spacing(24),
            marginBottom: spacing(16),
            ...Shadow.cardLift,
          }}>
            <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(24) }]}>
              <View style={[SharedStyles.row, { gap: spacing(12) }]}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="cube" size={iconSize(20)} color="#ffffff" />
                </View>
                <Text style={{ color: "#ffffff", opacity: 0.9, fontWeight: "700", fontSize: rfs(14) }}>Aset Gudang</Text>
              </View>
            </View>
            <Text style={{ color: "#ffffff", fontSize: rfs(12), opacity: 0.8, marginBottom: 4 }}>Total Nilai Stok Ikan</Text>
            <Text style={{ color: "#ffffff", fontSize: rfs(32), fontWeight: "900" }} numberOfLines={1} adjustsFontSizeToFit>
              Rp {totalAsetValue.toLocaleString()}
            </Text>
          </View>

          {/* Mini Stats Row */}
          <View style={[SharedStyles.row, { gap: spacing(16), marginBottom: spacing(24) }]}>
            <View style={{
              flex: 1, backgroundColor: "#ffffff", padding: spacing(16), borderRadius: radius(24), ...Shadow.card
            }}>
              <Text style={{ color: Colors.textMuted, fontSize: rfs(11), fontWeight: "600", marginBottom: spacing(4) }}>Total Berat</Text>
              <Text style={{ color: Colors.navy, fontSize: rfs(24), fontWeight: "900" }}>{totalQuantity} <Text style={{ fontSize: rfs(12), color: Colors.textMuted }}>Kg</Text></Text>
            </View>
            <View style={{
              flex: 1, backgroundColor: "#ffffff", padding: spacing(16), borderRadius: radius(24), ...Shadow.card
            }}>
              <Text style={{ color: Colors.textMuted, fontSize: rfs(11), fontWeight: "600", marginBottom: spacing(4) }}>Jenis Ikan</Text>
              <Text style={{ color: Colors.navy, fontSize: rfs(24), fontWeight: "900" }}>{totalKinds} <Text style={{ fontSize: rfs(12), color: Colors.textMuted }}>Jenis</Text></Text>
            </View>
          </View>
        </View>

        {/* List of Stock in Dark Sheet */}
        <View style={{
          backgroundColor: Colors.navy,
          borderTopLeftRadius: radius(32),
          borderTopRightRadius: radius(32),
          padding: spacing(24),
          minHeight: hp(500),
        }}>
          <View style={{ alignItems: "center", marginBottom: spacing(16) }}>
            <View style={{ width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 }} />
          </View>

          <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(24) }]}>
            <Text style={{ color: "#ffffff", fontSize: rfs(18), fontWeight: "bold" }}>Inventaris Tersedia</Text>
            <Ionicons name="funnel" size={iconSize(20)} color="#ffffff" />
          </View>

          {/* Action Helper Note inside dark sheet */}
          <View style={[SharedStyles.row, { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius(12), padding: spacing(12), marginBottom: spacing(20) }]}>
            <Ionicons name="information-circle" size={16} color="#ffffff" style={{ marginRight: spacing(8) }} />
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: rfs(11), flex: 1 }}>
              Ketuk pada kartu barang untuk edit, tambah add-on, atau hapus stok.
            </Text>
          </View>

          {fishStocks.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: spacing(40) }}>
              <Ionicons name="cube-outline" size={iconSize(48)} color="rgba(255,255,255,0.3)" />
              <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: spacing(12), fontSize: rfs(14) }}>
                Belum ada stok di gudang.
              </Text>
            </View>
          ) : (
            fishStocks.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleOpenActionSheet(item)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                  borderRadius: radius(20),
                  padding: spacing(16),
                  marginBottom: spacing(14),
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                })}
              >
                {/* Header Row */}
                <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(16) }]}>
                  <View style={[SharedStyles.row, { flex: 1, marginRight: spacing(12) }]}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", marginRight: spacing(12) }}>
                      <Ionicons name="fish" size={iconSize(20)} color="#ffffff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#ffffff", fontSize: rfs(16), fontWeight: "bold", marginBottom: 2 }} numberOfLines={1}>
                        {item.fish_type.name}
                      </Text>
                      {item.notes ? (
                        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: rfs(11) }} numberOfLines={1}>
                          {item.notes}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={{ backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: spacing(10), paddingVertical: spacing(6), borderRadius: radius(12) }}>
                    <Text style={{ color: "#ffffff", fontSize: rfs(13), fontWeight: "800" }}>{item.quantity} Kg</Text>
                  </View>
                </View>

                {/* Info Details */}
                <View style={[SharedStyles.row, { justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.2)", padding: spacing(12), borderRadius: radius(12) }]}>
                  <View>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: rfs(10), fontWeight: "600", textTransform: "uppercase", marginBottom: 2 }}>Modal / Kg</Text>
                    <Text style={{ color: "#ffffff", fontSize: rfs(14), fontWeight: "bold" }}>
                      Rp {item.buy_price.toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: rfs(10), fontWeight: "600", textTransform: "uppercase", marginBottom: 2 }}>Masuk</Text>
                    <Text style={{ color: "#ffffff", fontSize: rfs(12), fontWeight: "600" }}>
                      {item.batch_date}
                    </Text>
                  </View>
                </View>

                {/* Add-ons list if present */}
                {item.addons && item.addons.length > 0 && (
                  <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: spacing(12), marginTop: spacing(12) }}>
                    <View style={[SharedStyles.row, { marginBottom: spacing(8) }]}>
                      <Ionicons name="add-circle" size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
                      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: rfs(11), fontWeight: "bold" }}>Add-ons:</Text>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing(8) }}>
                      {item.addons.map((add) => (
                        <View key={add.id} style={[SharedStyles.row, { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: spacing(8), paddingVertical: spacing(6), borderRadius: radius(8) }]}>
                          <Text style={{ color: "#ffffff", fontSize: rfs(10), fontWeight: "600" }}>
                            {add.name} (+Rp {add.price.toLocaleString()})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>
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
