import React, { useCallback, useRef, useState, useEffect } from "react";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "../../src/store";
import { GOOGLE_OAUTH } from "../../src/constants";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
  Easing,
  FlatList,
  useWindowDimensions,
  PanResponder,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Svg, { Path, Circle, G, Defs, ClipPath } from "react-native-svg";
import { wp, hp, ms, fontSize as rfs, spacing, screenWidth, screenHeight } from "../../src/utils/responsive";
import FishLogo from "../../src/components/FishLogo";

// Dynamic — always fresh
const getSW = () => Dimensions.get("window").width;
const getSH = () => Dimensions.get("window").height;
const BOTTOM_SHEET_HEIGHT = getSH() * 0.42;

const ONBOARDING_DATA = [
  {
    id: "1",
    title: "Manage Fish Distribution",
    description: "The best marine catch transaction recording system. Record purchases from fishermen and sales to customers effortlessly.",
  },
  {
    id: "2",
    title: "Accurate & Transparent",
    description: "Monitor cash flow, payables, and receivables in real-time. All data is neatly stored to support your business growth.",
  },
  {
    id: "3",
    title: "Grow Your Business",
    description: "Get ready to sail towards greater success with Kulakan Ikan. Let's start your journey now!",
  },
];

// Animated Dual Wave Divider (Super Alive Ocean!)
const AnimatedWave = () => {
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const bobAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Front wave (slow, moves left)
    Animated.loop(
      Animated.timing(wave1Anim, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Back wave (faster, moves left)
    Animated.loop(
      Animated.timing(wave2Anim, {
        toValue: 1,
        duration: 11000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Smooth continuous vertical bobbing
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const trans1 = wave1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1440],
  });
  const trans2 = wave2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1440],
  });
  const waveBob = bobAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const waveW = Math.max(getSW() * 3.7, 1440);
  const wavePath =
    "M0,50 Q180,20 360,50 T720,50 T1080,50 T1440,50 L1440,100 L0,100 Z";

  return (
    <View
      style={{
        width: "100%",
        height: 60,
        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* Back Wave (Lighter blue, offset vertically and horizontally) */}
      <Animated.View
        style={{
          position: "absolute",
          top: 8,
          width: 1440 * 2,
          height: "100%",
          flexDirection: "row",
          transform: [{ translateX: trans2 }],
          opacity: 0.6,
        }}
      >
        <Svg viewBox="0 0 1440 100" width={1440} height="100%" preserveAspectRatio="none">
          <Path fill="#0a2472" d={wavePath} />
        </Svg>
        <Svg viewBox="0 0 1440 100" width={1440} height="100%" preserveAspectRatio="none" style={{ marginLeft: -1 }}>
          <Path fill="#0a2472" d={wavePath} />
        </Svg>
      </Animated.View>

      {/* Front Wave (Dark main ocean color, bobs slightly) */}
      <Animated.View
        style={{
          position: "absolute",
          top: 18,
          width: 1440 * 2,
          height: "100%",
          flexDirection: "row",
          transform: [{ translateX: trans1 }, { translateY: waveBob }],
        }}
      >
        <Svg viewBox="0 0 1440 100" width={1440} height="100%" preserveAspectRatio="none">
          <Path fill="#051650" d={wavePath} />
        </Svg>
        <Svg viewBox="0 0 1440 100" width={1440} height="100%" preserveAspectRatio="none" style={{ marginLeft: -1 }}>
          <Path fill="#051650" d={wavePath} />
        </Svg>
      </Animated.View>
    </View>
  );
};

// Animated Bubbles
const AnimatedBubble = ({ size, left, duration }: any) => {
  const startOffset = useRef(Math.random()).current;
  const anim = useRef(new Animated.Value(startOffset)).current;

  useEffect(() => {
    const firstAnim = Animated.timing(anim, {
      toValue: 1,
      duration: duration * (1 - startOffset),
      easing: Easing.linear,
      useNativeDriver: true,
    });

    const loopAnim = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    firstAnim.start(({ finished }) => {
      if (finished) {
        anim.setValue(0);
        loopAnim.start();
      }
    });

    return () => {
      firstAnim.stop();
      loopAnim.stop();
    };
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, -getSH() * 0.7],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -15, 0, 15, 0], // Wavy upward motion
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.05, 0.95, 1],
    outputRange: [0, 0.6, 0.6, 0],
  });

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: 0,
        left,
        transform: [{ translateY }, { translateX }],
        opacity,
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
        />
      </Svg>
    </Animated.View>
  );
};

