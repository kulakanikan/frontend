import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Animated,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { voiceApi } from "../../src/services/api";
import { Colors, Type, Shadow, SharedStyles } from "../../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../../src/utils/responsive";

type FormCategory = "batch" | "buyer" | "sale";

const CATEGORIES: { id: FormCategory; label: string; icon: string }[] = [
  { id: "batch", label: "Stok Masuk", icon: "download-outline" },
  { id: "sale", label: "Penjualan", icon: "cart-outline" },
  { id: "buyer", label: "Pelanggan", icon: "people-outline" },
];

const SAMPLE_PROMPTS: Record<FormCategory, string[]> = {
  batch: [
    "Masuk tongkol 45 kilo dari Pak Joko harga 22 ribu kualitas segar",
    "Beli tenggiri 12 kg harga 48 ribu dari Nelayan Budi kondisi sedang",
    "Tambah stok ikan kembung 30 kg harga beli 18000 nelayan Agus",
  ],
  sale: [
    "Jual tenggiri 10 kg ke Restoran Seafood harga 65 ribu bayar tempo",
    "Jual tongkol 5 kilo ke Bu Retno harga 35 ribu lunas cash",
    "Transaksi ikan kakap 15 kg ke Pak Mansur harga 55000 status tempo",
  ],
  buyer: [
    "Pelanggan baru namanya Bu Retno nomor 0852334455 tipe pengecer",
    "Tambah pelanggan Restoran Seafood nomor telepon 081234567 tipe restoran",
    "Pembeli baru Pak Budi tipe perorangan nomor hp 0877112233",
  ],
};

