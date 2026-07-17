import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTransactionStore } from "../../src/store";
import { Colors, Type, Shadow, SharedStyles } from "../../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../../src/utils/responsive";
import { formatCurrency, formatWeight } from "../../src/utils";
import type { ApiSale, ApiSaleDetail } from "../../src/services/api";

export default function TransactionsTab() {
  const router = useRouter();
  const { sales, fetchSales, fetchSaleDetail, addPayment, isLoading } = useTransactionStore();

  const [activeFilter, setActiveFilter] = useState("semua");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  
  // Detail & Payment Modal States
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [saleDetail, setSaleDetail] = useState<ApiSaleDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Fetch sales when page comes into focus, respecting selected filter
  useFocusEffect(
    useCallback(() => {
      const filter = activeFilter === "semua" ? undefined : activeFilter;
      fetchSales({ status_bayar: filter }).catch((err) => console.error(err));
    }, [fetchSales, activeFilter])
  );

  const handleFilterChange = (status: string) => {
    setActiveFilter(status);
    const filter = status === "semua" ? undefined : status;
    fetchSales({ status_bayar: filter }).catch((err) => console.error(err));
  };

  const handleOpenDetail = async (sale: ApiSale) => {
    setSelectedSaleId(sale.id);
    setSaleDetail(null);
    setShowDetailModal(true);
    setIsDetailLoading(true);
    try {
      const detail = await fetchSaleDetail(sale.id);
      setSaleDetail(detail);
    } catch (e) {
      alert("Gagal memuat detail transaksi");
      setShowDetailModal(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedSaleId || !saleDetail) return;
    const amount = Number(paymentAmount);
    if (!paymentAmount || isNaN(amount) || amount <= 0) {
      alert("Jumlah pembayaran harus berupa angka positif!");
      return;
    }

    const remaining = Number(saleDetail.total) - totalPaid;
    if (amount > remaining) {
      alert(`Jumlah pembayaran melebihi sisa tagihan (${formatCurrency(remaining)})!`);
      return;
    }

    setIsSavingPayment(true);
    try {
      await addPayment(selectedSaleId, {
        jumlah_bayar: amount,
        metode_bayar: paymentMethod,
      });
      // Reload detail & refresh main list
      const updatedDetail = await fetchSaleDetail(selectedSaleId);
      setSaleDetail(updatedDetail);
      const filter = activeFilter === "semua" ? undefined : activeFilter;
      await fetchSales({ status_bayar: filter });
      setPaymentAmount("");
      alert("Cicilan berhasil ditambahkan!");
    } catch (err) {
      alert("Gagal mencatat cicilan pembayaran.");
    } finally {
      setIsSavingPayment(false);
    }
  };

  // Calculations for stats based on currently visible/fetched sales list
  const totalOverall = sales.reduce((sum, tx) => sum + Number(tx.total), 0);
  const totalEarned = sales
    .filter((tx) => tx.statusBayar === "lunas")
    .reduce((sum, tx) => sum + Number(tx.total), 0);

  // Calculate detail payment progress
  const totalPaid = saleDetail?.payments?.reduce((sum, p) => sum + Number(p.jumlahBayar), 0) || 0;
  const remainingDebt = saleDetail ? Math.max(0, Number(saleDetail.total) - totalPaid) : 0;
  const paymentProgress = saleDetail ? (totalPaid / Number(saleDetail.total)) : 0;

  return (
    <SafeAreaView style={SharedStyles.screen}>
      <View style={[SharedStyles.header, { backgroundColor: "transparent", paddingVertical: spacing(20) }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: rfs(22), fontWeight: "900", letterSpacing: 0.5 }}>
            Statistik Keuangan
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing(100) }} showsVerticalScrollIndicator={false}>
        
        <View style={{ paddingHorizontal: spacing(16) }}>
          {/* Main Income Card */}
          <View style={{
            backgroundColor: Colors.cardBlue,
            borderRadius: radius(28),
            padding: spacing(24),
            marginBottom: spacing(16),
            ...Shadow.cardLift,
          }}>
            <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(32) }]}>
              <View style={[SharedStyles.row, { gap: spacing(12) }]}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="trending-up" size={iconSize(20)} color="#ffffff" />
                </View>
                <Text style={{ color: "#ffffff", opacity: 0.9, fontWeight: "700", fontSize: rfs(14) }}>Berhasil Didapatkan</Text>
              </View>
            </View>
            <Text style={{ color: "#ffffff", fontSize: rfs(12), opacity: 0.8, marginBottom: 4 }}>Total Uang Masuk Lunas</Text>
            {isLoading && sales.length === 0 ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ alignSelf: "flex-start" }} />
            ) : (
              <Text style={{ color: "#ffffff", fontSize: rfs(32), fontWeight: "900" }} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(totalEarned)}
              </Text>
            )}
          </View>

          {/* Secondary Overall Card */}
          <View style={{
            backgroundColor: Colors.royalBlueLight,
            borderRadius: radius(28),
            padding: spacing(24),
            marginBottom: spacing(24),
            ...Shadow.card,
          }}>
            <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(24) }]}>
              <View style={[SharedStyles.row, { gap: spacing(12) }]}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="pie-chart" size={iconSize(20)} color="#ffffff" />
                </View>
                <Text style={{ color: "#ffffff", opacity: 0.9, fontWeight: "700", fontSize: rfs(14) }}>Omset Keseluruhan</Text>
              </View>
            </View>
            <Text style={{ color: "#ffffff", fontSize: rfs(12), opacity: 0.8, marginBottom: 4 }}>Termasuk Tagihan Tempo</Text>
            {isLoading && sales.length === 0 ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ alignSelf: "flex-start" }} />
            ) : (
              <Text style={{ color: "#ffffff", fontSize: rfs(26), fontWeight: "800" }} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(totalOverall)}
              </Text>
            )}
          </View>
        </View>

        {/* Transactions Dark Navy Sheet */}
        <View style={{
          backgroundColor: Colors.navy,
          borderTopLeftRadius: radius(32),
          borderTopRightRadius: radius(32),
          padding: spacing(24),
          minHeight: hp(500),
          marginTop: spacing(12),
        }}>
          <View style={{ alignItems: "center", marginBottom: spacing(16) }}>
            <View style={{ width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 }} />
          </View>

          <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(24) }]}>
            <Text style={{ color: "#ffffff", fontSize: rfs(18), fontWeight: "bold" }}>Semua Penjualan</Text>
            <View style={{ flexDirection: "row", gap: spacing(6) }}>
              {["semua", "lunas", "tempo"].map((opt) => {
                const isSel = activeFilter === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => handleFilterChange(opt)}
                    style={{
                      backgroundColor: isSel ? Colors.royalBlue : "rgba(255,255,255,0.1)",
                      paddingHorizontal: spacing(10),
                      paddingVertical: spacing(5),
                      borderRadius: radius(10),
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: rfs(11), fontWeight: "bold", textTransform: "capitalize" }}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {isLoading && sales.length === 0 ? (
            <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 40 }} />
          ) : sales.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: spacing(40) }}>
              <Ionicons name="receipt-outline" size={iconSize(48)} color="rgba(255,255,255,0.3)" />
              <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: spacing(12), fontSize: rfs(14) }}>
                Belum ada riwayat transaksi.
              </Text>
            </View>
          ) : (
            sales.map((tx) => (
              <Pressable
                key={tx.id}
                onPress={() => handleOpenDetail(tx)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                  borderRadius: radius(20),
                  padding: spacing(16),
                  marginBottom: spacing(14),
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                })}
              >
                {/* Header Info */}
                <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(16) }]}>
                  <View style={[SharedStyles.row, { flex: 1, marginRight: spacing(8) }]}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: tx.statusBayar === "lunas" ? "rgba(34, 197, 94, 0.2)" : "rgba(245, 158, 11, 0.2)",
                      alignItems: "center", justifyContent: "center", marginRight: spacing(12)
                    }}>
                      <Ionicons name={tx.statusBayar === "lunas" ? "checkmark-circle" : "alert-circle"} size={iconSize(20)} color={tx.statusBayar === "lunas" ? "#4ade80" : "#fbbf24"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#ffffff", fontSize: rfs(14), fontWeight: "bold", marginBottom: 2 }} numberOfLines={1}>
                        {tx.buyer?.nama || "Pelanggan Umum"}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: rfs(11) }} numberOfLines={1}>
                        {tx.receipt?.nomorStruk || tx.id.slice(0, 8)} | {new Date(tx.tanggal).toLocaleDateString("id-ID")}
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: tx.statusBayar === "lunas" ? "rgba(34, 197, 94, 0.2)" : "rgba(245, 158, 11, 0.2)", paddingHorizontal: spacing(8), paddingVertical: 4, borderRadius: radius(8) }}>
                    <Text style={{
                      color: tx.statusBayar === "lunas" ? "#4ade80" : "#fbbf24",
                      fontSize: rfs(10), fontWeight: "800", textTransform: "uppercase",
                    }}>
                      {tx.statusBayar}
                    </Text>
                  </View>
                </View>

                {/* Items */}
                <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: spacing(12) }}>
                  <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(6) }]}>
                    <Text style={{ fontSize: rfs(12), color: "rgba(255,255,255,0.8)" }}>
                      Ikan {tx.batch?.jenisIkan || "Ikan"} ({formatWeight(Number(tx.beratJual))})
                    </Text>
                    <Text style={{ fontSize: rfs(12), fontWeight: "600", color: "#ffffff" }}>
                      {formatCurrency(Number(tx.total))}
                    </Text>
                  </View>
                  {tx.saleExtras.map((extra) => (
                    <View key={extra.id} style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(4) }]}>
                      <Text style={{ fontSize: rfs(11), color: "rgba(255,255,255,0.6)" }}>
                        + {extra.namaItem} ({extra.jumlah}x)
                      </Text>
                      <Text style={{ fontSize: rfs(11), color: "rgba(255,255,255,0.6)" }}>
                        {formatCurrency(Number(extra.subtotal))}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Total */}
                <View style={[SharedStyles.row, {
                  justifyContent: "space-between",
                  borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)",
                  paddingTop: spacing(12), marginTop: spacing(10),
                }]}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: rfs(12) }}>Total Tagihan</Text>
                  <Text style={{ color: "#ffffff", fontSize: rfs(16), fontWeight: "900" }}>
                    {formatCurrency(Number(tx.total))}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* MODAL: TRANSACTION DETAIL & PAYMENTS */}
      <Modal visible={showDetailModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 7, 45, 0.7)", justifyContent: "flex-end" }}>
          <View style={{
            height: "85%",
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            padding: 20,
          }}>
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ color: "#00072d", fontSize: 18, fontWeight: "bold" }}>Detail Transaksi</Text>
              <Pressable onPress={() => { setShowDetailModal(false); setSaleDetail(null); }}>
                <Ionicons name="close-circle" size={26} color="#64748b" />
              </Pressable>
            </View>

            {isDetailLoading || !saleDetail ? (
              <ActivityIndicator size="large" color={Colors.royalBlue} style={{ marginTop: 60 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Invoice Info Card */}
                <View style={{ backgroundColor: "#f0f4f9", borderRadius: radius(16), padding: spacing(16), marginBottom: spacing(20) }}>
                  <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: 10 }]}>
                    <Text style={{ color: Colors.textMuted, fontSize: 12 }}>No. Struk</Text>
                    <Text style={{ color: "#00072d", fontWeight: "bold", fontSize: 13 }}>
                      {saleDetail.receipt?.nomorStruk || saleDetail.id.slice(0, 8)}
                    </Text>
                  </View>
                  <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: 10 }]}>
                    <Text style={{ color: Colors.textMuted, fontSize: 12 }}>Pembeli</Text>
                    <Text style={{ color: "#00072d", fontWeight: "bold", fontSize: 13 }}>
                      {saleDetail.buyer?.nama || "Pelanggan Umum"}
                    </Text>
                  </View>
                  <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: 10 }]}>
                    <Text style={{ color: Colors.textMuted, fontSize: 12 }}>Tanggal Transaksi</Text>
                    <Text style={{ color: "#00072d", fontWeight: "bold", fontSize: 13 }}>
                      {new Date(saleDetail.tanggal).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </Text>
                  </View>
                  <View style={[SharedStyles.row, { justifyContent: "space-between" }]}>
                    <Text style={{ color: Colors.textMuted, fontSize: 12 }}>Status Pembayaran</Text>
                    <View style={{ backgroundColor: saleDetail.statusBayar === "lunas" ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: saleDetail.statusBayar === "lunas" ? "#16a34a" : "#d97706", fontSize: 11, fontWeight: "bold", textTransform: "uppercase" }}>
                        {saleDetail.statusBayar}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Items & Extras Card */}
                <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>Rincian Barang</Text>
                <View style={{ borderBottomWidth: 1, borderBottomColor: "#e5eaf7", pb: 16, marginBottom: 16 }}>
                  <View style={[SharedStyles.row, { justifyContent: "space-between", paddingVertical: 10 }]}>
                    <View>
                      <Text style={{ color: "#00072d", fontWeight: "bold", fontSize: 13 }}>Ikan {saleDetail.batch?.jenisIkan || "Ikan"}</Text>
                      <Text style={{ color: Colors.textMuted, fontSize: 11, marginTop: 2 }}>{formatWeight(Number(saleDetail.beratJual))} @ {formatCurrency(Number(saleDetail.hargaSatuan))}/Kg</Text>
                    </View>
                    <Text style={{ color: "#00072d", fontWeight: "bold", fontSize: 13 }}>
                      {formatCurrency(Number(saleDetail.beratJual) * Number(saleDetail.hargaSatuan))}
                    </Text>
                  </View>
                  
                  {saleDetail.saleExtras.map((extra) => (
                    <View key={extra.id} style={[SharedStyles.row, { justifyContent: "space-between", paddingVertical: 8 }]}>
                      <View>
                        <Text style={{ color: "#00072d", fontSize: 13 }}>+ {extra.namaItem}</Text>
                        <Text style={{ color: Colors.textMuted, fontSize: 11, marginTop: 2 }}>{extra.jumlah}x @ {formatCurrency(Number(extra.hargaSatuan))}</Text>
                      </View>
                      <Text style={{ color: "#00072d", fontSize: 13 }}>{formatCurrency(Number(extra.subtotal))}</Text>
                    </View>
                  ))}
                  
                  <View style={[SharedStyles.row, { justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e5eaf7", paddingTop: 12, marginTop: 8 }]}>
                    <Text style={{ color: "#00072d", fontWeight: "bold", fontSize: 14 }}>Total Tagihan</Text>
                    <Text style={{ color: Colors.royalBlue, fontWeight: "900", fontSize: 16 }}>
                      {formatCurrency(Number(saleDetail.total))}
                    </Text>
                  </View>
                </View>

                {/* Payment Progress bar for Tempo */}
                <View style={{ marginBottom: 20 }}>
                  <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: 6 }]}>
                    <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "bold" }}>Progress Pembayaran</Text>
                    <Text style={{ color: Colors.textMuted, fontSize: 11 }}>
                      {formatCurrency(totalPaid)} / {formatCurrency(Number(saleDetail.total))}
                    </Text>
                  </View>
                  {/* Outer Bar */}
                  <View style={{ height: 8, backgroundColor: "#e5eaf7", borderRadius: 4, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${paymentProgress * 100}%`, backgroundColor: Colors.success }} />
                  </View>
                  {remainingDebt > 0 && (
                    <Text style={{ color: "#d97706", fontSize: 11, fontWeight: "bold", marginTop: 6, alignSelf: "flex-end" }}>
                      Sisa Tagihan: {formatCurrency(remainingDebt)}
                    </Text>
                  )}
                </View>

                {/* Payment History List */}
                <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>Riwayat Pembayaran</Text>
                {saleDetail.payments && saleDetail.payments.length > 0 ? (
                  saleDetail.payments.map((p) => (
                    <View key={p.id} style={[SharedStyles.row, {
                      justifyContent: "space-between", backgroundColor: "#f9fafb",
                      padding: 12, borderRadius: radius(12), marginBottom: 8,
                      borderWidth: 1, borderColor: "#e5eaf7"
                    }]}>
                      <View>
                        <Text style={{ color: "#00072d", fontWeight: "bold", fontSize: 12, textTransform: "capitalize" }}>
                          Metode: {p.metodeBayar}
                        </Text>
                        <Text style={{ color: Colors.textMuted, fontSize: 10, marginTop: 2 }}>
                          {new Date(p.dibayarAt).toLocaleString("id-ID")}
                        </Text>
                      </View>
                      <Text style={{ color: Colors.successDark, fontWeight: "bold", fontSize: 13 }}>
                        +{formatCurrency(Number(p.jumlahBayar))}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: Colors.textMuted, fontSize: 12, fontStyle: "italic", marginBottom: 16 }}>Belum ada riwayat cicilan.</Text>
                )}

                {/* Form Tambah Cicilan (if tempo) */}
                {saleDetail.statusBayar === "tempo" && (
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: "#e5eaf7", paddingTop: 16 }}>
                    <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold", marginBottom: 12 }}>Input Cicilan Pembayaran</Text>
                    
                    {/* Amount Input */}
                    <View style={{ marginBottom: 12 }}>
                      <Text style={{ color: "#00072d", fontSize: 12, fontWeight: "600", marginBottom: 6 }}>Jumlah Bayar (Rp)</Text>
                      <TextInput
                        style={{ height: 44, backgroundColor: "#f0f4f9", borderRadius: 12, paddingHorizontal: 14, fontSize: 13, color: "#00072d" }}
                        placeholder="Masukkan nominal cicilan"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        value={paymentAmount}
                        onChangeText={setPaymentAmount}
                      />
                    </View>

                    {/* Method Selector */}
                    <View style={{ marginBottom: 18 }}>
                      <Text style={{ color: "#00072d", fontSize: 12, fontWeight: "600", marginBottom: 8 }}>Metode Pembayaran</Text>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        {["cash", "transfer"].map((method) => {
                          const isSelected = paymentMethod === method;
                          return (
                            <TouchableOpacity
                              key={method}
                              onPress={() => setPaymentMethod(method)}
                              style={{
                                flex: 1,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: isSelected ? Colors.navy : "#f0f4f9",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text style={{ color: isSelected ? "#ffffff" : "#00072d", fontWeight: "bold", fontSize: 12, textTransform: "capitalize" }}>
                                {method}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Submit Button */}
                    <Pressable
                      disabled={isSavingPayment}
                      onPress={handleAddPayment}
                      style={({ pressed }) => ({
                        height: 46,
                        backgroundColor: pressed ? Colors.successDark : Colors.success,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                      })}
                    >
                      {isSavingPayment ? (
                        <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                      ) : (
                        <Ionicons name="card" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                      )}
                      <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 14 }}>
                        {isSavingPayment ? "Menyimpan..." : "Bayar Cicilan"}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* Receipt Shortcut */}
                <Pressable
                  onPress={() => {
                    setShowDetailModal(false);
                    if (saleDetail.receipt?.id) {
                      router.push(`/receipts/${saleDetail.receipt.id}`);
                    } else {
                      alert("Struk belum digenerate untuk transaksi ini");
                    }
                  }}
                  style={({ pressed }) => ({
                    height: 46,
                    backgroundColor: pressed ? "rgba(43, 120, 228, 0.15)" : "rgba(43, 120, 228, 0.08)",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: spacing(16),
                    marginBottom: spacing(32),
                    flexDirection: "row",
                    borderWidth: 1,
                    borderColor: Colors.royalBlue,
                  })}
                >
                  <Ionicons name="document-text-outline" size={18} color={Colors.royalBlue} style={{ marginRight: 8 }} />
                  <Text style={{ color: Colors.royalBlue, fontWeight: "bold", fontSize: 13 }}>Lihat Struk Penjualan</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
