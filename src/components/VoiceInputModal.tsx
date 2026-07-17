import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { voiceApi } from "../services/api";
import { Colors, Shadow } from "../constants/theme";
import { spacing, fontSize as rfs, radius } from "../utils/responsive";

interface VoiceInputModalProps {
  visible: boolean;
  onClose: () => void;
  formType: "batch" | "buyer" | "sale" | "supplier" | "batch_expense";
  onSuccess: (suggestion: any) => void;
}

export default function VoiceInputModal({
  visible,
  onClose,
  formType,
  onSuccess,
}: VoiceInputModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<any>(null);

  // Pulsing animation for recording dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    
    if (isRecording) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      
      // Timer interval
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (animation) animation.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, pulseAnim]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Izin Ditolak", "Izin mikrofon diperlukan untuk merekam suara.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      Alert.alert("Gagal Merekam", "Terjadi kesalahan saat memulai perekaman.");
    }
  };

  const stopAndProcessRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setIsLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error("No recording URI found");

      // Read audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to Hono backend
      const res = await voiceApi.parseAudio(base64Audio, "audio/m4a", formType);
      
      if (res.suggestion) {
        onSuccess(res.suggestion);
        handleClose();
      } else {
        throw new Error("Gagal mengurai suara");
      }
    } catch (err) {
      Alert.alert("Gagal Mengurai", "Gemini tidak dapat memilah suara Anda. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
      setRecording(null);
    }
  };

  const handleClose = () => {
    if (recording) {
      recording.stopAndUnloadAsync().catch(() => {});
    }
    setRecording(null);
    setIsRecording(false);
    setSeconds(0);
    setIsLoading(false);
    onClose();
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Close button */}
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#ffffff" />
          </Pressable>

          <View style={styles.content}>
            <Ionicons name="sparkles" size={24} color="#60a5fa" style={{ marginBottom: 8 }} />
            <Text style={styles.title}>Dikte AI Gemini</Text>
            
            <Text style={styles.subtitle}>
              {isRecording
                ? "Mendengarkan suara Anda..."
                : isLoading
                ? "Mengurai isi rekaman suara..."
                : "Tekan tombol mikrofon merah di bawah dan mulailah berbicara secara normal."}
            </Text>

            {/* Pulsing microphone view */}
            <View style={styles.micContainer}>
              {isLoading ? (
                <View style={styles.loadingWrapper}>
                  <ActivityIndicator size="large" color="#60a5fa" />
                  <Text style={styles.loadingSubtext}>Gemini sedang memilah data...</Text>
                </View>
              ) : (
                <>
                  <Animated.View
                    style={[
                      styles.micOuterCircle,
                      isRecording && { transform: [{ scale: pulseAnim }], backgroundColor: "rgba(239, 68, 68, 0.2)" },
                    ]}
                  >
                    <Pressable
                      onPress={isRecording ? stopAndProcessRecording : startRecording}
                      style={[
                        styles.micInnerCircle,
                        isRecording && { backgroundColor: "#ef4444" },
                      ]}
                    >
                      <Ionicons
                        name={isRecording ? "stop" : "mic"}
                        size={28}
                        color="#ffffff"
                      />
                    </Pressable>
                  </Animated.View>
                  
                  {isRecording && (
                    <Text style={styles.timer}>{formatTime(seconds)}</Text>
                  )}
                </>
              )}
            </View>

            {/* Instruction suggestion examples */}
            {!isRecording && !isLoading && (
              <View style={styles.hintBox}>
                <Text style={styles.hintTitle}>Contoh Kalimat:</Text>
                <Text style={styles.hintText}>
                  {formType === "batch"
                    ? '“Masuk tongkol 45 kilo dari Pak Joko harga 22 ribu kualitas segar”'
                    : formType === "sale"
                    ? '“Jual tenggiri 10 kg ke Restoran Seafood 65 ribu bayar tempo”'
                    : '“Tambah pelanggan namanya Bu Retno nomor 0852334455 tipe pengecer”'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 7, 45, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing(20),
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#00072d",
    borderRadius: radius(24),
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    padding: spacing(24),
    position: "relative",
    ...Shadow.primary,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: rfs(18),
    fontWeight: "bold",
    marginBottom: spacing(8),
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: rfs(12),
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing(8),
    marginBottom: spacing(20),
  },
  micContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    marginVertical: spacing(10),
  },
  micOuterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(96, 165, 250, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  micInnerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.royalBlue,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.primary,
  },
  timer: {
    color: "#ef4444",
    fontSize: rfs(14),
    fontWeight: "bold",
    marginTop: spacing(12),
    fontFamily: "monospace",
  },
  loadingWrapper: {
    alignItems: "center",
  },
  loadingSubtext: {
    color: "#60a5fa",
    fontSize: rfs(12),
    fontWeight: "600",
    marginTop: spacing(12),
  },
  hintBox: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: radius(12),
    padding: spacing(12),
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  hintTitle: {
    color: "#60a5fa",
    fontSize: rfs(11),
    fontWeight: "bold",
    marginBottom: 4,
  },
  hintText: {
    color: "#cbd5e1",
    fontSize: rfs(11),
    fontStyle: "italic",
    lineHeight: 16,
  },
});
