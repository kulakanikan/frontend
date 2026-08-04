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
import { useSupplierStore } from "../src/store";
import type { ApiSupplier } from "../src/services/api";

export default function SuppliersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { suppliers, isLoading, fetchSuppliers, addSupplier, updateSupplier, deleteSupplier } = useSupplierStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ApiSupplier | null>(null);

  // Form State
  const [formNama, setFormNama] = useState("");
  const [formTelepon, setFormTelepon] = useState("");
  const [formAlamat, setFormAlamat] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSuppliers().catch((err) => console.error("Failed to load suppliers:", err));
  }, [fetchSuppliers]);

  const filteredSuppliers = suppliers.filter((s) => {
    const name = s.namaNelayan || "";
    const addr = s.alamat || "";
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || addr.toLowerCase().includes(q);
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormNama("");
    setFormTelepon("");
    setFormAlamat("");
    setShowModal(true);
  };

  const openEditModal = (supplier: ApiSupplier) => {
    setEditingSupplier(supplier);
    setFormNama(supplier.namaNelayan || "");
    setFormTelepon(supplier.telepon || "");
    setFormAlamat(supplier.alamat || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formNama.trim()) {
      Alert.alert("Perhatian", "Nama nelayan / pemasok wajib diisi");
      return;
    }

    setIsSaving(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, {
          nama_nelayan: formNama.trim(),
          telepon: formTelepon.trim() || null,
          alamat: formAlamat.trim() || null,
        });
      } else {
        await addSupplier({
          nama_nelayan: formNama.trim(),
          telepon: formTelepon.trim() || undefined,
          alamat: formAlamat.trim() || undefined,
        });
      }
      setShowModal(false);
      Alert.alert("Berhasil", editingSupplier ? "Data nelayan berhasil diperbarui" : "Nelayan baru berhasil ditambahkan");
    } catch (err) {
      Alert.alert("Gagal", "Tidak dapat menyimpan data nelayan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Hapus Nelayan", `Apakah Anda yakin ingin menghapus data nelayan "${name}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSupplier(id);
          } catch (err) {
            Alert.alert("Gagal", "Tidak dapat menghapus data nelayan");
          }
        },
      },
    ]);
  };

  const handleOpenWa = (phone: string, name: string) => {
    if (!phone) {
      Alert.alert("Perhatian", "Nomor telepon/WhatsApp tidak tersedia untuk nelayan ini");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formatted = cleanPhone.startsWith("0") ? `62${cleanPhone.slice(1)}` : cleanPhone;
    const msg = `Halo Pak ${name}, mengenai pasokan ikan untuk kulakan hari ini...`;
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
          <Text style={{ ...Type.h2, fontSize: rfs(17) }}>Data Nelayan & Pemasok</Text>
          <Text style={{ color: Colors.textMuted, fontSize: rfs(11) }}>
            Kelola mitra nelayan dan pemasok ikan tangkapan
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
            placeholder="Cari nelayan atau alamat dermaga..."
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

        {/* Loading Indicator */}
        {isLoading && suppliers.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={Colors.royalBlue} />
            <Text style={{ color: Colors.textMuted, marginTop: 8, fontSize: rfs(12) }}>Memuat data nelayan...</Text>
          </View>
        ) : filteredSuppliers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="boat-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Nelayan Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? `Tidak ada nelayan cocok dengan "${searchQuery}"` : "Belum ada data nelayan terdaftar."}
            </Text>
            <TouchableOpacity onPress={openCreateModal} style={styles.emptyAddButton}>
              <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: rfs(12) }}>+ Tambah Nelayan Baru</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredSuppliers.map((supplier) => {
            const name = supplier.namaNelayan || "Nelayan";
            const phone = supplier.telepon;
            const address = supplier.alamat || "Dermaga / Pelabuhan TPI";
            const batchesCount = 0;

            return (
              <View key={supplier.id} style={styles.supplierCard}>
                <View style={styles.supplierHeader}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="boat" size={iconSize(20)} color={Colors.royalBlue} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.supplierName}>{name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.supplierAddress} numberOfLines={1}>
                        {address}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.batchBadge}>
                    <Text style={styles.batchBadgeText}>{batchesCount} Pasokan</Text>
                  </View>
                </View>

                {/* Footer Quick Actions */}
                <View style={styles.supplierFooter}>
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

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => openEditModal(supplier)}
                      style={styles.iconBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="create-outline" size={18} color={Colors.navy} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(supplier.id, name)}
                      style={styles.iconBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* CREATE / EDIT SUPPLIER MODAL */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSupplier ? "Edit Data Nelayan" : "Tambah Nelayan Baru"}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </Pressable>
            </View>

            {/* Form Inputs */}
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.inputLabel}>Nama Nelayan / Pemasok *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Pak Haji Ahmad"
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

            <View style={{ marginBottom: 20 }}>
              <Text style={styles.inputLabel}>Alamat / Dermaga TPI</Text>
              <TextInput
                style={[styles.textInput, { height: 70, paddingTop: 10 }]}
                placeholder="Contoh: Dermaga TPI Kedungmalang, Jepara"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                value={formAlamat}
                onChangeText={setFormAlamat}
              />
            </View>

            {/* Modal Buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
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
                    {editingSupplier ? "Simpan Perubahan" : "Tambah Nelayan"}
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
    marginBottom: spacing(16),
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
  supplierCard: {
    backgroundColor: "#ffffff",
    borderRadius: radius(18),
    padding: spacing(14),
    marginBottom: spacing(12),
    borderWidth: 1.5,
    borderColor: "rgba(43, 120, 228, 0.15)",
    ...Shadow.card,
  },
  supplierHeader: {
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
  supplierName: {
    fontSize: rfs(14),
    fontWeight: "800",
    color: Colors.navy,
  },
  supplierAddress: {
    fontSize: rfs(11.5),
    color: Colors.textMuted,
    flex: 1,
  },
  batchBadge: {
    backgroundColor: Colors.royalBlueMuted,
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(4),
    borderRadius: radius(8),
  },
  batchBadgeText: {
    color: Colors.royalBlue,
    fontSize: rfs(10.5),
    fontWeight: "bold",
  },
  supplierFooter: {
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