// Main floating fishes (Swims continuously across screen)
// Main floating fishes (Chaotic, random, bounded movement)
const AnimatedFish = ({ children, duration = 6000, style, direction = "right" }: any) => {
  const xAnim = useRef(new Animated.Value(0)).current;
  const yAnim = useRef(new Animated.Value(0)).current;

  // Randomize durations slightly so they move organically and don't sync up
  const xDuration = useRef(duration * (0.8 + Math.random() * 0.4)).current;
  const yDuration = useRef((duration * 0.7) * (0.8 + Math.random() * 0.4)).current;

  useEffect(() => {
    // Smooth endless horizontal drifting (Pendulum motion)
    const loopXAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(xAnim, {
          toValue: 1,
          duration: xDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(xAnim, {
          toValue: 0,
          duration: xDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Smooth endless vertical bobbing
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

    loopXAnim.start();
    loopYAnim.start();

    return () => {
      loopXAnim.stop();
      loopYAnim.stop();
    };
  }, []);

  // Bounded horizontal movement so they never leave the screen
  const translateX = xAnim.interpolate({
    inputRange: [0, 1],
    outputRange: direction === "right"
      ? [-20, 35]
      : [20, -35],
  });

  const translateY = yAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 12],
  });

  const rotate = xAnim.interpolate({
    inputRange: [0, 1],
    outputRange: direction === "right"
      ? ["-2deg", "2deg"]
      : ["2deg", "-2deg"],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { translateX },
            { translateY },
            { rotate },
            ...(style.transform || []),
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// Small swimming fishes (Swimming completely across the screen with a wavy Y pattern)
const SmallFish = ({ color = "#ffffff", flip = false }) => (
  <Svg
    width={40}
    height={15}
    viewBox="0 0 40 15"
    style={{ transform: [{ scaleX: flip ? -1 : 1 }] }}
  >
    <Path d="M10,7.5 C20,0 35,0 40,7.5 C35,15 20,15 10,7.5" fill={color} />
    <Path d="M10,7.5 L0,0 L0,15 Z" fill={color} />
  </Svg>
);

const SmallSwimmingFish = ({
  duration,
  top,
  size = 1,
  color = "#ffffff",
  direction = "left",
}: any) => {
  // Random start offset so they are distributed naturally and never clump/pause
  const startOffset = useRef(Math.random()).current;
  const anim = useRef(new Animated.Value(startOffset)).current;
  const yAnim = useRef(new Animated.Value(0)).current;

  // Use an off-sync duration for Y to create an organic, non-repeating wandering pattern
  const yDuration = duration * 0.45;

  useEffect(() => {
    // 1. Horizontal swim: from startOffset to 1, then loop 0 to 1
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

    // 2. Vertical wander: smooth diving and rising with large amplitude
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
        ? [getSW() + 150, -150]
        : [-150, getSW() + 150],
  });

  // Large vertical wandering range so they go down and sideways
  const translateY = yAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  // Small tilt based on Y movement for realism
  const rotate = yAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: direction === "left"
      ? ["-15deg", "0deg", "15deg"]
      : ["15deg", "0deg", "-15deg"],
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

export default function LoginScreen() {
  const { width: W, height: H } = useWindowDimensions();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const bsHeight = H * 0.42;
  const sheetTranslateY = useRef(new Animated.Value(bsHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const onboardingOpacity = useRef(new Animated.Value(1)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const googleLogin = useAuthStore((s) => s.googleLogin);
  const devLogin = useAuthStore((s) => s.devLogin);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // isDev: gunakan devLogin, skip Google OAuth hook sepenuhnya
  const isDev = process.env.EXPO_PUBLIC_APP_ENV === "development";

  // Responsive SVG scale factor
  const fishScale = Math.min(W / 390, 1.15);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const showSheet = useCallback(() => {
    setSheetVisible(true);
    Animated.parallel([
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        friction: 9,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const hideSheet = useCallback(() => {
    Animated.parallel([
      Animated.spring(sheetTranslateY, {
        toValue: bsHeight,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSheetVisible(false);
    });
  }, [bsHeight]);

  const finishOnboarding = useCallback(() => {
    Animated.timing(onboardingOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setOnboardingVisible(false);
      showSheet();
    });
  }, [showSheet, onboardingOpacity]);

  const scrollToNext = useCallback(() => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      finishOnboarding();
    }
  }, [currentIndex, finishOnboarding]);

  const handleGoogleLogin = useCallback(async () => {
    setLoginError(null);

    // Mode development: selalu gunakan devLogin, tidak perlu Google OAuth
    if (isDev) {
      try {
        setIsSigningIn(true);
        await devLogin();
        hideSheet();
        router.replace("/(tabs)");
      } catch {
        setLoginError("Dev login gagal. Pastikan backend berjalan di port 3000.");
        setIsSigningIn(false);
      }
      return;
    }

    // Production: real Google OAuth via native picker
    try {
      setIsSigningIn(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error("No id_token returned");
      await googleLogin(idToken);
      hideSheet();
      router.replace("/(tabs)");
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setLoginError("Login Google dibatalkan.");
      } else {
        setLoginError("Login Google gagal. Coba lagi.");
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [isDev, hideSheet, devLogin, googleLogin]);

  // Bring onboarding back
  const showOnboarding = useCallback(() => {
    hideSheet();
    setTimeout(() => {
      setCurrentIndex(0);
      slidesRef.current?.scrollToIndex({ index: 0, animated: false });
      scrollX.setValue(0);
      onboardingOpacity.setValue(0);
      setOnboardingVisible(true);
      Animated.timing(onboardingOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }, 350);
  }, [hideSheet, onboardingOpacity, scrollX]);

  // Detect swipe down on the ocean to re-show onboarding
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 && !onboardingVisible) showOnboarding();
      },
    })
  ).current;

  // Drag the bottom sheet down to dismiss & re-show onboarding
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          sheetTranslateY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80) {
          // Dragged enough — dismiss & show onboarding
          showOnboarding();
        } else {
          // Snap back
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            friction: 9,
            tension: 45,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Section */}
      <View style={styles.topSection}>
        <FishLogo width={130} height={130} color="#00072d" />
      </View>

      <AnimatedWave />

      {/* Bottom Ocean Section — swipe down to re-show onboarding */}
      <View style={styles.oceanSection} {...panResponder.panHandlers}>
        {/* Animated Bubbles */}
        <AnimatedBubble size={16} left="15%" delay={0} duration={6000} />
        <AnimatedBubble size={24} left="35%" delay={2000} duration={8500} />
        <AnimatedBubble size={12} left="70%" delay={1000} duration={5000} />
        <AnimatedBubble size={20} left="85%" delay={3500} duration={7000} />
        <AnimatedBubble size={14} left="50%" delay={4500} duration={6500} />

        {/* Animated Small Swimming Fishes */}
        <SmallSwimmingFish delay={0} duration={9000} top={30} size={0.8} color="#0a2472" direction="left" />
        <SmallSwimmingFish delay={3000} duration={12000} top={100} size={0.6} color="#ffffff" direction="right" />
        <SmallSwimmingFish delay={1500} duration={10000} top={200} size={1} color="#0a2472" direction="left" />
        <SmallSwimmingFish delay={5000} duration={14000} top={320} size={0.5} color="#ffffff" direction="right" />
        <SmallSwimmingFish delay={1000} duration={11000} top={400} size={0.9} color="#123499" direction="left" />
        <SmallSwimmingFish delay={6000} duration={15000} top={480} size={0.7} color="#ffffff" direction="right" />

        {/* Main Fishes Container */}
        <View style={styles.fishesContainer}>
          {/* Fish 1 - Striped Oval (Faces Right) */}
          <AnimatedFish direction="right" delay={0} duration={5000} style={{ alignSelf: "center", marginBottom: hp(20) }}>
            <Svg width={240 * fishScale} height={70 * fishScale} viewBox="0 0 240 70">
              <Defs>
                <ClipPath id="bodyClip1">
                  <Path d="M40,35 C70,-5 190,-5 220,35 C190,75 70,75 40,35 Z" />
                </ClipPath>
              </Defs>
              <Path d="M45,35 L5,5 L5,65 Z" fill="#ffffff" />
              <Path d="M40,35 C70,-5 190,-5 220,35 C190,75 70,75 40,35 Z" fill="#00072d" />
              <G clipPath="url(#bodyClip1)">
                <Path d="M70,0 L70,70 M95,0 L95,70 M120,0 L120,70 M145,0 L145,70 M170,0 L170,70 M195,0 L195,70" stroke="#ffffff" strokeWidth="8" />
              </G>
              <Circle cx="195" cy="28" r="4" fill="#ffffff" />
            </Svg>
          </AnimatedFish>

          {/* Fish 2 - Split Color (Faces Left) */}
          <AnimatedFish direction="left" delay={800} duration={6000} style={{ alignSelf: "center", marginLeft: wp(25), marginBottom: hp(20) }}>
            <Svg width={240 * fishScale} height={80 * fishScale} viewBox="0 0 240 80">
              <Path d="M190,40 L220,15 C210,40 210,40 220,65 Z" fill="#00072d" />
              <Path d="M30,40 C70,80 160,80 190,40 Z" fill="#ffffff" />
              <Path d="M30,40 C70,0 160,0 190,40 Z" fill="#00072d" />
              <Path d="M35,40 L185,40" stroke="#00072d" strokeWidth="4" />
              <Circle cx="55" cy="35" r="3" fill="#ffffff" />
            </Svg>
          </AnimatedFish>

          {/* Fish 3 - Shark (Faces Right) */}
          <AnimatedFish direction="right" delay={400} duration={5500} style={{ alignSelf: "center", marginRight: wp(16), marginBottom: hp(20) }}>
            <Svg width={240 * fishScale} height={90 * fishScale} viewBox="0 0 240 90">
              <Path d="M40,45 L5,5 L25,45 Z" fill="#00072d" />
              <Path d="M40,45 L5,85 L25,45 Z" fill="#ffffff" />
              {/* Top Fin pointing Left */}
              <Path d="M155,30 C155,15 130,5 110,0 C125,15 130,25 135,30 Z" fill="#00072d" />
              {/* Bottom Fin pointing Left */}
              <Path d="M145,58 L110,85 L125,60 Z" fill="#00072d" />
              <Path d="M35,45 C80,15 170,25 220,45 Z" fill="#00072d" />
              <Path d="M35,45 C80,75 170,65 220,45 Z" fill="#ffffff" />
              <Circle cx="185" cy="35" r="3" fill="#ffffff" />
            </Svg>
          </AnimatedFish>

          {/* Fish 4 - Small Stripe (Faces Left) */}
          <AnimatedFish direction="left" delay={1200} duration={4800} style={{ alignSelf: "center", marginLeft: wp(-16) }}>
            <Svg width={220 * fishScale} height={60 * fishScale} viewBox="0 0 240 60">
              <Defs>
                <ClipPath id="bodyClip4">
                  <Path d="M20,30 C60,-5 160,-5 200,30 C160,65 60,65 20,30 Z" />
                </ClipPath>
              </Defs>
              <Path d="M195,30 L230,5 L230,55 Z" fill="#ffffff" />
              <Path d="M20,30 C60,-5 160,-5 200,30 C160,65 60,65 20,30 Z" fill="#0a2472" />
              <G clipPath="url(#bodyClip4)">
                <Path d="M50,0 L50,60 M75,0 L75,60 M100,0 L100,60 M125,0 L125,60 M150,0 L150,60 M175,0 L175,60" stroke="#00072d" strokeWidth="10" />
              </G>
              <Circle cx="45" cy="25" r="3.5" fill="#ffffff" />
            </Svg>
          </AnimatedFish>


        </View>

      </View>

      {/* Onboarding Text Overlay (Floating on top of ocean) */}
      {onboardingVisible && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: onboardingOpacity, zIndex: 50, justifyContent: "flex-end", backgroundColor: "rgba(5, 22, 80, 0.85)" }]}>
          
          <View style={{ paddingBottom: Platform.OS === "ios" ? 54 : 36, paddingTop: 12 }}>
            <FlatList
              style={{ height: H * 0.22 }}
              data={ONBOARDING_DATA}
              renderItem={({ item }) => (
                <View style={[styles.slide, { width: W }]}>
                  <Text style={[styles.slideTitle, { fontSize: rfs(26) }]}>{item.title}</Text>
                  <Text style={[styles.slideDesc, { fontSize: rfs(14) }]}>{item.description}</Text>
                </View>
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              bounces={false}
              keyExtractor={(item) => item.id}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                useNativeDriver: false,
              })}
              scrollEventThrottle={32}
              onViewableItemsChanged={viewableItemsChanged}
              viewabilityConfig={viewConfig}
              getItemLayout={(data, index) => ({
                length: W,
                offset: W * index,
                index,
              })}
              ref={slidesRef}
            />

            {/* Paginator */}
            <View style={styles.paginatorContainer}>
              {ONBOARDING_DATA.map((_, i) => {
                const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
                const dotWidth = scrollX.interpolate({
                  inputRange,
                  outputRange: [10, 28, 10],
                  extrapolate: "clamp",
                });
                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: "clamp",
                });
                return <Animated.View key={i.toString()} style={[styles.dot, { width: dotWidth, opacity }]} />;
              })}
            </View>

            {/* Action Button */}
            <View style={{ paddingHorizontal: wp(28), width: "100%" }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#ffffff",
                  paddingVertical: Platform.OS === "ios" ? 18 : 16,
                  borderRadius: 100,
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#00072d",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
                activeOpacity={0.85}
                onPress={scrollToNext}
              >
                <Text
                  style={{
                    color: "#00072d",
                    fontSize: rfs(16),
                    fontWeight: "800",
                    textAlign: "center",
                  }}
                >
                  {currentIndex === ONBOARDING_DATA.length - 1 ? "Get Started" : "Next"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Bottom Sheet Overlay */}
      {sheetVisible && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={styles.overlayTouchable} onPress={showOnboarding} />
        </Animated.View>
      )}

      {/* Bottom Sheet - Auth Options (draggable handle) */}
      {sheetVisible && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
        <View style={styles.sheetHandle} {...sheetPanResponder.panHandlers}>
          <View style={styles.handleBar} />
        </View>

        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Sign In</Text>
          <Text style={styles.sheetSubtitle}>
            Use your Google account to start managing your fishery business
          </Text>

          <TouchableOpacity
            onPress={handleGoogleLogin}
            style={styles.googleButton}
            activeOpacity={0.85}
          >
            <Image
              source={require("../../assets/images/google-logo.png")}
              style={styles.googleLogo}
            />
            <Text style={styles.googleButtonText}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {loginError && (
            <View style={{ marginTop: 12, paddingHorizontal: 8 }}>
              <Text style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>
                {loginError}
              </Text>
            </View>
          )}

          {isSigningIn && (
            <View style={{ marginTop: 12, alignItems: "center" }}>
              <Text style={{ color: "#6B7280", fontSize: 13 }}>Memproses login...</Text>
            </View>
          )}

          <Text style={styles.termsText}>
            By signing in, you agree to our{" "}
            <Text style={styles.termsLink}>Terms & Conditions</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#051650",
  },
  topSection: {
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "ios" ? hp(60) : hp(50),
    paddingBottom: hp(16),
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 42,
    fontWeight: "900",
    color: "#00072d",
    textAlign: "center",
    letterSpacing: -1,
    fontStyle: "italic",
  },
  oceanSection: {
    flex: 1,
    backgroundColor: "#051650",
    alignItems: "center",
    overflow: "hidden", // Important so bubbles/fishes don't overflow
  },
  fishesContainer: {
    width: "100%",
    paddingHorizontal: wp(16),
    marginTop: hp(25),
    justifyContent: "center",
  },
  bottomContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 30,
    width: "100%",
    paddingHorizontal: 30,
  },
  getStartedButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00072d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  getStartedText: {
    color: "#00072d",
    fontSize: 18,
    fontWeight: "800",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 7, 45, 0.45)",
    zIndex: 10,
  },
  overlayTouchable: {
    flex: 1,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: getSH() * 0.42,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 20,
    shadowColor: "#00072d",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 24,
  },
  sheetHandle: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 12,
    width: "100%",
  },
  handleBar: {
    width: 42,
    height: 5,
    backgroundColor: "#0a2472",
    borderRadius: 3,
  },
  sheetContent: {
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#123499",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: "#051650",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    borderColor: "#0a2472",
    marginBottom: 18,
    shadowColor: "#00072d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButtonPressed: {
    backgroundColor: "#0a2472",
    borderColor: "#00072d",
    transform: [{ scale: 0.98 }],
  },
  googleLogo: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#00072d",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#0a2472",
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 13,
    color: "#0a2472",
    fontWeight: "500",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#051650",
  },
  termsText: {
    fontSize: 11,
    color: "#051650",
    textAlign: "center",
    lineHeight: 16,
  },
  termsLink: {
    color: "#123499",
    fontWeight: "700",
  },
  slide: {
    width: getSW(),
    alignItems: "center",
    paddingHorizontal: wp(28),
    justifyContent: "center",
  },
  slideTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  slideDesc: {
    color: "#e2e8f0",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  paginatorContainer: {
    flexDirection: "row",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
    marginHorizontal: 5,
  },
});
