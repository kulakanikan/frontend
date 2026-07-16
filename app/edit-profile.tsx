import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../src/store";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
import { wp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Changes detector
  const hasChanges =
    name.trim() !== (user?.name || "") ||
    email.trim() !== (user?.email || "") ||
    phone.trim() !== (user?.phone || "") ||
    avatarUri !== (user?.avatar_url || "");

  // Image Picker Logic
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Maaf, kami memerlukan izin akses galeri foto untuk mengubah gambar profil!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Nama tidak boleh kosong!");
      return;
    }
    if (!phone.trim()) {
      alert("Nomor HP tidak boleh kosong!");
      return;
    }

    updateProfile(name.trim(), phone.trim(), avatarUri);

    setSaveSuccess(true);
    // Return back to profile screen after success animation completes
    setTimeout(() => {
      setSaveSuccess(false);
      router.back();
    }, 1500);
  };

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
          Edit Profil
        </Text>

        <Pressable
          onPress={handleSave}
          disabled={!hasChanges}
          style={({ pressed }) => ({
            backgroundColor: hasChanges
              ? (pressed ? "#15803d" : "#22c55e")
              : "rgba(255, 255, 255, 0.1)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            minWidth: 60,
            alignItems: "center",
          })}
        >
          <Text
            style={{
              color: hasChanges ? "#ffffff" : Colors.textMuted,
              fontWeight: "bold",
              fontSize: 13,
            }}
          >
            Simpan
          </Text>
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
            <Pressable
              onPress={handlePickImage}
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                position: "relative",
              })}
            >
              <Image
                source={{ uri: avatarUri }}
                style={{
                  width: wp(120),
                  height: wp(120),
                  borderRadius: wp(60),
                  borderWidth: 4,
                  borderColor: Colors.royalBlue,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  backgroundColor: Colors.royalBlue,
                  width: wp(32),
                  height: wp(32),
                  borderRadius: wp(16),
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2.5,
                  borderColor: Colors.card,
                }}
              >
                <Ionicons name="camera" size={iconSize(14)} color={Colors.textWhite} />
              </View>
            </Pressable>

            {/* Clickable text helper to trigger image picker */}
            <Pressable onPress={handlePickImage} style={{ marginTop: spacing(8) }}>
              <Text style={{ color: Colors.royalBlue, fontSize: rfs(13), fontWeight: "bold", textDecorationLine: "underline" }}>
                Ubah Foto Profil
              </Text>
            </Pressable>
          </View>

          {/* Form edit profil */}
          <View style={SharedStyles.formCard}>
            <Text style={{ ...Type.h3, marginBottom: spacing(16) }}>
              Detail Informasi Akun
            </Text>

            {/* Name Input */}
            <View style={{ marginBottom: spacing(16) }}>
              <Text style={{ ...Type.label, marginBottom: spacing(8) }}>Nama Lengkap</Text>
              <TextInput
                style={SharedStyles.input}
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Email Input */}
            <View style={{ marginBottom: spacing(16) }}>
              <Text style={{ ...Type.label, marginBottom: spacing(8) }}>Email</Text>
              <TextInput
                style={SharedStyles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="email@example.com"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Phone Input */}
            <View style={{ marginBottom: spacing(16) }}>
              <Text style={{ ...Type.label, marginBottom: spacing(8) }}>Nomor WhatsApp / Telepon</Text>
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
              disabled={!hasChanges}
              style={({ pressed }) => [
                SharedStyles.primaryButton,
                {
                  flexDirection: "row",
                  backgroundColor: hasChanges
                    ? (pressed ? Colors.successDark : Colors.success)
                    : Colors.textMuted,
                  marginTop: spacing(20),
                  shadowOpacity: hasChanges ? 0.2 : 0,
                },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={iconSize(18)} color={Colors.textWhite} style={{ marginRight: spacing(8) }} />
              <Text style={{ color: Colors.textWhite, fontSize: rfs(14), fontWeight: "bold" }}>
                Ubah Profil
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
