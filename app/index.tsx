import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Svg, { Path } from "react-native-svg";
import { fontSize as rfs } from "../src/utils/responsive";
import FishLogo from "../src/components/FishLogo";

// Small fish SVG component
const SmallFish = ({ color = "#ffffff", flip = false }) => (
  <Svg
    width={42}
    height={16}
    viewBox="0 0 40 15"
    style={{ transform: [{ scaleX: flip ? -1 : 1 }] }}
  >
    <Path d="M10,7.5 C20,0 35,0 40,7.5 C35,15 20,15 10,7.5" fill={color} />
    <Path d="M10,7.5 L0,0 L0,15 Z" fill={color} />
  </Svg>
);

// Individual swimming fish with independent animations
const SplashSwimmingFish = ({
  duration,
  top,
  size = 1,
  color = "rgba(255, 255, 255, 0.35)",
  direction = "left",
  screenWidth,
}: {
  duration: number;
  top: number;
  size?: number;
  color?: string;
  direction?: "left" | "right";
  screenWidth: number;
}) => {
  const startOffset = useRef(Math.random()).current;
  const anim = useRef(new Animated.Value(startOffset)).current;
  const yAnim = useRef(new Animated.Value(0)).current;

  const yDuration = duration * 0.45;

  useEffect(() => {
    // 1. Horizontal swimming animation
    const firstXAnim = Animated.timing(anim, {
      toValue: 1,
      duration: duration * (1 - startOffset),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    const loopXAnim = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    firstXAnim.start(({ finished }) => {
      if (finished) {
        anim.setValue(0);
        loopXAnim.start();
      }
    });

    // 2. Vertical wavy bobbing animation
    const loopYAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(yAnim, {
          toValue: 1,
          duration: yDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(yAnim, {
          toValue: 0,
          duration: yDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loopYAnim.start();

    return () => {
      firstXAnim.stop();
      loopXAnim.stop();
      loopYAnim.stop();
    };
  }, []);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange:
      direction === "left"
        ? [screenWidth + 100, -100]
        : [-100, screenWidth + 100],
  });

  const translateY = yAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-25, 25],
  });

  const rotate = yAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange:
      direction === "left"
        ? ["-12deg", "0deg", "12deg"]
        : ["12deg", "0deg", "-12deg"],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        top,
        transform: [{ translateX }, { translateY }, { rotate }, { scale: size }],
      }}
    >
      <SmallFish color={color} flip={direction === "left"} />
    </Animated.View>
  );
};

export default function LoadingScreen() {
  const { width: W, height: H } = useWindowDimensions();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const textTranslateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // 1. Sequence: Fade in logo, then slide in text
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

    // 2. Transition to login (onboarding overlay) after 3 seconds
    const timer = setTimeout(() => {
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
        router.replace("/(auth)/login");
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Decorative Swimming Fishes (Creates an immersive marine atmosphere) */}
      <SplashSwimmingFish duration={9500} top={H * 0.15} size={0.7} color="rgba(255, 255, 255, 0.25)" direction="left" screenWidth={W} />
      <SplashSwimmingFish duration={11000} top={H * 0.3} size={0.9} color="rgba(255, 255, 255, 0.15)" direction="right" screenWidth={W} />
      <SplashSwimmingFish duration={8000} top={H * 0.55} size={1.1} color="rgba(255, 255, 255, 0.3)" direction="left" screenWidth={W} />
      <SplashSwimmingFish duration={12000} top={H * 0.72} size={0.6} color="rgba(255, 255, 255, 0.2)" direction="right" screenWidth={W} />
      <SplashSwimmingFish duration={10000} top={H * 0.85} size={0.8} color="rgba(255, 255, 255, 0.35)" direction="left" screenWidth={W} />

      {/* Logo Container */}
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
      
      {/* Title Text */}
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
    backgroundColor: "#051650", // Matches onboarding/login ocean background exactly
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
