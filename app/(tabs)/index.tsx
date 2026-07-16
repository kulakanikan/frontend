import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFishStore, useAuthStore } from "../../src/store";

export default function HomeTab() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fishStocks, transactions } = useFishStore();

  // Calculations for stats
  const totalQuantity = fishStocks.reduce((sum, item) => sum + item.quantity, 0);
  const totalOverall = transactions.reduce((sum, tx) => sum + tx.total_amount, 0);
  const totalEarned = transactions
    .filter((tx) => tx.payment_status === "paid")
    .reduce((sum, tx) => sum + tx.total_amount, 0);

  // Recent transactions list
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#00072d" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#00072d",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Logo Branding */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#eab308", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="fish" size={20} color="#00072d" />
          </View>
          <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 }}>
            KULAKAN IKAN
          </Text>
        </View>

        {/* Profile Navigation Button */}
        <Pressable
          onPress={() => router.push("/profile")}
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
            flexDirection: "row",
            alignItems: "center",
          })}
        >
          <Image
            source={{ uri: user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: "#eab308",
            }}
          />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: "#e5eaf7" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {/* Quick Action Button: History & PDF Receipts */}
        <Pressable
          onPress={() => router.push("/buyer-history")}
          style={({ pressed }) => ({
            backgroundColor: "#123499",
            borderRadius: 16,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            borderWidth: 1.2,
            borderColor: "rgba(255, 255, 255, 0.16)",
            opacity: pressed ? 0.9 : 1,
            shadowColor: "#123499",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 3,
          })}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255, 255, 255, 0.15)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="document-text" size={20} color="#ffffff" />
            </View>
            <View style={{ flex: 0.95 }}>
              <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                Riwayat & Cetak Nota PDF
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 11, marginTop: 2 }}>
                Lihat nota belanja pembeli & cetak PDF
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#ffffff" />
        </Pressable>

        {/* SECTION 1: OVERALL STATS (Statis Keseluruhan Donut Chart) */}
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 20,
            padding: 20,
            borderWidth: 1.2,
            borderColor: "rgba(18, 52, 153, 0.25)",
            shadowColor: "#123499",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 2,
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#00072d", fontSize: 15, fontWeight: "bold", alignSelf: "flex-start", marginBottom: 16 }}>
            Statis Keseluruhan Inventaris
          </Text>

          {/* Premium Donut Chart Container */}
          <View style={{ position: "relative", width: 140, height: 140, justifyContent: "center", alignItems: "center", marginBottom: 20 }}>
            {/* Outer segmented color borders ring */}
            <View
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                borderWidth: 12,
                borderTopColor: "#eab308",     // segment 1: yellow
                borderRightColor: "#22c55e",   // segment 2: green
                borderBottomColor: "#123499",  // segment 3: carribean blue
                borderLeftColor: "#3b82f6",    // segment 4: light blue
              }}
            />
            {/* Inner white circle masking the donut */}
            <View
              style={{
                position: "absolute",
                width: 116,
                height: 116,
                borderRadius: 58,
                backgroundColor: "#ffffff",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#00072d", fontSize: 20, fontWeight: "900" }}>
                {totalQuantity} Kg
              </Text>
              <Text style={{ color: "#64748b", fontSize: 10, fontWeight: "600", textTransform: "uppercase", marginTop: 2 }}>
                Total Berat
              </Text>
            </View>
          </View>

          {/* Color Legends */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, width: "100%", borderTopWidth: 1, borderTopColor: "#e5eaf7", paddingTop: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#eab308", marginRight: 6 }} />
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>Sangat Baik</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e", marginRight: 6 }} />
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>Segar</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#123499", marginRight: 6 }} />
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>Cukup</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#3b82f6", marginRight: 6 }} />
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>Beku</Text>
            </View>
          </View>
        </View>

        {/* SECTION 2: FINANCIAL STATS (Statis Keuangan Double Box) */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          {/* Card 1: Total Omset (Uang Keseluruhan) */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#ffffff",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1.2,
              borderColor: "rgba(18, 52, 153, 0.25)",
              elevation: 2,
              shadowColor: "#123499",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "bold" }}>Total Omset</Text>
              {/* Mini ring graphic */}
              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 4, borderTopColor: "#123499", borderRightColor: "#123499", borderBottomColor: "#123499", borderLeftColor: "#e5eaf7" }} />
            </View>
            <Text style={{ color: "#00072d", fontSize: 16, fontWeight: "bold" }}>
              Rp {totalOverall.toLocaleString()}
            </Text>
            <Text style={{ color: "#64748b", fontSize: 10, marginTop: 4 }}>Keseluruhan penjualan</Text>
          </View>

          {/* Card 2: Total Lunas (Uang Berhasil Didapatkan) */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#ffffff",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1.2,
              borderColor: "rgba(18, 52, 153, 0.25)",
              elevation: 2,
              shadowColor: "#123499",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "bold" }}>Total Lunas</Text>
              {/* Mini green ring graphic */}
              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 4, borderTopColor: "#22c55e", borderRightColor: "#22c55e", borderBottomColor: "#22c55e", borderLeftColor: "#e5eaf7" }} />
            </View>
            <Text style={{ color: "#22c55e", fontSize: 16, fontWeight: "bold" }}>
              Rp {totalEarned.toLocaleString()}
            </Text>
            <Text style={{ color: "#64748b", fontSize: 10, marginTop: 4 }}>Pembayaran sukses</Text>
          </View>
        </View>

        {/* SECTION 3: FINANCIAL LIST (List Keuangan / Riwayat Transaksi Terkini) */}
        <Text style={{ color: "#00072d", fontSize: 15, fontWeight: "bold", marginBottom: 12 }}>Riwayat Transaksi Terkini</Text>

        {recentTransactions.length === 0 ? (
          <View style={{ backgroundColor: "#ffffff", padding: 30, borderRadius: 16, alignItems: "center", borderWidth: 1.2, borderColor: "rgba(18, 52, 153, 0.25)" }}>
            <Ionicons name="receipt-outline" size={40} color="#64748b" style={{ marginBottom: 8 }} />
            <Text style={{ color: "#64748b", fontSize: 13 }}>Belum ada transaksi saat ini.</Text>
          </View>
        ) : (
          recentTransactions.map((tx) => (
            <View
              key={tx.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                padding: 16,
                marginBottom: 10,
                borderWidth: 1.2,
                borderColor: "rgba(18, 52, 153, 0.25)",
                shadowColor: "#123499",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Top details */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <View>
                  <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold" }}>{tx.customer_name}</Text>
                  <Text style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>{tx.created_at}</Text>
                </View>
                {/* Status tag */}
                <View
                  style={{
                    backgroundColor: tx.payment_status === "paid" ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
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
                      textTransform: "uppercase",
                    }}
                  >
                    {tx.payment_status === "paid" ? "Lunas" : "Tempo"}
                  </Text>
                </View>
              </View>

              {/* Items row */}
              <View style={{ backgroundColor: "#f8fafc", padding: 10, borderRadius: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ color: "#051650", fontSize: 12, fontWeight: "bold" }} numberOfLines={1}>
                    {tx.items.map((i) => `${i.fish_name} (${i.quantity} Kg)${i.stock_not_found ? " (Stok tidak ada)" : ""}`).join(", ")}
                  </Text>
                </View>
                <Text style={{ color: "#123499", fontSize: 13, fontWeight: "bold" }}>
                  Rp {tx.total_amount.toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
