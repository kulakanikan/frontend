import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";
import { useBuyerStore, useMarketsStore } from "../src/store";
import type { ApiBuyer } from "../src/services/api";

export default function BuyersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { buyers, isLoading, fetchBuyers, addBuyer, updateBuyer } = useBuyerStore();
  const { markets, fetchMarkets } = useMarketsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("Semua");
  const [showModal, setShowModal] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<ApiBuyer | null>(null);

  // Form State
  const [formNama, setFormNama] = useState("");
  const [formTelepon, setFormTelepon] = useState("");
  const [formTipe, setFormTipe] = useState<string>("perorangan");
  const [formMarketId, setFormMarketId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBuyers().catch((err) => console.error("Failed to load buyers:", err));
    fetchMarkets().catch((err) => console.error("Failed to load markets:", err));
  }, [fetchBuyers, fetchMarkets]);

  const customerTypes = ["Semua", "Restoran", "Bakul Besar", "Pedagang Pasar", "Perorangan"];

  const filteredBuyers = buyers.filter((b) => {
    const name = b.nama || "";
    const type = b.tipePembeli || "";
    const q = searchQuery.toLowerCase();
    const matchesSearch = name.toLowerCase().includes(q) || type.toLowerCase().includes(q);
    const matchesType =
      selectedType === "Semua" ||
      type.toLowerCase() === selectedType.toLowerCase() ||
      (selectedType === "Perorangan" && type === "perorangan");
    return matchesSearch && matchesType;
  });

  const openCreateModal = () => {
    setEditingBuyer(null);
    setFormNama("");
    setFormTelepon("");
    setFormTipe("perorangan");
    setFormMarketId(null);
    setShowModal(true);
  };

  const openEditModal = (buyer: ApiBuyer) => {
    setEditingBuyer(buyer);
    setFormNama(buyer.nama || "");
    setFormTelepon(buyer.telepon || "");
    setFormTipe(buyer.tipePembeli || "perorangan");
    setFormMarketId(buyer.marketId || null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formNama.trim()) {
      Alert.alert("Perhatian", "Nama pembeli wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      if (editingBuyer) {
        await updateBuyer(editingBuyer.id, {
          nama: formNama.trim(),
          telepon: formTelepon.trim() || null,
          tipe_pembeli: formTipe,
        });
      } else {
        await addBuyer({
          nama: formNama.trim(),
          telepon: formTelepon.trim() || undefined,
          tipe_pembeli: formTipe,
          market_id: formMarketId,
        });
      }
      setShowModal(false);
      Alert.alert("Berhasil", editingBuyer ? "Data pembeli berhasil diperbarui" : "Pembeli baru berhasil ditambahkan");
    } catch (err) {
      Alert.alert("Gagal", "Tidak dapat menyimpan data pembeli");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenWa = (phone: string, name: string) => {
    if (!phone) {
      Alert.alert("Perhatian", "Nomor WhatsApp tidak tersedia untuk pembeli ini");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formatted = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const msg = `Halo ${name}, mengenai pesanan kulakan ikan Anda...`;
    const url = `https://api.whatsapp.com/send?phone=${formatted}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Gagal membuka WhatsApp"));
  };

  return (
    <SafeAreaView style={SharedStyles.screen}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={iconSize(20)} color={Colors.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ ...Type.h2, fontSize: rfs(17) }}>Data Pembeli & Pelanggan</Text>
          <Text style={{ color: Colors.textMuted, fontSize: rfs(11) }}>
            Kelola daftar bakul, restoran, dan pembeli langganan
          </Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} style={styles.addButton} activeOpacity={0.85}>
          <Ionicons name="add" size={iconSize(20)} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Main Content Scroll View */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing(16), paddingBottom: spacing(30) }}
        showsVerticalScrollIndicator={false}
      >


        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={iconSize(18)} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama pembeli atau tipe..."
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

        {/* Type Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing(14) }}
          contentContainerStyle={{ gap: spacing(8) }}
        >
          {customerTypes.map((type) => {
            const isSelected = selectedType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
                style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loading Indicator */}
        {isLoading && buyers.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={Colors.royalBlue} />
            <Text style={{ color: Colors.textMuted, marginTop: 8, fontSize: rfs(12) }}>Memuat data pembeli...</Text>
          </View>
        ) : filteredBuyers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Pembeli Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? `Tidak ada pembeli cocok dengan "${searchQuery}"` : "Belum ada pembeli terdaftar."}
            </Text>
            <TouchableOpacity onPress={openCreateModal} style={styles.emptyAddButton}>
              <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: rfs(12) }}>+ Tambah Pembeli Baru</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredBuyers.map((buyer) => {
            const name = buyer.nama || "Pembeli";
            const phone = buyer.telepon;
            const type = buyer.tipePembeli || "Perorangan";

            // Find associated market name
            const marketId = buyer.marketId;
            const foundMarket = markets.find((m) => m.id === marketId);
            const marketName = foundMarket ? foundMarket.namaPasar : "Pasar Umum";

            return (
              <View key={buyer.id} style={styles.buyerCard}>
                <View style={styles.buyerHeader}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={iconSize(20)} color={Colors.royalBlue} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.buyerName}>{name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.marketName} numberOfLines={1}>
                        {marketName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{type}</Text>
                  </View>
                </View>

                {/* Footer Quick Actions */}
                <View style={styles.buyerFooter}>
                  <TouchableOpacity
                    onPress={() => handleOpenWa(phone || "", name)}
                    style={[styles.actionChip, { backgroundColor: phone ? "rgba(34, 197, 94, 0.1)" : "#f1f5f9" }]}
                    activeOpacity={phone ? 0.75 : 1}
                  >
                    <Ionicons name="logo-whatsapp" size={15} color={phone ? "#16a34a" : "#94a3b8"} />
                    <Text style={[styles.actionChipText, { color: phone ? "#16a34a" : "#94a3b8" }]}>
                      {phone || "Tidak Ada Telepon"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openEditModal(buyer)}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="create-outline" size={18} color={Colors.navy} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* CREATE / EDIT BUYER MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBuyer ? "Edit Data Pembeli" : "Tambah Pembeli Baru"}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </Pressable>
            </View>

            {/* Form Inputs */}
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.inputLabel}>Nama Pembeli / Pelanggan *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Bu Sri / Restoran Sederhana"
                placeholderTextColor="#94a3b8"
                value={formNama}
                onChangeText={setFormNama}
              />
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={styles.inputLabel}>No. WhatsApp / HP</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: 08123456789"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={formTelepon}
                onChangeText={setFormTelepon}
              />
            </View>

            <View style={{ marginBottom: 14 }}>
              <Text style={styles.inputLabel}>Tipe Pembeli</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {["Restoran", "Bakul Besar", "Pedagang Pasar", "Perorangan"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setFormTipe(t)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: radius(8),
                      backgroundColor: formTipe === t ? Colors.navy : "#e5eaf7",
                    }}
                  >
                    <Text style={{ fontSize: rfs(11), fontWeight: "bold", color: formTipe === t ? "#ffffff" : Colors.navy }}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Modal Buttons */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                disabled={isSaving}
                onPress={() => setShowModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isSaving}
                onPress={handleSave}
                style={styles.modalSaveBtn}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSaveText}>
                    {editingBuyer ? "Simpan Perubahan" : "Tambah Pembeli"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(14),
    gap: spacing(12),
    backgroundColor: "transparent",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(10, 35, 92, 0.12)",
    ...Shadow.button,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.navy,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.button,
  },
  metricCard: {
    backgroundColor: Colors.cardBlue,
    borderRadius: radius(20),
    padding: spacing(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing(16),
    ...Shadow.cardLift,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricNumber: {
    fontSize: rfs(20),
    fontWeight: "900",
    color: Colors.navy,
  },
  metricLabel: {
    fontSize: rfs(11),
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: "600",
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(43, 120, 228, 0.2)",
  },
  searchBox: {
    height: 44,
    borderRadius: radius(14),
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing(14),
    gap: spacing(8),
    marginBottom: spacing(12),
    borderWidth: 1,
    borderColor: "rgba(10, 35, 92, 0.08)",
    ...Shadow.card,
  },
  searchInput: {
    flex: 1,
    fontSize: rfs(12.5),
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  typeChip: {
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(7),
    borderRadius: radius(16),
    backgroundColor: "#ffffff",
    ...Shadow.button,
  },
  typeChipSelected: {
    backgroundColor: Colors.navy,
  },
  typeChipText: {
    fontSize: rfs(11.5),
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  typeChipTextSelected: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  buyerCard: {
    backgroundColor: "#ffffff",
    borderRadius: radius(18),
    padding: spacing(14),
    marginBottom: spacing(12),
    borderWidth: 1.5,
    borderColor: "rgba(43, 120, 228, 0.15)",
    ...Shadow.card,
  },
  buyerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(12),
    marginBottom: spacing(12),
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(43, 120, 228, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  buyerName: {
    fontSize: rfs(14),
    fontWeight: "800",
    color: Colors.navy,
  },
  marketName: {
    fontSize: rfs(11.5),
    color: Colors.textMuted,
    flex: 1,
  },
  typeBadge: {
    backgroundColor: Colors.royalBlueMuted,
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(4),
    borderRadius: radius(8),
  },
  typeBadgeText: {
    color: Colors.royalBlue,
    fontSize: rfs(10.5),
    fontWeight: "bold",
  },
  buyerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing(10),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius(8),
  },
  actionChipText: {
    fontSize: rfs(11.5),
    fontWeight: "700",
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: radius(20),
    padding: spacing(30),
    alignItems: "center",
    marginTop: spacing(10),
    ...Shadow.card,
  },
  emptyTitle: {
    fontSize: rfs(15),
    fontWeight: "bold",
    color: Colors.navy,
    marginTop: spacing(12),
  },
  emptySubtitle: {
    fontSize: rfs(12),
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: spacing(4),
    marginBottom: spacing(16),
  },
  emptyAddButton: {
    backgroundColor: Colors.navy,
    paddingHorizontal: spacing(18),
    paddingVertical: spacing(10),
    borderRadius: radius(12),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 7, 45, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: radius(26),
    borderTopRightRadius: radius(26),
    padding: spacing(20),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(16),
  },
  modalTitle: {
    fontSize: rfs(16),
    fontWeight: "bold",
    color: Colors.navy,
  },
  inputLabel: {
    fontSize: rfs(12),
    fontWeight: "600",
    color: Colors.navy,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: "#e5eaf7",
    borderRadius: radius(12),
    paddingHorizontal: 14,
    height: 44,
    fontSize: rfs(13),
    color: Colors.navy,
  },
  modalCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius(12),
    borderWidth: 1.5,
    borderColor: Colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: Colors.navy,
    fontWeight: "bold",
    fontSize: rfs(13),
  },
  modalSaveBtn: {
    flex: 2,
    height: 46,
    backgroundColor: Colors.navy,
    borderRadius: radius(12),
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: rfs(13),
  },
});
