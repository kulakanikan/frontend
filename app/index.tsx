import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { fontSize as rfs } from "../src/utils/responsive";
import FishLogo from "../src/components/FishLogo";
import { useAuthStore } from "../src/store";

export default function LoadingScreen() {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const textTranslateYAnim = useRef(new Animated.Value(20)).current;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    // 1. Entrance animation sequence: Fade in logo, then slide in text
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateYAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    let timer: NodeJS.Timeout;

    const navigateAway = () => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isAuthenticated) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)/login");
        }
      });
    };

    if (isAuthenticated) {
      // If already logged in, navigate away quickly (after a tiny delay so they see the entrance transition)
      timer = setTimeout(navigateAway, 1000);
    } else {
      // If not logged in, wait the standard time so they see the full splash screen
      timer = setTimeout(navigateAway, 2800);
    }

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <FishLogo width={160} height={160} color="#ffffff" />
      </Animated.View>
      
      <Animated.View
        style={{
          marginTop: 12,
          opacity: textOpacityAnim,
          transform: [{ translateY: textTranslateYAnim }],
        }}
      >
        <Text style={[styles.title, { fontSize: rfs(34) }]}>KULAKAN IKAN</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#051650",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: "#ffffff",
    fontStyle: "italic",
    letterSpacing: -1,
  },
});
