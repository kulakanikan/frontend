import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { receiptsApi } from "../../src/services/api";
import { useProfileStore } from "../../src/store";
import { Colors, Type, Shadow, SharedStyles } from "../../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../../src/utils/responsive";
import { formatCurrency, formatWeight } from "../../src/utils";

interface ReceiptDetail {
  receipt: {
    id: string;
    nomor_struk: string;
    status_kirim_wa: string;
    created_at: string;
  };
  sale: {
    id: string;
    berat_jual: string;
    harga_satuan: string;
    total: string;
    status_bayar: "lunas" | "tempo";
    tanggal: string;
    extras: Array<{ id: string; namaItem: string; jumlah: string; hargaSatuan: string; subtotal: string }>;
  };
  buyer: {
    id: string;
    nama: string;
    telepon: string | null;
    tipePembeli: string | null;
  };
  batch: {
    jenis_ikan: string;
  };
  penjual: {
    nama_usaha: string;
    telepon_usaha: string | null;
  };
}

export default function ReceiptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const { profile, fetchProfile } = useProfileStore();
  const [receiptData, setReceiptData] = useState<ReceiptDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");
  const [isSendingWa, setIsSendingWa] = useState(false);

  useEffect(() => {
    fetchProfile().catch((e) => console.error(e));
    if (id) {
      loadReceipt(id as string);
    }
  }, [id, fetchProfile]);

  const loadReceipt = async (receiptId: string) => {
    setIsLoading(true);
    try {
      const res = await receiptsApi.get(receiptId);
      setReceiptData(res);
      // Pre-fill phone number if available from buyer
      if (res.buyer?.telepon) {
        setPhoneInput(res.buyer.telepon);
      }
    } catch (err) {
      Alert.alert("Error", "Gagal memuat data struk digital.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWa = async () => {
    if (!receiptData || !id) return;
    
    if (!phoneInput.trim() || phoneInput.length < 9) {
      Alert.alert("Nomor HP Invalid", "Silakan masukkan nomor WhatsApp pembeli yang valid.");
      return;
    }

    setIsSendingWa(true);
    try {
      // Normalisasi nomor telepon
      let normalizedPhone = phoneInput.trim();
      if (normalizedPhone.startsWith("08")) {
        normalizedPhone = "+628" + normalizedPhone.slice(2);
      }

      const res = await receiptsApi.sendWa(id as string, normalizedPhone);
      
      if (res.wa_link) {
        // Open deep link
        const supported = await Linking.canOpenURL(res.wa_link);
        if (supported) {
          await Linking.openURL(res.wa_link);
        } else {
          // Fallback: open in browser
          await Linking.openURL(res.wa_link);
        }
      }
    } catch (err) {
      Alert.alert("Gagal Kirim", "Tidak dapat membuat link WhatsApp.");
    } finally {
      setIsSendingWa(false);
    }
  };

  if (isLoading || !receiptData) {
    return (
      <SafeAreaView style={[SharedStyles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.royalBlue} />
        <Text style={{ marginTop: 12, color: Colors.textMuted }}>Memuat struk digital...</Text>
      </SafeAreaView>
    );
  }

  const { receipt, sale, buyer, batch, penjual } = receiptData;
  const mainFishSubtotal = Number(sale.berat_jual) * Number(sale.harga_satuan);

  return (
    <SafeAreaView style={SharedStyles.screen}>
      {/* Header */}
      <View style={SharedStyles.header}>
        <View style={SharedStyles.row}>
          <Pressable
            onPress={() => router.replace("/(tabs)/transactions")}
            style={({ pressed }) => ({
              ...SharedStyles.backButton,
              backgroundColor: pressed ? "rgba(0,0,0,0.05)" : "transparent",
            })}
          >
            <Ionicons name="close" size={iconSize(24)} color={Colors.textPrimary} />
          </Pressable>
          <Text style={Type.headerTitle}>Struk Digital</Text>
        </View>
      </View>

      <ScrollView
        style={SharedStyles.content}
        contentContainerStyle={{ padding: spacing(16), paddingBottom: spacing(60) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt Slip Container */}
        <View style={styles.receiptContainer}>
          
          {/* Top Logo / Banner */}
          <View style={styles.headerSection}>
            <View style={styles.fishIconWrapper}>
              <Ionicons name="fish" size={32} color={Colors.royalBlue} />
            </View>
            <Text style={styles.businessTitle}>
              {penjual.nama_usaha || profile?.nama_usaha || "KULAKAN IKAN"}
            </Text>
            <Text style={styles.receiptSubtitle}>Distributor & Supplier Ikan Segar</Text>
            {penjual.telepon_usaha && (
              <Text style={styles.receiptSubtitle}>Telp: {penjual.telepon_usaha}</Text>
            )}
          </View>

          {/* Dotted Divider */}
          <View style={styles.dottedDivider} />

          {/* Meta Info */}
          <View style={styles.metaSection}>
            <Text style={styles.monospaceText}>NO: {receipt.nomor_struk}</Text>
            <Text style={styles.monospaceText}>
              TGL: {new Date(sale.tanggal).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
            </Text>
            <Text style={styles.monospaceText}>PEMBELI: {buyer.nama}</Text>
            {buyer.telepon && <Text style={styles.monospaceText}>TELP: {buyer.telepon}</Text>}
          </View>

          {/* Dotted Divider */}
          <View style={styles.dottedDivider} />

          {/* Items Section */}
          <View style={styles.itemsSection}>
            {/* Main Fish */}
            <View style={styles.itemRow}>
              <Text style={[styles.monospaceText, { flex: 1 }]}>
                Ikan {batch.jenis_ikan} ({formatWeight(Number(sale.berat_jual))})
              </Text>
            </View>
            <View style={[styles.itemRow, { justifyContent: "space-between", marginBottom: 12 }]}>
              <Text style={[styles.monospaceText, { color: "#64748b" }]}>
                {"   "}@ {formatCurrency(Number(sale.harga_satuan))}
              </Text>
              <Text style={styles.monospaceText}>{formatCurrency(mainFishSubtotal)}</Text>
            </View>

            {/* Extras */}
            {sale.extras.map((extra) => (
              <React.Fragment key={extra.id}>
                <View style={styles.itemRow}>
                  <Text style={[styles.monospaceText, { flex: 1 }]}>+ {extra.namaItem} ({extra.jumlah}x)</Text>
                </View>
                <View style={[styles.itemRow, { justifyContent: "space-between", marginBottom: 8 }]}>
                  <Text style={[styles.monospaceText, { color: "#64748b" }]}>
                    {"   "}@ {formatCurrency(Number(extra.hargaSatuan))}
                  </Text>
                  <Text style={styles.monospaceText}>{formatCurrency(Number(extra.subtotal))}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Dotted Divider */}
          <View style={styles.dottedDivider} />

          {/* Totals Section */}
          <View style={styles.totalsSection}>
            <View style={[styles.itemRow, { justifyContent: "space-between", marginBottom: 6 }]}>
              <Text style={[styles.monospaceText, { fontWeight: "bold" }]}>TOTAL</Text>
              <Text style={[styles.monospaceText, { fontWeight: "bold", fontSize: 15 }]}>
                {formatCurrency(Number(sale.total))}
              </Text>
            </View>
            <View style={[styles.itemRow, { justifyContent: "space-between" }]}>
              <Text style={styles.monospaceText}>STATUS</Text>
              <Text style={[styles.monospaceText, { fontWeight: "bold", color: sale.status_bayar === "lunas" ? "#16a34a" : "#d97706" }]}>
                {sale.status_bayar.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Footer Note */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>TERIMA KASIH</Text>
            <Text style={styles.footerSubtext}>Ikan segar berkualitas tinggi langsung dari nelayan.</Text>
          </View>
        </View>

        {/* WhatsApp Share Card */}
        <View style={styles.shareCard}>
          <Text style={styles.shareTitle}>Kirim Struk via WhatsApp</Text>
          
          <Text style={styles.inputLabel}>Nomor WhatsApp Pembeli</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="logo-whatsapp" size={18} color="#64748b" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: 08123..."
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={phoneInput}
              onChangeText={setPhoneInput}
            />
          </View>

          <Pressable
            disabled={isSendingWa}
            onPress={handleShareWa}
            style={({ pressed }) => [
              styles.shareBtn,
              { backgroundColor: pressed ? "#1e7e34" : "#25D366" }
            ]}
          >
            {isSendingWa ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="send" size={16} color="#ffffff" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.shareBtnText}>
              {isSendingWa ? "Mengirim..." : "Kirim Sekarang"}
            </Text>
          </Pressable>
          
          <Text style={styles.screenshotHint}>
            💡 Tips: Anda juga dapat melakukan screenshot layar untuk menyimpan struk ini di galeri handphone Anda.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  receiptContainer: {
    backgroundColor: "#ffffff",
    borderRadius: radius(16),
    padding: spacing(20),
    ...Shadow.card,
    borderWidth: 1,
    borderColor: "#e5eaf7",
    marginBottom: spacing(20),
  },
  headerSection: {
    alignItems: "center",
    marginVertical: spacing(10),
  },
  fishIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f4f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing(10),
  },
  businessTitle: {
    color: "#00072d",
    fontSize: rfs(18),
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  receiptSubtitle: {
    color: "#64748b",
    fontSize: rfs(11),
    marginTop: 2,
    textAlign: "center",
  },
  dottedDivider: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    marginVertical: spacing(16),
  },
  metaSection: {
    paddingVertical: spacing(4),
  },
  itemsSection: {
    paddingVertical: spacing(4),
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  monospaceText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#0f172a",
    fontSize: rfs(12),
    lineHeight: 18,
  },
  totalsSection: {
    paddingVertical: spacing(4),
  },
  footerSection: {
    alignItems: "center",
    marginTop: spacing(24),
    marginBottom: spacing(8),
  },
  footerText: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#0f172a",
    fontWeight: "bold",
    letterSpacing: 2,
    fontSize: rfs(13),
  },
  footerSubtext: {
    color: "#64748b",
    fontSize: rfs(10),
    textAlign: "center",
    marginTop: 4,
  },
  shareCard: {
    backgroundColor: "#ffffff",
    borderRadius: radius(16),
    padding: spacing(16),
    ...Shadow.card,
    borderWidth: 1.5,
    borderColor: "#e5eaf7",
  },
  shareTitle: {
    color: "#00072d",
    fontSize: rfs(14),
    fontWeight: "bold",
    marginBottom: spacing(14),
  },
  inputLabel: {
    color: "#64748b",
    fontSize: rfs(12),
    fontWeight: "600",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f4f9",
    borderRadius: radius(10),
    paddingHorizontal: 12,
    height: 44,
    marginBottom: spacing(16),
  },
  textInput: {
    flex: 1,
    height: "100%",
    color: "#00072d",
    fontSize: rfs(13),
  },
  shareBtn: {
    height: 44,
    borderRadius: radius(10),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  shareBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: rfs(14),
  },
  screenshotHint: {
    color: "#64748b",
    fontSize: rfs(11),
    textAlign: "center",
    marginTop: spacing(14),
    lineHeight: 16,
  },
});