export default function VoiceAssistantScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FormCategory>("batch");
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Pulsing animation for microphone indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    
    const startPulse = () => {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    };

    startPulse();
    return () => {
      if (animation) animation.stop();
    };
  }, [pulseAnim]);

  const handleSelectPrompt = (promptText: string) => {
    setTranscript(promptText);
    Keyboard.dismiss();
  };

  const handleMicTap = () => {
    // Focus the input to let the native keyboard microphone popup
    inputRef.current?.focus();
  };

  const handleProcessVoice = async () => {
    if (!transcript.trim()) return;

    setIsLoading(true);
    try {
      const res = await voiceApi.parse(transcript, activeTab);
      const { suggestion } = res;

      if (activeTab === "batch") {
        router.push({
          pathname: "/input-barang",
          params: {
            jenis_ikan: suggestion.jenis_ikan || "",
            berat: suggestion.berat?.toString() || "",
            harga_beli_per_kg: suggestion.harga_beli_per_kg?.toString() || "",
            kondisi_kualitas: suggestion.kondisi_kualitas || "",
            nama_supplier: suggestion.nama_supplier || "",
          },
        });
      } else if (activeTab === "buyer") {
        router.push({
          pathname: "/buyer-history",
          params: {
            open_add: "true",
            nama: suggestion.nama || "",
            telepon: suggestion.telepon || "",
            tipe_pembeli: suggestion.tipe_pembeli || "",
          },
        });
      } else if (activeTab === "sale") {
        router.push({
          pathname: "/input-pembeli",
          params: {
            buyer_name: suggestion.nama_pembeli || "",
            jenis_ikan: suggestion.jenis_ikan || "",
            berat: suggestion.berat_jual?.toString() || "",
            harga_jual_per_kg: suggestion.harga_satuan?.toString() || "",
            status_bayar: suggestion.status_bayar || "lunas",
          },
        });
      }
    } catch (err) {
      alert("Gagal memproses suara. Pastikan koneksi internet aktif dan server berjalan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={SharedStyles.header}>
        <Text style={[Type.headerTitle, { color: "#ffffff" }]}>Asisten Suara Gemini</Text>
        <Ionicons name="sparkles" size={20} color="#60a5fa" />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: spacing(16), paddingBottom: spacing(40) }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tab Selector */}
        <Text style={styles.sectionTitle}>Pilih Kategori Form</Text>
        <View style={styles.tabContainer}>
          {CATEGORIES.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabButton,
                  isSelected && styles.tabButtonActive,
                ]}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={isSelected ? "#ffffff" : "#94a3b8"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    isSelected && styles.tabButtonTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Input Transcript Area */}
        <Text style={styles.sectionTitle}>Kalimat Dikte Anda</Text>
        <View style={styles.inputCard}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            multiline
            numberOfLines={4}
            placeholder="Diktekan kalimat Anda di sini... (gunakan mic di keyboard atau ketik langsung)"
            placeholderTextColor="#64748b"
            value={transcript}
            onChangeText={setTranscript}
          />
          {transcript.length > 0 && (
            <Pressable onPress={() => setTranscript("")} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </Pressable>
          )}
        </View>

        {/* Glowing Mic Trigger */}
        <View style={styles.micWrapper}>
          <Animated.View style={[styles.micPulse, { transform: [{ scale: pulseAnim }] }]}>
            <Pressable onPress={handleMicTap} style={styles.micButton}>
              <Ionicons name="mic" size={32} color="#ffffff" />
            </Pressable>
          </Animated.View>
          <Text style={styles.micInstructions}>
            Tekan Mic untuk membuka keyboard, lalu ketuk tombol 🎙️ di keyboard Anda untuk berbicara.
          </Text>
        </View>

        {/* Sample Prompts */}
        <Text style={styles.sectionTitle}>Contoh Kalimat Rekomendasi</Text>
        <View style={styles.promptList}>
          {SAMPLE_PROMPTS[activeTab].map((p, idx) => (
            <Pressable
              key={idx}
              onPress={() => handleSelectPrompt(p)}
              style={styles.promptItem}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#60a5fa" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.promptText}>{p}</Text>
            </Pressable>
          ))}
        </View>

        {/* Process Button */}
        <Pressable
          disabled={!transcript.trim() || isLoading}
          onPress={handleProcessVoice}
          style={({ pressed }) => [
            styles.processBtn,
            (!transcript.trim() || isLoading) && styles.processBtnDisabled,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Ionicons name="sparkles" size={16} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.processBtnText}>Proses dengan Gemini AI</Text>
        </Pressable>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.loadingText}>Gemini sedang memilah kalimat Anda...</Text>
          <Text style={styles.loadingSubtext}>Menyusun form otomatis secara presisi</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#00072d", // Dark blue premium background
  },
  container: {
    flex: 1,
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: rfs(12),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: spacing(16),
    marginBottom: spacing(10),
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: radius(12),
    padding: 4,
    marginBottom: spacing(10),
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing(10),
    borderRadius: radius(8),
  },
  tabButtonActive: {
    backgroundColor: "#1e3a8a",
    ...Shadow.card,
  },
  tabButtonText: {
    color: "#94a3b8",
    fontSize: rfs(12),
    fontWeight: "600",
  },
  tabButtonTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  inputCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: radius(16),
    padding: spacing(14),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    position: "relative",
  },
  textInput: {
    color: "#ffffff",
    fontSize: rfs(14),
    lineHeight: 22,
    textAlignVertical: "top",
    minHeight: 100,
    paddingRight: 24,
  },
  clearBtn: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  micWrapper: {
    alignItems: "center",
    marginVertical: spacing(24),
  },
  micPulse: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.primary,
  },
  micInstructions: {
    color: "#94a3b8",
    fontSize: rfs(11),
    textAlign: "center",
    marginTop: spacing(12),
    paddingHorizontal: spacing(20),
    lineHeight: 16,
  },
  promptList: {
    gap: 8,
  },
  promptItem: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: radius(10),
    padding: spacing(12),
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  promptText: {
    color: "#e2e8f0",
    fontSize: rfs(12),
    flex: 1,
    lineHeight: 18,
  },
  processBtn: {
    backgroundColor: "#2563eb",
    borderRadius: radius(12),
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing(28),
    ...Shadow.primary,
  },
  processBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  processBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: rfs(14),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 7, 45, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: rfs(16),
    fontWeight: "bold",
    marginTop: spacing(16),
  },
  loadingSubtext: {
    color: "#94a3b8",
    fontSize: rfs(12),
    marginTop: 4,
  },
});
