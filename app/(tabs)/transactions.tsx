import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFishStore } from "../../src/store";

export default function TransactionsTab() {
  const router = useRouter();
  const { transactions, customers } = useFishStore();

  // Math stats
  const totalOverall = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);
  const totalEarned = transactions
    .filter((tx) => tx.payment_status === "paid")
    .reduce((sum, tx) => sum + tx.total_amount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#00072d" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#00072d",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 20, fontWeight: "bold" }}>
          Keuangan & Transaksi
        </Text>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: "#e5eaf7" }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {/* Stats Row */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: "#ffffff", padding: 16, borderRadius: 14, elevation: 1 }}>
            <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "500" }}>Uang Keseluruhan</Text>
            <Text style={{ color: "#00072d", fontSize: 18, fontWeight: "bold", marginTop: 6 }}>
              Rp {totalOverall.toLocaleString()}
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: "#ffffff", padding: 16, borderRadius: 14, elevation: 1 }}>
            <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "500" }}>Uang Berhasil Didapatkan</Text>
            <Text style={{ color: "#22c55e", fontSize: 18, fontWeight: "bold", marginTop: 6 }}>
              Rp {totalEarned.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Transaction History Section */}
        <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>Riwayat Penjualan</Text>

        {transactions.length === 0 ? (
          <View style={{ backgroundColor: "#ffffff", padding: 30, borderRadius: 16, alignItems: "center", borderWidth: 1.5, borderColor: "#123499" }}>
            <Ionicons name="receipt-outline" size={48} color="#64748b" />
            <Text style={{ color: "#64748b", fontSize: 14, marginTop: 10 }}>Belum ada riwayat transaksi.</Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <View
              key={tx.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                marginBottom: 14,
                borderWidth: 1.2,
                borderColor: "rgba(18, 52, 153, 0.25)",
                overflow: "hidden",
                shadowColor: "#123499",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Top Colored Indicator Bar */}
              <View
                style={{
                  height: 4,
                  backgroundColor: tx.payment_status === "paid" ? "#22c55e" : "#ef4444",
                }}
              />

              <View style={{ padding: 16 }}>
                {/* Header Info */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 12 }}>
                  <View>
                    <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold" }}>
                      {tx.customer_name}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>
                      {tx.invoice_number} | {new Date(tx.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Paid Status badge */}
                  <View
                    style={{
                      backgroundColor: tx.payment_status === "paid" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: tx.payment_status === "paid" ? "#22c55e" : "#ef4444",
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    >
                      {tx.payment_status === "paid" ? "LUNAS" : "TEMPO"}
                    </Text>
                  </View>
                </View>

                {/* Items Details */}
                <View style={{ borderTopWidth: 1, borderTopColor: "#e5eaf7", paddingTop: 10 }}>
                  {tx.items.map((item) => (
                    <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, marginRight: 8 }}>
                        <Text style={{ color: "#051650", fontSize: 13 }} numberOfLines={1}>
                          {item.fish_name} ({item.quantity} Kg)
                        </Text>
                        {item.stock_not_found && (
                          <View style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ color: "#ef4444", fontSize: 9, fontWeight: "bold" }}>
                              Stok tidak ada
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "500" }}>
                        Rp {item.subtotal.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Notes or details */}
                {tx.notes && (
                  <View style={{ backgroundColor: "#e5eaf7", padding: 8, borderRadius: 8, marginTop: 10 }}>
                    <Text style={{ color: "#051650", fontSize: 11, fontStyle: "italic" }}>
                      Catatan: {tx.notes}
                    </Text>
                  </View>
                )}

                {/* Final Transaction Total */}
                <View style={{ borderTopWidth: 1, borderTopColor: "#e5eaf7", paddingTop: 8, marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#64748b", fontSize: 11 }}>Total Pembayaran</Text>
                  <Text style={{ color: "#123499", fontSize: 15, fontWeight: "bold" }}>
                    Rp {tx.total_amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
