import "../global.css";

import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useAuthStore } from "../src/store";

export default function RootLayout() {
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);

  // On first mount, try to restore session from SecureStore
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Handle redirects for session state changes (e.g. logging out or session expiry)
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isSplash = segments.length === 0 || segments[0] === "index";

    // If NOT authenticated and trying to access a protected page, redirect to login
    if (!isAuthenticated && !inAuthGroup && !isSplash) {
      router.replace("/(auth)/login");
    }
    // If authenticated and trying to access auth group, redirect to tabs
    else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#ffffff" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
