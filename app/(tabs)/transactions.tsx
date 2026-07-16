import React from "react";
import {
  View,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFishStore } from "../../src/store";
import { Colors, Type, Shadow, SharedStyles } from "../../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../../src/utils/responsive";

export default function TransactionsTab() {
  const router = useRouter();
  const { transactions, customers } = useFishStore();

  // Math stats
  const totalOverall = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);
  const totalEarned = transactions
    .filter((tx) => tx.payment_status === "paid")
    .reduce((sum, tx) => sum + tx.total_amount, 0);

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
              <Ionicons name="ellipsis-horizontal" size={iconSize(24)} color="#ffffff" />
            </View>
            <Text style={{ color: "#ffffff", fontSize: rfs(12), opacity: 0.8, marginBottom: 4 }}>Total Uang Masuk Lunas</Text>
            <Text style={{ color: "#ffffff", fontSize: rfs(32), fontWeight: "900" }} numberOfLines={1} adjustsFontSizeToFit>
              Rp {totalEarned.toLocaleString()}
            </Text>
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
            <Text style={{ color: "#ffffff", fontSize: rfs(26), fontWeight: "800" }} numberOfLines={1} adjustsFontSizeToFit>
              Rp {totalOverall.toLocaleString()}
            </Text>
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
            <Ionicons name="filter" size={iconSize(20)} color="#ffffff" />
          </View>

          {transactions.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: spacing(40) }}>
              <Ionicons name="receipt-outline" size={iconSize(48)} color="rgba(255,255,255,0.3)" />
              <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: spacing(12), fontSize: rfs(14) }}>
                Belum ada riwayat transaksi.
              </Text>
            </View>
          ) : (
            transactions.map((tx) => (
              <View
                key={tx.id}
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: radius(20),
                  padding: spacing(16),
                  marginBottom: spacing(14),
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                {/* Header Info */}
                <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(16) }]}>
                  <View style={[SharedStyles.row, { flex: 1, marginRight: spacing(8) }]}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: tx.payment_status === "paid" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                      alignItems: "center", justifyContent: "center", marginRight: spacing(12)
                    }}>
                      <Ionicons name={tx.payment_status === "paid" ? "checkmark" : "time"} size={iconSize(20)} color={tx.payment_status === "paid" ? "#4ade80" : "#f87171"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#ffffff", fontSize: rfs(14), fontWeight: "bold", marginBottom: 2 }} numberOfLines={1}>{tx.customer_name}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: rfs(11) }} numberOfLines={1}>
                        {tx.invoice_number} | {new Date(tx.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={[tx.payment_status === "paid" ? SharedStyles.badgePaid : SharedStyles.badgeUnpaid, { backgroundColor: tx.payment_status === "paid" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)" }]}>
                    <Text style={{
                      color: tx.payment_status === "paid" ? "#4ade80" : "#f87171",
                      fontSize: rfs(10), fontWeight: "800", textTransform: "uppercase",
                    }}>
                      {tx.payment_status === "paid" ? "LUNAS" : "TEMPO"}
                    </Text>
                  </View>
                </View>

                {/* Items */}
                <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: spacing(12) }}>
                  {tx.items.map((item) => (
                    <View key={item.id} style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(6) }]}>
                      <View style={[SharedStyles.row, { gap: spacing(6), flex: 1, marginRight: spacing(8) }]}>
                        <Text style={{ fontSize: rfs(12), color: "rgba(255,255,255,0.8)" }} numberOfLines={1}>
                          {item.fish_name} ({item.quantity} Kg)
                        </Text>
                        {item.stock_not_found && (
                          <View style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", paddingHorizontal: spacing(6), paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: "#f87171", fontSize: rfs(9), fontWeight: "700" }}>
                              Stok kosong
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: rfs(12), fontWeight: "600", color: "#ffffff" }}>
                        Rp {item.subtotal.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Notes */}
                {tx.notes && (
                  <View style={{ backgroundColor: "rgba(0,0,0,0.2)", padding: spacing(10), borderRadius: radius(8), marginTop: spacing(10) }}>
                    <Text style={{ fontSize: rfs(11), fontStyle: "italic", color: "rgba(255,255,255,0.6)" }}>
                      Catatan: {tx.notes}
                    </Text>
                  </View>
                )}

                {/* Total */}
                <View style={[SharedStyles.row, {
                  justifyContent: "space-between",
                  borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)",
                  paddingTop: spacing(12), marginTop: spacing(10),
                }]}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: rfs(12) }}>Total Tagihan</Text>
                  <Text style={{ color: "#ffffff", fontSize: rfs(16), fontWeight: "900" }}>
                    Rp {tx.total_amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
