import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Svg, { Path, Circle } from "react-native-svg";

export default function LoadingScreen() {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const fishAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Fade in and scale up the logo/title
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
    ]).start();

    // 2. Animate a small fish swimming around the title
    Animated.loop(
      Animated.timing(fishAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();

    // 3. Navigate to onboarding after 2.5 seconds
    const timer = setTimeout(() => {
      // Fade out before leaving
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        router.replace("/(auth)/login");
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const fishTranslateX = fishAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-60, 60, -60],
  });

  const fishTranslateY = fishAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -30, 0, 30, 0],
  });

  const fishRotate = fishAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["15deg", "-15deg", "15deg"],
  });

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
        <Text style={styles.title}>Kulakan ikan</Text>
        
        {/* Playful loading indicator */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: -50,
            transform: [
              { translateX: fishTranslateX },
              { translateY: fishTranslateY },
              { rotate: fishRotate },
            ],
          }}
        >
          <Svg width={30} height={12} viewBox="0 0 40 15">
            <Path d="M10,7.5 C20,0 35,0 40,7.5 C35,15 20,15 10,7.5" fill="#ffffff" />
            <Path d="M10,7.5 L0,0 L0,15 Z" fill="#ffffff" />
          </Svg>
        </Animated.View>
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
