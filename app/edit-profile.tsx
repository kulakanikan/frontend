import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useProfileStore, useAuthStore } from "../src/store";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
import { wp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profile, fetchProfile, updateProfile, isSaving } = useProfileStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!profile) {
      fetchProfile().catch((err) => console.error("Failed to load profile", err));
    }
  }, [profile, fetchProfile]);

  useEffect(() => {
    if (profile && !hasInitialized) {
      setName(profile.nama_usaha || "");
      setPhone(profile.telepon_usaha || "");
      setHasInitialized(true);
    }
  }, [profile, hasInitialized]);

  // Changes detector
  const hasChanges =
    name.trim() !== (profile?.nama_usaha || "") ||
    phone.trim() !== (profile?.telepon_usaha || "");

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      alert("Nama usaha tidak boleh kosong!");
      return;
    }
    if (!trimmedPhone) {
      alert("Nomor telepon tidak boleh kosong!");
      return;
    }

    // Validation: only digits, min 9 characters
    const digitsOnly = /^[0-9]+$/;
    if (!digitsOnly.test(trimmedPhone)) {
      alert("Nomor telepon hanya boleh berisi angka!");
      return;
    }
    if (trimmedPhone.length < 9) {
      alert("Nomor telepon minimal berisi 9 karakter!");
      return;
    }

    try {
      await updateProfile({
        nama_usaha: trimmedName,
        telepon_usaha: trimmedPhone,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        router.back();
      }, 1500);
    } catch (err) {
      alert("Gagal memperbarui profil. Silakan coba lagi.");
    }
  };

  const displayAvatar = profile?.avatar_url || user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
  const displayGoogleName = profile?.nama_google || user?.nama || "-";
  const displayEmail = profile?.email || user?.email || "-";

  return (
    <SafeAreaView style={SharedStyles.screen}>
      {/* Header */}
      <View style={SharedStyles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            flexDirection: "row",
            alignItems: "center",
            width: 60,
          })}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: "bold" }}>
          Edit Profil Usaha
        </Text>

        <Pressable
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          style={({ pressed }) => ({
            backgroundColor: hasChanges && !isSaving
              ? (pressed ? "#15803d" : "#22c55e")
              : "rgba(255, 255, 255, 0.1)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            minWidth: 60,
            alignItems: "center",
          })}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text
              style={{
                color: hasChanges ? "#ffffff" : Colors.textMuted,
                fontWeight: "bold",
                fontSize: 13,
              }}
            >
              Simpan
            </Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={SharedStyles.content}
          contentContainerStyle={{ padding: spacing(20), paddingBottom: spacing(60) }}
        >
          {/* Success Banner */}
          {saveSuccess && (
            <View style={[SharedStyles.row, { backgroundColor: Colors.success, padding: spacing(12), borderRadius: radius(12), marginBottom: spacing(16) }]}>
              <Ionicons name="checkmark-circle" size={iconSize(20)} color={Colors.textWhite} style={{ marginRight: spacing(8) }} />
              <Text style={{ color: Colors.textWhite, fontWeight: "bold", fontSize: rfs(13) }}>
                Profil berhasil disimpan! Kembali...
              </Text>
            </View>
          )}

          {/* Profile Picture Header Block */}
          <View style={{ alignItems: "center", marginBottom: spacing(28), marginTop: spacing(10) }}>
            <Image
              source={{ uri: displayAvatar }}
              style={{
                width: wp(120),
                height: wp(120),
                borderRadius: wp(60),
                borderWidth: 4,
                borderColor: Colors.royalBlue,
              }}
            />
            <Text style={{ color: Colors.textMuted, fontSize: rfs(12), marginTop: spacing(10), textAlign: "center" }}>
              Foto profil & email terhubung dengan akun Google Anda
            </Text>
          </View>

          {/* Form edit profil */}
          <View style={SharedStyles.formCard}>
            <Text style={{ ...Type.h3, marginBottom: spacing(16) }}>
              Detail Profil Usaha
            </Text>

            {/* Nama Google (Read-only) */}
            <View style={{ marginBottom: spacing(16), opacity: 0.7 }}>
              <Text style={{ ...Type.label, marginBottom: spacing(8) }}>Nama Google (Sesuai Akun)</Text>
              <TextInput
                style={[SharedStyles.input, { backgroundColor: "rgba(0,0,0,0.03)" }]}
                value={displayGoogleName}
                editable={false}
              />
            </View>

            {/* Email (Read-only) */}
            <View style={{ marginBottom: spacing(16), opacity: 0.7 }}>
              <Text style={{ ...Type.label, marginBottom: spacing(8) }}>Email</Text>
              <TextInput
                style={[SharedStyles.input, { backgroundColor: "rgba(0,0,0,0.03)" }]}
                value={displayEmail}
                editable={false}
              />
            </View>

            {/* Nama Usaha (Editable) */}
            <View style={{ marginBottom: spacing(16) }}>
              <Text style={{ ...Type.label, marginBottom: spacing(8) }}>Nama Usaha</Text>
              <TextInput
                style={SharedStyles.input}
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama usaha Anda"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Phone Input (Editable) */}
            <View style={{ marginBottom: spacing(16) }}>
              <Text style={{ ...Type.label, marginBottom: spacing(8) }}>Nomor WhatsApp / Telepon Usaha</Text>
              <TextInput
                style={SharedStyles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Contoh: 081234567890"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Ubah Profil Button inside Form Card */}
            <Pressable
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
              style={({ pressed }) => [
                SharedStyles.primaryButton,
                {
                  flexDirection: "row",
                  backgroundColor: hasChanges && !isSaving
                    ? (pressed ? Colors.successDark : Colors.success)
                    : Colors.textMuted,
                  marginTop: spacing(20),
                  shadowOpacity: hasChanges ? 0.2 : 0,
                },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: spacing(8) }} />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={iconSize(18)} color={Colors.textWhite} style={{ marginRight: spacing(8) }} />
              )}
              <Text style={{ color: Colors.textWhite, fontSize: rfs(14), fontWeight: "bold" }}>
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
