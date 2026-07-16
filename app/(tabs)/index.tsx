import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFishStore, useAuthStore } from "../../src/store";
import { Colors, Type, Shadow, SharedStyles } from "../../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../../src/utils/responsive";
import FishLogo from "../../src/components/FishLogo";

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
    <SafeAreaView style={SharedStyles.screen}>
      {/* Header */}
      <View style={[SharedStyles.header, { backgroundColor: "transparent", paddingVertical: spacing(20) }]}>
        <View style={[SharedStyles.row, { gap: spacing(10) }]}>
          <FishLogo width={wp(32)} height={wp(32)} color={Colors.navy} />
          <Text style={{ color: Colors.textPrimary, fontSize: rfs(18), fontWeight: "900", letterSpacing: 0.5 }}>
            KULAKAN IKAN
          </Text>
        </View>
        <Pressable onPress={() => router.push("/profile")}>
          <Image
            source={{ uri: user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" }}
            style={{ width: wp(40), height: wp(40), borderRadius: wp(20), borderWidth: 2, borderColor: Colors.textPrimary }}
          />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing(100) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: spacing(16) }}>
          {/* Main Card (Visa Style) */}
          <View style={{
            backgroundColor: Colors.cardBlue,
            borderRadius: radius(24),
            padding: spacing(20),
            marginBottom: spacing(16),
            ...Shadow.cardLift,
          }}>
            <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(32) }]}>
              <Ionicons name="card-outline" size={iconSize(24)} color="#ffffff" />
              <Text style={{ color: "#ffffff", opacity: 0.8, fontWeight: "600", fontSize: rfs(12) }}>Omset Bisnis</Text>
            </View>
            <View>
              <Text style={{ color: "#ffffff", fontSize: rfs(12), opacity: 0.8, marginBottom: 4 }}>Total Omset Keseluruhan</Text>
              <Text style={{ color: "#ffffff", fontSize: rfs(28), fontWeight: "900" }} numberOfLines={1} adjustsFontSizeToFit>
                Rp {totalOverall.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Secondary Card (Lunas) */}
          <View style={{
            backgroundColor: Colors.royalBlueLight,
            borderRadius: radius(24),
            padding: spacing(20),
            marginBottom: spacing(28),
          }}>
            <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(24) }]}>
              <Ionicons name="wallet-outline" size={iconSize(24)} color="#ffffff" />
              <Text style={{ color: "#ffffff", opacity: 0.9, fontWeight: "600", fontSize: rfs(12) }}>Total Lunas</Text>
            </View>
            <View>
              <Text style={{ color: "#ffffff", fontSize: rfs(22), fontWeight: "800" }} numberOfLines={1} adjustsFontSizeToFit>
                Rp {totalEarned.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Activities Row */}
          <Text style={{ ...Type.h2, marginBottom: spacing(16) }}>Aktivitas Cepat</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing(32) }}>
            {[
              { icon: "add-circle", label: "Tambah", action: () => router.push("/input-barang") },
              { icon: "swap-horizontal", label: "Transaksi", action: () => router.push("/transactions") },
              { icon: "cube", label: "Gudang", action: () => router.push("/stock") },
              { icon: "document-text", label: "Nota PDF", action: () => router.push("/buyer-history") },
            ].map((act, i) => (
              <View key={i} style={{ alignItems: "center" }}>
                <Pressable
                  onPress={act.action}
                  style={({ pressed }) => ({
                    width: wp(56),
                    height: wp(56),
                    borderRadius: wp(28),
                    backgroundColor: Colors.navy,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: spacing(8),
                    opacity: pressed ? 0.8 : 1,
                    ...Shadow.button,
                  })}
                >
                  <Ionicons name={act.icon as any} size={iconSize(24)} color="#ffffff" />
                </Pressable>
                <Text style={{ color: Colors.textPrimary, fontSize: rfs(11), fontWeight: "700" }}>{act.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Transactions Bottom Sheet */}
        <View style={{
          backgroundColor: Colors.navy,
          borderTopLeftRadius: radius(32),
          borderTopRightRadius: radius(32),
          padding: spacing(24),
          minHeight: hp(400),
          marginTop: spacing(8),
        }}>
          <View style={{ alignItems: "center", marginBottom: spacing(16) }}>
            <View style={{ width: 40, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 }} />
          </View>
          
          <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(24) }]}>
            <Text style={{ color: "#ffffff", fontSize: rfs(18), fontWeight: "bold" }}>Riwayat Transaksi</Text>
            <Ionicons name="ellipsis-horizontal" size={iconSize(20)} color="#ffffff" />
          </View>

          {recentTransactions.length === 0 ? (
            <Text style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: spacing(20) }}>
              Belum ada transaksi saat ini.
            </Text>
          ) : (
            recentTransactions.map((tx) => (
              <View key={tx.id} style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(24) }]}>
                <View style={[SharedStyles.row, { flex: 1 }]}>
                  <View style={{
                    width: wp(48), height: wp(48), borderRadius: wp(24),
                    backgroundColor: tx.payment_status === "paid" ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                    alignItems: "center", justifyContent: "center", marginRight: spacing(14)
                  }}>
                    <Ionicons name={tx.payment_status === "paid" ? "checkmark-circle" : "time"} size={iconSize(24)} color={tx.payment_status === "paid" ? "#4ade80" : "#f87171"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: rfs(14), fontWeight: "bold", marginBottom: 4 }} numberOfLines={1}>
                      {tx.customer_name}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: rfs(11) }}>
                      {new Date(tx.created_at).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: "#ffffff", fontSize: rfs(14), fontWeight: "bold" }}>
                  Rp {tx.total_amount.toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
