import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Image } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { fontSize as rfs } from "../src/utils/responsive";
import { useAuthStore } from "../src/store";

export default function LoadingScreen() {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const textTranslateYAnim = useRef(new Animated.Value(15)).current;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    // 1. Entrance animation sequence: Fade in logo, then slide in text
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 700,
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
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateYAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    let timer: ReturnType<typeof setTimeout>;

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
      // If already logged in, navigate away quickly
      timer = setTimeout(navigateAway, 1000);
    } else {
      // If not logged in, show splash animation
      timer = setTimeout(navigateAway, 2400);
    }

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        style={{
          marginTop: 16,
          opacity: textOpacityAnim,
          transform: [{ translateY: textTranslateYAnim }],
        }}
      >
        <Text style={[styles.title, { fontSize: rfs(32) }]}>KULAKAN</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 170,
    height: 170,
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "#051650",
    letterSpacing: 2,
    textAlign: "center",
  },
});
