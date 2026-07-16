import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/store";

export default function ProfileTab() {
  const router = useRouter();
  const { user } = useAuthStore();

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
        <View style={{ width: 60 }} /> {/* spacer to center title */}
        
        <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "bold" }}>
          Profil Pengguna
        </Text>

        <Pressable
          onPress={() => router.push("/edit-profile")}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.08)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            minWidth: 60,
            alignItems: "center",
          })}
        >
          <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 13 }}>
            Edit
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: "#e5eaf7" }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
      >
        {/* Profile Picture Header Block */}
        <View style={{ alignItems: "center", marginBottom: 28, marginTop: 20 }}>
          <View style={{ position: "relative" }}>
            <Image
              source={{ uri: user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" }}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 4,
                borderColor: "#123499",
              }}
            />
          </View>

          <Text style={{ color: "#00072d", fontSize: 22, fontWeight: "bold", marginTop: 14 }}>
            {user?.name}
          </Text>
          <View
            style={{
              backgroundColor: "rgba(18, 52, 153, 0.1)",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginTop: 6,
            }}
          >
            <Text style={{ color: "#123499", fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>
              {user?.role || "Staff"}
            </Text>
          </View>
        </View>

        {/* Account details Card (Read Only) */}
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
            Informasi Akun
          </Text>

          {/* Email */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e5eaf7" }}>
            <Ionicons name="mail-outline" size={18} color="#64748b" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#64748b", fontSize: 10 }}>Email</Text>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "500" }}>{user?.email}</Text>
            </View>
          </View>

          {/* Phone */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}>
            <Ionicons name="call-outline" size={18} color="#64748b" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#64748b", fontSize: 10 }}>Nomor Telepon</Text>
              <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "500" }}>{user?.phone}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
