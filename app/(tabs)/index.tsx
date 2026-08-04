import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFishStore, useAuthStore, useDashboardStore, useDeliveryStore } from "../../src/store";
import { Colors, Type, Shadow, SharedStyles } from "../../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../../src/utils/responsive";
import { formatCurrency, formatWeight } from "../../src/utils";
import FishLogo from "../../src/components/FishLogo";

export default function HomeTab() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { transactions, fetchAll } = useFishStore();
  const { summary, fetchSummary, isLoading, aiSummary, fetchAiSummary, isLoadingAi } = useDashboardStore();
  const { schedules, fetchSchedules } = useDeliveryStore();

  const [showNotifModal, setShowNotifModal] = useState(false);

  const deliveryReminders = [
    {
      id: "rem-1",
      jam: "05:30 WIB (Subuh)",
      hari: "Hari Ini",
      status: "Harus Diantar",
      pasar: "Pasar Ratu Jepara",
      jarak: "1.8 km",
      pembeli: "Bu Sri (Lapak Ikan Basah No. 12)",
      telepon: "085211223344",
      items: [
        { jenis: "Ikan Tongkol Super", berat: 45, harga: 35000 },
        { jenis: "Ikan Bandeng Tambak", berat: 60, harga: 38000 },
      ],
      totalHarga: 3855000,
      catatan: "Kirim sebelum jam 05:30 WIB subuh.",
    },
    {
      id: "rem-2",
      jam: "07:00 WIB (Pagi)",
      hari: "Hari Ini",
      status: "Siapkan Pesanan",
      pasar: "TPI Kedungmalang",
      jarak: "4.2 km",
      pembeli: "Pak Haji Ahmad (Bakul Besar)",
      telepon: "081399887766",
      items: [
        { jenis: "Ikan Kakap Merah", berat: 80, harga: 65000 },
        { jenis: "Ikan Tenggiri Super", berat: 35, harga: 75000 },
      ],
      totalHarga: 7825000,
      catatan: "Siap ditimbang di dermaga TPI.",
    },
    {
      id: "rem-3",
      jam: "06:00 WIB (Besok)",
      hari: "Mendatang",
      status: "Jadwal Besok",
      pasar: "Pasar Welahan Jepara",
      jarak: "7.1 km",
      pembeli: "Kios Ikan Mbak Rahma",
      telepon: "085712345678",
      items: [
        { jenis: "Ikan Nila Hitam", berat: 50, harga: 32000 },
        { jenis: "Ikan Layang Basah", berat: 40, harga: 28000 },
      ],
      totalHarga: 2720000,
      catatan: "Sudah bayar DP 50%.",
    },
  ];

  const scrollX = useRef(new Animated.Value(0)).current;
  const [contentWidth, setContentWidth] = useState(1);
  const [containerWidth, setContainerWidth] = useState(1);

  const menuColumns = [
    {
      top: { id: "1", icon: "add-circle-outline", label: "Tambah Stok", route: "/input-barang" },
      bottom: { id: "2", icon: "boat-outline", label: "Data Nelayan", route: "/suppliers" },
    },
    {
      top: { id: "3", icon: "cube-outline", label: "Gudang", route: "/stock" },
      bottom: { id: "4", icon: "people-outline", label: "Data Pembeli", route: "/buyers" },
    },
    {
      top: { id: "5", icon: "card-outline", label: "Transaksi", route: "/transactions" },
      bottom: { id: "6", icon: "map-outline", label: "Peta Lokasi", route: "/map" },
    },
    {
      top: { id: "7", icon: "document-text-outline", label: "Riwayat Nota", route: "/transactions" },
      bottom: { id: "8", icon: "calendar-outline", label: "Jadwal Antar", route: "/notifications" },
    },
  ];

  const maxScroll = Math.max(contentWidth - containerWidth, 1);
  const indicatorTranslateX = scrollX.interpolate({
    inputRange: [0, maxScroll],
    outputRange: [0, 20],
    extrapolate: "clamp",
  });

  // Refresh data whenever the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSummary().catch((err) => console.error("Failed to load dashboard summary:", err));
      fetchAiSummary().catch((err) => console.error("Failed to load AI summary:", err));
      fetchAll().catch((err) => console.error("Failed to load fish store data:", err));
      fetchSchedules().catch((err) => console.error("Failed to load delivery schedules:", err));
    }, [fetchSummary, fetchAiSummary, fetchAll, fetchSchedules])
  );

  // Recent transactions list from local store
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
        <View style={[SharedStyles.row, { gap: spacing(12) }]}>
          {/* Notification Bell Icon disamping kiri Profile Avatar */}
          <TouchableOpacity
            onPress={() => router.push("/notifications" as any)}
            style={{
              width: wp(40),
              height: wp(40),
              borderRadius: wp(20),
              backgroundColor: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: "rgba(10, 35, 92, 0.15)",
              position: "relative",
              ...Shadow.button,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={iconSize(22)} color={Colors.navy} />
            {/* Dynamic Red Badge Counter */}
            {schedules.length > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  backgroundColor: Colors.danger,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: "#ffffff",
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 9, fontWeight: "bold" }}>
                  {schedules.length > 9 ? "9+" : schedules.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Pressable onPress={() => router.push("/profile")}>
            <Image
              source={{ uri: user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" }}
              style={{ width: wp(40), height: wp(40), borderRadius: wp(20), borderWidth: 2, borderColor: Colors.textPrimary }}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: spacing(16) }}>
          {/* Main Card (Visa Style) — Omzet */}
          <View style={{
            backgroundColor: Colors.cardBlue,
            borderRadius: radius(24),
            padding: spacing(20),
            marginBottom: spacing(16),
            ...Shadow.cardLift,
          }}>
            <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(24) }]}>
              <Ionicons name="card-outline" size={iconSize(24)} color="#ffffff" />
              <Text style={{ color: "#ffffff", opacity: 0.8, fontWeight: "600", fontSize: rfs(12) }}>Omset Bisnis</Text>
            </View>
            <View>
              <Text style={{ color: "#ffffff", fontSize: rfs(12), opacity: 0.8, marginBottom: 4 }}>Total Omset</Text>
              {isLoading && !summary ? (
                <ActivityIndicator size="small" color="#ffffff" style={{ alignSelf: "flex-start" }} />
              ) : (
                <Text style={{ color: "#ffffff", fontSize: rfs(28), fontWeight: "900" }} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(summary?.omzet || 0)}
                </Text>
              )}
            </View>
          </View>

          {/* Grid row for Laba Bersih, Stok Tersisa, and Piutang */}
          <View style={{ flexDirection: "row", gap: spacing(8), marginBottom: spacing(24) }}>
            {/* Laba Bersih */}
            <View style={{
              flex: 1,
              backgroundColor: Colors.royalBlueLight,
              borderRadius: radius(20),
              padding: spacing(12),
              justifyContent: "space-between",
              height: hp(85),
            }}>
              <Text style={{ color: "#ffffff", opacity: 0.9, fontWeight: "700", fontSize: rfs(11) }}>Laba Bersih</Text>
              {isLoading && !summary ? (
                <ActivityIndicator size="small" color="#ffffff" style={{ alignSelf: "flex-start" }} />
              ) : (
                <Text style={{ color: "#ffffff", fontSize: rfs(13), fontWeight: "800" }} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(summary?.laba_riil_total || 0)}
                </Text>
              )}
            </View>

            {/* Stok Tersisa */}
            <View style={{
              flex: 1,
              backgroundColor: Colors.royalBlueLight,
              borderRadius: radius(20),
              padding: spacing(12),
              justifyContent: "space-between",
              height: hp(85),
            }}>
              <Text style={{ color: "#ffffff", opacity: 0.9, fontWeight: "700", fontSize: rfs(11) }}>Stok Gudang</Text>
              {isLoading && !summary ? (
                <ActivityIndicator size="small" color="#ffffff" style={{ alignSelf: "flex-start" }} />
              ) : (
                <Text style={{ color: "#ffffff", fontSize: rfs(13), fontWeight: "800" }} numberOfLines={1} adjustsFontSizeToFit>
                  {formatWeight(summary?.stok_tersisa_kg || 0)}
                </Text>
              )}
            </View>

            {/* Total Piutang */}
            <View style={{
              flex: 1,
              backgroundColor: (summary?.total_piutang || 0) > 0 ? "rgba(245, 158, 11, 0.15)" : Colors.royalBlueLight,
              borderWidth: (summary?.total_piutang || 0) > 0 ? 1.5 : 0,
              borderColor: "#f59e0b",
              borderRadius: radius(20),
              padding: spacing(12),
              justifyContent: "space-between",
              height: hp(85),
            }}>
              <Text style={{ color: (summary?.total_piutang || 0) > 0 ? "#d97706" : "#ffffff", opacity: 0.9, fontWeight: "700", fontSize: rfs(11) }}>Piutang Tempo</Text>
              {isLoading && !summary ? (
                <ActivityIndicator size="small" color="#ffffff" style={{ alignSelf: "flex-start" }} />
              ) : (
                <Text style={{ color: (summary?.total_piutang || 0) > 0 ? "#d97706" : "#ffffff", fontSize: rfs(13), fontWeight: "800" }} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(summary?.total_piutang || 0)}
                </Text>
              )}
            </View>
          </View>

          {/* Gemini AI Business Insight Card */}
          <View style={{
            backgroundColor: "#ffffff",
            borderRadius: radius(20),
            padding: spacing(16),
            marginBottom: spacing(24),
            borderWidth: 1.5,
            borderColor: "rgba(43, 120, 228, 0.15)",
            ...Shadow.card,
          }}>
            <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(12) }]}>
              <View style={[SharedStyles.row, { gap: spacing(8) }]}>
                <Ionicons name="sparkles" size={iconSize(18)} color={Colors.royalBlue} />
                <Text style={{ color: Colors.textPrimary, fontSize: rfs(14), fontWeight: "bold" }}>
                  Analisis Bisnis Gemini AI
                </Text>
              </View>
              {isLoadingAi ? (
                <ActivityIndicator size="small" color={Colors.royalBlue} />
              ) : (
                <TouchableOpacity onPress={fetchAiSummary} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="refresh" size={iconSize(16)} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {isLoadingAi && !aiSummary ? (
              <View style={{ paddingVertical: spacing(8) }}>
                <ActivityIndicator size="small" color={Colors.royalBlue} style={{ alignSelf: "flex-start", marginBottom: 6 }} />
                <Text style={{ color: Colors.textMuted, fontSize: rfs(12), fontStyle: "italic" }}>
                  Menganalisis data transaksi dan stok toko Anda...
                </Text>
              </View>
            ) : aiSummary ? (
              <Text style={{ color: Colors.textPrimary, fontSize: rfs(12.5), lineHeight: 19 }}>
                {aiSummary}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={fetchAiSummary}
                style={{
                  backgroundColor: "rgba(43, 120, 228, 0.08)",
                  padding: spacing(12),
                  borderRadius: radius(10),
                  alignItems: "center",
                }}
              >
                <Text style={{ color: Colors.royalBlue, fontSize: rfs(12), fontWeight: "bold" }}>
                  Dapatkan Insight Bisnis AI
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Activities Menu Card (Shopee Style Grid) */}
          <View style={{
            backgroundColor: "#ffffff",
            borderRadius: radius(20),
            paddingVertical: spacing(16),
            paddingHorizontal: spacing(14),
            marginBottom: spacing(24),
            borderWidth: 1.5,
            borderColor: "rgba(43, 120, 228, 0.12)",
            ...Shadow.card,
          }}>
            <View style={{ marginBottom: spacing(14), paddingHorizontal: spacing(4) }}>
              <Text style={{ ...Type.h2, fontSize: rfs(16) }}>Aktivitas Cepat</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              onContentSizeChange={(w) => setContentWidth(w)}
              onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
              scrollEventThrottle={16}
            >
              <View style={{ flexDirection: "row", gap: spacing(16) }}>
                {menuColumns.map((col, index) => (
                  <View key={index} style={{ gap: spacing(16), alignItems: "center" }}>
                    {/* Top Row Item */}
                    {col.top && (
                      <TouchableOpacity
                        onPress={() => router.push(col.top.route as any)}
                        activeOpacity={0.7}
                        style={{ width: wp(68), alignItems: "center" }}
                      >
                        <View style={{
                          width: wp(54),
                          height: wp(54),
                          borderRadius: radius(18),
                          backgroundColor: "rgba(43, 120, 228, 0.08)",
                          borderWidth: 1,
                          borderColor: "rgba(43, 120, 228, 0.18)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Ionicons name={col.top.icon as any} size={iconSize(24)} color={Colors.navy} />
                        </View>
                        <Text
                          style={{
                            color: Colors.textPrimary,
                            fontSize: rfs(11),
                            fontWeight: "600",
                            textAlign: "center",
                            marginTop: spacing(6),
                            lineHeight: 14,
                            height: 28,
                          }}
                          numberOfLines={2}
                        >
                          {col.top.label}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Bottom Row Item */}
                    {col.bottom && (
                      <TouchableOpacity
                        onPress={() => router.push(col.bottom.route as any)}
                        activeOpacity={0.7}
                        style={{ width: wp(68), alignItems: "center" }}
                      >
                        <View style={{
                          width: wp(54),
                          height: wp(54),
                          borderRadius: radius(18),
                          backgroundColor: "rgba(43, 120, 228, 0.08)",
                          borderWidth: 1,
                          borderColor: "rgba(43, 120, 228, 0.18)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Ionicons name={col.bottom.icon as any} size={iconSize(24)} color={Colors.navy} />
                        </View>
                        <Text
                          style={{
                            color: Colors.textPrimary,
                            fontSize: rfs(11),
                            fontWeight: "600",
                            textAlign: "center",
                            marginTop: spacing(6),
                            lineHeight: 14,
                            height: 28,
                          }}
                          numberOfLines={2}
                        >
                          {col.bottom.label}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Scroll Indicator Pill Bar (Shopee Style) */}
            <View style={{ alignItems: "center", marginTop: spacing(12) }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", overflow: "hidden" }}>
                <Animated.View style={{
                  width: 20,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: Colors.royalBlue,
                  transform: [{ translateX: indicatorTranslateX }],
                }} />
              </View>
            </View>
          </View>
        </View>

        {/* Top Batch Section */}
        {summary?.top_batch && summary.top_batch.length > 0 && (
          <View style={{ paddingHorizontal: spacing(16), marginBottom: spacing(12) }}>
            <Text style={{ ...Type.h2, marginBottom: spacing(12) }}>Batch Paling Menguntungkan</Text>
            {summary.top_batch.map((batch: any) => (
              <View key={batch.id} style={{
                backgroundColor: "#ffffff",
                borderRadius: radius(16),
                padding: spacing(16),
                marginBottom: spacing(8),
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                ...Shadow.card,
              }}>
                <View>
                  <Text style={{ color: Colors.textPrimary, fontSize: rfs(14), fontWeight: "bold" }}>
                    Ikan {batch.jenis_ikan}
                  </Text>
                  <Text style={{ color: Colors.textMuted, fontSize: rfs(11), marginTop: 2 }}>
                    Diterima: {new Date(batch.diterima_at).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: Colors.success, fontSize: rfs(14), fontWeight: "bold" }}>
                    +{formatCurrency(Number(batch.laba_riil))}
                  </Text>
                  <Text style={{ color: Colors.textMuted, fontSize: rfs(10), marginTop: 2 }}>
                    Laba Bersih
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Transactions Bottom Sheet */}
        <View style={{
          backgroundColor: Colors.navy,
          borderTopLeftRadius: radius(32),
          borderTopRightRadius: radius(32),
          padding: spacing(24),
          paddingBottom: spacing(120),
          flex: 1,
          minHeight: hp(320),
          marginTop: spacing(16),
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
                  {formatCurrency(tx.total_amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
