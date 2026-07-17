import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/store";
import { Colors, Type, Shadow, SharedStyles } from "../../src/constants/theme";
import { wp, spacing, fontSize as rfs, radius, iconSize } from "../../src/utils/responsive";

export default function ProfileTab() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={SharedStyles.screen}>
      {/* Header */}
      <View style={[SharedStyles.header, { backgroundColor: "transparent", paddingVertical: spacing(20) }]}>
        <View style={{ width: wp(60) }} />
        <Text style={{ color: Colors.textPrimary, fontSize: rfs(20), fontWeight: "900" }}>
          Profil
        </Text>
        <Pressable
          onPress={() => router.push("/edit-profile")}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "rgba(43, 120, 228, 0.2)" : "rgba(43, 120, 228, 0.1)",
            paddingHorizontal: spacing(16),
            paddingVertical: spacing(8),
            borderRadius: radius(12),
            alignItems: "center",
          })}
        >
          <Text style={{ color: Colors.royalBlue, fontWeight: "800", fontSize: rfs(12) }}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing(16), paddingBottom: spacing(140) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture & Name */}
        <View style={{ alignItems: "center", marginBottom: spacing(32), marginTop: spacing(10) }}>
          <View style={{
            padding: 8,
            backgroundColor: "rgba(255,255,255,0.4)",
            borderRadius: 100,
            marginBottom: spacing(16),
            ...Shadow.cardLift,
          }}>
            <Image
              source={{ uri: user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" }}
              style={{
                width: wp(120), height: wp(120), borderRadius: wp(60),
                borderWidth: 4, borderColor: "#ffffff",
              }}
            />
          </View>
          <Text style={{ color: Colors.textPrimary, fontSize: rfs(24), fontWeight: "900", letterSpacing: 0.5 }}>
            {user?.nama}
          </Text>
          <View style={{
            backgroundColor: Colors.navy,
            paddingHorizontal: spacing(14), paddingVertical: spacing(6),
            borderRadius: radius(12), marginTop: spacing(8),
          }}>
            <Text style={{
              color: "#ffffff", fontSize: rfs(11),
              fontWeight: "800", textTransform: "uppercase", letterSpacing: 1
            }}>
              {"Owner"}
            </Text>
          </View>
        </View>

        {/* Account Info Card (Glassy White) */}
        <View style={{
          backgroundColor: "#ffffff",
          borderRadius: radius(24),
          padding: spacing(24),
          ...Shadow.card,
        }}>
          <Text style={{ color: Colors.navy, fontSize: rfs(16), fontWeight: "800", marginBottom: spacing(20) }}>
            Informasi Akun
          </Text>

          {/* Email */}
          <View style={[SharedStyles.row, { paddingVertical: spacing(14), borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" }]}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", marginRight: spacing(14) }}>
              <Ionicons name="mail" size={iconSize(16)} color={Colors.royalBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.textMuted, fontSize: rfs(11), fontWeight: "600", marginBottom: 2 }}>Email Pribadi</Text>
              <Text style={{ color: Colors.navy, fontSize: rfs(14), fontWeight: "700" }}>{user?.email}</Text>
            </View>
          </View>

          {/* Phone */}
          <View style={[SharedStyles.row, { paddingVertical: spacing(14), borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" }]}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center", marginRight: spacing(14) }}>
              <Ionicons name="call" size={iconSize(16)} color={Colors.royalBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.textMuted, fontSize: rfs(11), fontWeight: "600", marginBottom: 2 }}>Nomor Telepon</Text>
              <Text style={{ color: Colors.navy, fontSize: rfs(14), fontWeight: "700" }}>{user?.teleponUsaha || "-"}</Text>
            </View>
          </View>

          {/* Logout */}
          <Pressable 
            onPress={() => {
              useAuthStore.getState().logout();
              router.replace("/(auth)/login");
            }}
            style={({ pressed }) => ([
              SharedStyles.row, {
                paddingVertical: spacing(16),
                marginTop: spacing(8),
                opacity: pressed ? 0.6 : 1
              }
            ])}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(239, 68, 68, 0.1)", alignItems: "center", justifyContent: "center", marginRight: spacing(14) }}>
              <Ionicons name="log-out" size={iconSize(16)} color={Colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.danger, fontSize: rfs(14), fontWeight: "800" }}>Keluar Aplikasi</Text>
            </View>
            <Ionicons name="chevron-forward" size={iconSize(18)} color={Colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
