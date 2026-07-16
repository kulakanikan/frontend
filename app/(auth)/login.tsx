import { useCallback, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
  Easing,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Svg, { Path, Circle, G, Defs, ClipPath } from "react-native-svg";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const BOTTOM_SHEET_HEIGHT = SCREEN_HEIGHT * 0.42;

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
    outputRange: [100, -SCREEN_HEIGHT * 0.7],
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
        ? [SCREEN_WIDTH + 150, -150]
        : [-150, SCREEN_WIDTH + 150],
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
  const [sheetVisible, setSheetVisible] = useState(false);

  const sheetTranslateY = useRef(
    new Animated.Value(BOTTOM_SHEET_HEIGHT)
  ).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

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
        toValue: BOTTOM_SHEET_HEIGHT,
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
  }, []);

  const handleGoogleLogin = useCallback(() => {
    hideSheet();
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 400);
  }, [hideSheet]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Section */}
      <View style={styles.topSection} />

      <AnimatedWave />

      {/* Bottom Ocean Section */}
      <View style={styles.oceanSection}>
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
          <AnimatedFish direction="right" delay={0} duration={5000} style={{ alignSelf: "center", marginBottom: 25 }}>
            <Svg width={240} height={70} viewBox="0 0 240 70">
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
          <AnimatedFish direction="left" delay={800} duration={6000} style={{ alignSelf: "center", marginLeft: 30, marginBottom: 25 }}>
            <Svg width={240} height={80} viewBox="0 0 240 80">
              <Path d="M190,40 L220,15 C210,40 210,40 220,65 Z" fill="#00072d" />
              <Path d="M30,40 C70,80 160,80 190,40 Z" fill="#ffffff" />
              <Path d="M30,40 C70,0 160,0 190,40 Z" fill="#00072d" />
              <Path d="M35,40 L185,40" stroke="#00072d" strokeWidth="4" />
              <Circle cx="55" cy="35" r="3" fill="#ffffff" />
            </Svg>
          </AnimatedFish>

          {/* Fish 3 - Shark (Faces Right) */}
          <AnimatedFish direction="right" delay={400} duration={5500} style={{ alignSelf: "center", marginRight: 20, marginBottom: 25 }}>
            <Svg width={240} height={90} viewBox="0 0 240 90">
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
          <AnimatedFish direction="left" delay={1200} duration={4800} style={{ alignSelf: "center", marginLeft: -20 }}>
            <Svg width={220} height={60} viewBox="0 0 240 60">
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

          {/* Fish 5 - Slender Pointy (Faces Right) */}
          <AnimatedFish direction="right" delay={1600} duration={5200} style={{ alignSelf: "center", marginRight: 15, marginTop: 25 }}>
            <Svg width={230} height={60} viewBox="0 0 240 60">
              <Defs>
                <ClipPath id="bodyClip5">
                  <Path d="M30,30 L70,5 C140,5 190,15 220,30 C190,45 140,55 70,55 Z" />
                </ClipPath>
              </Defs>
              <Path d="M35,30 L0,5 L0,55 Z" fill="#ffffff" />
              <Path d="M30,30 L70,5 C140,5 190,15 220,30 C190,45 140,55 70,55 Z" fill="#00072d" />
              <G clipPath="url(#bodyClip5)">
                <Path d="M90,0 L70,30 L90,60 M120,0 L100,30 L120,60 M150,0 L130,30 L150,60 M180,0 L160,30 L180,60" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </G>
              <Circle cx="195" cy="30" r="3" fill="#ffffff" />
            </Svg>
          </AnimatedFish>
        </View>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.getStartedButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={showSheet}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </Pressable>
        </View>
      </View>

      {/* Bottom Sheet Overlay */}
      {sheetVisible && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={styles.overlayTouchable} onPress={hideSheet} />
        </Animated.View>
      )}

      {/* Bottom Sheet - Auth Options */}
      {sheetVisible && (
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <View style={styles.sheetHandle}>
            <View style={styles.handleBar} />
          </View>

          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Masuk ke Akun</Text>
            <Text style={styles.sheetSubtitle}>
              Gunakan akun Google untuk memulai mengelola bisnis ikan kamu
            </Text>

            <Pressable
              onPress={handleGoogleLogin}
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.googleButtonPressed,
              ]}
            >
              <Image
                source={require("../../assets/images/google-logo.png")}
                style={styles.googleLogo}
              />
              <Text style={styles.googleButtonText}>
                Lanjutkan dengan Google
              </Text>
            </Pressable>



            <Text style={styles.termsText}>
              Dengan masuk, kamu menyetujui{" "}
              <Text style={styles.termsLink}>Syarat & Ketentuan</Text> dan{" "}
              <Text style={styles.termsLink}>Kebijakan Privasi</Text>
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
    paddingTop: Platform.OS === "ios" ? 70 : 60,
    paddingBottom: 20,
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
    paddingHorizontal: 20,
    marginTop: 35,
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
    height: BOTTOM_SHEET_HEIGHT,
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
    paddingTop: 14,
    paddingBottom: 4,
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
});
