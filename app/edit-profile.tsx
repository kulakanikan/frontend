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

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUri, setAvatarUri] = useState(user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Changes detector
  const hasChanges =
    name.trim() !== (user?.name || "") ||
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
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            flexDirection: "row",
            alignItems: "center",
            width: 60,
          })}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </Pressable>

        <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "bold" }}>
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
              color: hasChanges ? "#ffffff" : "rgba(255, 255, 255, 0.4)",
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
          style={{ flex: 1, backgroundColor: "#e5eaf7" }}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        >
          {/* Success Banner */}
          {saveSuccess && (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#22c55e", padding: 12, borderRadius: 12, marginBottom: 16 }}>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 13 }}>
                Profil berhasil disimpan! Kembali...
              </Text>
            </View>
          )}

          {/* Profile Picture Header Block */}
          <View style={{ alignItems: "center", marginBottom: 28, marginTop: 10 }}>
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
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 4,
                  borderColor: "#123499",
                }}
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 2,
                  right: 2,
                  backgroundColor: "#123499",
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2.5,
                  borderColor: "#ffffff",
                }}
              >
                <Ionicons name="camera" size={14} color="#ffffff" />
              </View>
            </Pressable>

            {/* Clickable text helper to trigger image picker */}
            <Pressable onPress={handlePickImage} style={{ marginTop: 8 }}>
              <Text style={{ color: "#123499", fontSize: 13, fontWeight: "bold", textDecorationLine: "underline" }}>
                Ubah Foto Profil
              </Text>
            </Pressable>
          </View>

          {/* Form edit profil */}
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 20,
              padding: 20,
              borderWidth: 1.2,
              borderColor: "rgba(18, 52, 153, 0.25)",
              shadowColor: "#123499",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.04,
              shadowRadius: 10,
              elevation: 2,
              marginBottom: 28,
            }}
          >
            <Text style={{ color: "#00072d", fontSize: 15, fontWeight: "bold", marginBottom: 16 }}>
              Data Profil Baru
            </Text>

            {/* Input Nama */}
            <View style={{ marginBottom: 18 }}>
              <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
                Nama Lengkap
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14 }}>
                <Ionicons name="person-outline" size={18} color="#123499" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, height: 46, fontSize: 14, color: "#00072d" }}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor="#64748b"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Input Nomor HP */}
            <View style={{ marginBottom: 6 }}>
              <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>
                Nomor Telepon
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14 }}>
                <Ionicons name="call-outline" size={18} color="#123499" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, height: 46, fontSize: 14, color: "#00072d" }}
                  placeholder="Masukkan nomor HP"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Ubah Profil Button inside Form Card */}
            <Pressable
              onPress={handleSave}
              disabled={!hasChanges}
              style={({ pressed }) => ({
                flexDirection: "row",
                backgroundColor: hasChanges
                  ? (pressed ? "#15803d" : "#22c55e")
                  : "#94a3b8",
                height: 46,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 20,
                shadowColor: hasChanges ? "#22c55e" : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: hasChanges ? 0.2 : 0,
                shadowRadius: 6,
                elevation: hasChanges ? 3 : 0,
              })}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "bold" }}>
                Ubah Profil
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
