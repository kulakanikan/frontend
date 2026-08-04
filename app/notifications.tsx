import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";
import { formatCurrency, formatWeight } from "../src/utils";
import { useDeliveryStore } from "../src/store";
import type { ApiDeliverySchedule } from "../src/services/api";

export interface DeliveryReminder {
  id: string;
  tanggal: string;
  jam: string;
  hari: "Hari Ini" | "Mendatang" | "Selesai";
  status: string;
  pasar: string;
  jarak: string;
  pembeli: string;
  telepon: string;
  items: Array<{
    jenis: string;
    berat: number;
    harga: number;
  }>;
  totalHarga: number;
  catatan?: string;
}

function scheduleToReminder(s: ApiDeliverySchedule): DeliveryReminder {
  const date = new Date(s.scheduledAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduleDay = new Date(date);
  scheduleDay.setHours(0, 0, 0, 0);
  const isPast = date < new Date();
  const isToday = scheduleDay.getTime() === today.getTime();

  return {
    id: s.id,
    tanggal: date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    jam: date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    hari: isPast ? "Selesai" : isToday ? "Hari Ini" : "Mendatang",
    status: isToday ? "Diantar Hari Ini" : isPast ? "Sudah Diantar" : "Jadwal Mendatang",
    pasar: s.market?.namaPasar ?? "Pasar Tidak Diketahui",
    jarak: "",
    pembeli: s.buyer?.nama ?? "Pembeli Tidak Diketahui",
    telepon: s.buyer?.telepon ?? "",
    items: s.sale
      ? [
          {
            jenis: `Pesanan #${s.sale.invoice_number}`,
            berat: s.sale.berat_jual,
            harga: s.sale.harga_satuan,
          },
        ]
      : [],
    totalHarga: s.sale?.total ?? 0,
    catatan: s.catatan ?? undefined,
  };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"Semua" | "Hari Ini" | "Mendatang">("Semua");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { schedules, isLoading, fetchSchedules, deleteSchedule } = useDeliveryStore();

  useEffect(() => {
    fetchSchedules().catch((err) => console.error(err));
  }, [fetchSchedules]);

  const reminders = schedules.map(scheduleToReminder);


  const filteredReminders = reminders.filter((rem) => {
    if (selectedTab === "Semua") return true;
    return rem.hari === selectedTab;
  });

  const handleOpenWa = (rem: DeliveryReminder) => {
    const msg = `Halo ${rem.pembeli}, pesanan ikan ${rem.items.map((i) => `${i.jenis} ${i.berat}kg`).join(", ")} akan kami antar sekitar jam ${rem.jam} ke ${rem.pasar}...`;
    Linking.openURL(`https://api.whatsapp.com/send?phone=${rem.telepon}&text=${encodeURIComponent(msg)}`).catch(() =>
      console.warn("Cannot open WhatsApp")
    );
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
          <Text style={{ ...Type.h2, fontSize: rfs(16) }}>Pengingat Pengantaran</Text>
          <Text style={{ color: Colors.textMuted, fontSize: rfs(11) }}>Jadwal pengantaran ikan ke pasar</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(["Semua", "Hari Ini", "Mendatang"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[styles.chip, selectedTab === tab && styles.chipActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, selectedTab === tab && styles.chipTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Accordion List */}
      {isLoading && reminders.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={Colors.royalBlue} />
          <Text style={{ color: Colors.textMuted, marginTop: 8, fontSize: rfs(12) }}>
            Memuat jadwal pengantaran...
          </Text>
        </View>
      ) : reminders.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing(32) }}>
          <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
          <Text style={{ color: Colors.textMuted, marginTop: 12, fontSize: rfs(13), textAlign: "center" }}>
            Belum ada jadwal pengantaran.{"\n"}Buat jadwal dari halaman transaksi.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing(16), paddingBottom: spacing(40) }}
          showsVerticalScrollIndicator={false}
        >
          {filteredReminders.map((rem) => {
            const isExpanded = expandedId === rem.id;

            return (
              <View key={rem.id} style={[styles.card, isExpanded && styles.cardActive]}>
                {/* Clickable Header Area */}
                <TouchableOpacity
                  onPress={() => setExpandedId(isExpanded ? null : rem.id)}
                  activeOpacity={0.8}
                  style={{ width: "100%" }}
                >
                  {/* Row 1: Time & Chevron */}
                  <View style={styles.topRow}>
                    <View style={styles.timeGroup}>
                      <Ionicons
                        name="time"
                        size={iconSize(17)}
                        color={rem.hari === "Hari Ini" ? Colors.danger : Colors.royalBlue}
                      />
                      <Text style={[styles.timeText, { color: rem.hari === "Hari Ini" ? Colors.danger : Colors.royalBlue }]}>
                        Jam {rem.jam}
                      </Text>
                    </View>

                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={iconSize(18)}
                      color={Colors.navy}
                    />
                  </View>

                  {/* Row 2: Destination Market & Recipient */}
                  <View style={{ marginTop: spacing(6), gap: 3 }}>
                    <View style={[SharedStyles.row, { gap: 5 }]}>
                      <Ionicons name="location" size={iconSize(15)} color={Colors.navy} />
                      <Text style={styles.marketTitle} numberOfLines={1}>
                        {rem.pasar} {rem.jarak ? `(${rem.jarak})` : ""}
                      </Text>
                    </View>

                    <View style={[SharedStyles.row, { gap: 5 }]}>
                      <Ionicons name="person" size={iconSize(13)} color={Colors.textMuted} />
                      <Text style={styles.summaryText} numberOfLines={1}>
                        {rem.pembeli} • {rem.items.map((i) => `${i.jenis} ${i.berat}kg`).join(", ")}
                      </Text>
                    </View>

                    {/* Small Date at Bottom */}
                    <View style={[SharedStyles.row, { gap: 5, marginTop: 2 }]}>
                      <Ionicons name="calendar" size={iconSize(12)} color={Colors.textMuted} />
                      <Text style={styles.dateSmallText}>
                        {rem.tanggal}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Extended Details Box (When Expanded) */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Detailed Recipient & Contact */}
                    <View style={styles.detailRow}>
                      <View style={[SharedStyles.row, { gap: 5 }]}>
                        <Ionicons name="person" size={iconSize(13)} color={Colors.navy} />
                        <Text style={styles.detailLabel}>Penerima:</Text>
                      </View>
                      <Text style={styles.detailValueBold}>{rem.pembeli}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <View style={[SharedStyles.row, { gap: 5 }]}>
                        <Ionicons name="call" size={iconSize(13)} color={Colors.navy} />
                        <Text style={styles.detailLabel}>No. Telepon:</Text>
                      </View>
                      <Text style={styles.detailValue}>{rem.telepon}</Text>
                    </View>

                    {/* Fish Items Table */}
                    <View style={styles.fishBox}>
                      <View style={[SharedStyles.row, { gap: 5, marginBottom: 6 }]}>
                        <Ionicons name="fish" size={iconSize(14)} color={Colors.navy} />
                        <Text style={{ color: Colors.textMuted, fontSize: rfs(11), fontWeight: "700" }}>
                          RINCIAN PESANAN IKAN:
                        </Text>
                      </View>
                      {rem.items.map((item, i) => (
                        <View key={i} style={[SharedStyles.row, { justifyContent: "space-between", paddingVertical: 3 }]}>
                          <Text style={{ color: Colors.textPrimary, fontSize: rfs(12.5), fontWeight: "bold" }}>
                            • {item.jenis} ({formatWeight(item.berat)})
                          </Text>
                          <Text style={{ color: Colors.navy, fontSize: rfs(12.5), fontWeight: "800" }}>
                            {formatCurrency(item.berat * item.harga)}
                          </Text>
                        </View>
                      ))}

                      <View style={styles.totalRow}>
                        <Text style={{ color: Colors.textPrimary, fontSize: rfs(12), fontWeight: "bold" }}>
                          Total Tagihan Kulakan:
                        </Text>
                        <Text style={{ color: Colors.royalBlue, fontSize: rfs(14), fontWeight: "900" }}>
                          {formatCurrency(rem.totalHarga)}
                        </Text>
                      </View>
                    </View>

                    {rem.catatan && (
                      <View style={[SharedStyles.row, { gap: 5, marginTop: 4 }]}>
                        <Ionicons name="document-text" size={iconSize(13)} color={Colors.textMuted} />
                        <Text style={styles.noteText}>Catatan: "{rem.catatan}"</Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={[SharedStyles.row, { gap: 10, marginTop: spacing(12) }]}>
                      <TouchableOpacity
                        onPress={() => router.push("/map" as any)}
                        style={styles.btnMap}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="map" size={iconSize(16)} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.btnText}>Lihat di Peta</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleOpenWa(rem)}
                        style={styles.btnWa}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="logo-whatsapp" size={iconSize(16)} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.btnText}>Hubungi WA</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            "Hapus Jadwal",
                            "Yakin ingin menghapus jadwal pengantaran ini?",
                            [
                              { text: "Batal", style: "cancel" },
                              {
                                text: "Hapus",
                                style: "destructive",
                                onPress: async () => {
                                  try {
                                    await deleteSchedule(rem.id);
                                  } catch {
                                    Alert.alert("Gagal", "Tidak dapat menghapus jadwal.");
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        style={[styles.btnMap, { backgroundColor: "#ef4444" }]}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="trash-outline" size={iconSize(16)} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.btnText}>Hapus</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    gap: spacing(10),
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(10, 35, 92, 0.12)",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: spacing(16),
    gap: spacing(8),
    marginBottom: spacing(14),
  },
  chip: {
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(6),
    borderRadius: radius(16),
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(10, 35, 92, 0.12)",
  },
  chipActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  chipText: {
    fontSize: rfs(11.5),
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: radius(16),
    padding: spacing(14),
    marginBottom: spacing(12),
    borderWidth: 1.5,
    borderColor: "rgba(43, 120, 228, 0.12)",
    ...Shadow.card,
  },
  cardActive: {
    borderColor: Colors.royalBlue,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: rfs(13.5),
    fontWeight: "900",
  },
  marketTitle: {
    fontSize: rfs(14),
    fontWeight: "900",
    color: Colors.navy,
  },
  summaryText: {
    fontSize: rfs(11.5),
    color: Colors.textMuted,
  },
  dateSmallText: {
    fontSize: rfs(10.5),
    color: Colors.textMuted,
    fontWeight: "500",
  },
  expandedContent: {
    marginTop: spacing(10),
    paddingTop: spacing(10),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: rfs(11.5),
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: rfs(12),
    color: Colors.textPrimary,
  },
  detailValueBold: {
    fontSize: rfs(12),
    color: Colors.textPrimary,
    fontWeight: "bold",
  },
  fishBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: radius(12),
    padding: spacing(12),
    borderWidth: 1,
    borderColor: Colors.divider,
    marginTop: spacing(6),
    marginBottom: spacing(8),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  noteText: {
    fontSize: rfs(11),
    color: Colors.textMuted,
    fontStyle: "italic",
    marginBottom: spacing(4),
  },
  btnMap: {
    flex: 1,
    backgroundColor: Colors.navy,
    height: hp(38),
    borderRadius: radius(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnWa: {
    flex: 1,
    backgroundColor: "#25D366",
    height: hp(38),
    borderRadius: radius(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#ffffff",
    fontSize: rfs(12),
    fontWeight: "bold",
  },
});
