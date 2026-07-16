import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import Svg, { Path, Circle, Defs, ClipPath, G } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const FloatingMascot = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    setTimeout(() => loop.start(), delay);
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 15],
  });

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

const Mascot1 = () => (
  <Svg width={280} height={120} viewBox="0 0 240 80">
    <Path d="M190,40 L220,15 C210,40 210,40 220,65 Z" fill="#ffffff" />
    <Path d="M30,40 C70,80 160,80 190,40 Z" fill="#ffffff" />
    <Path d="M30,40 C70,0 160,0 190,40 Z" fill="#00072d" />
    <Path d="M35,40 L185,40" stroke="#00072d" strokeWidth="4" />
    <Circle cx="55" cy="35" r="3" fill="#ffffff" />
  </Svg>
);

const Mascot2 = () => (
  <Svg width={280} height={120} viewBox="0 0 240 70">
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
);

const Mascot3 = () => (
  <Svg width={280} height={120} viewBox="0 0 240 90">
    <Path d="M40,45 L5,5 L25,45 Z" fill="#00072d" />
    <Path d="M40,45 L5,85 L25,45 Z" fill="#ffffff" />
    <Path d="M155,30 C155,15 130,5 110,0 C125,15 130,25 135,30 Z" fill="#00072d" />
    <Path d="M145,58 L110,85 L125,60 Z" fill="#00072d" />
    <Path d="M35,45 C80,15 170,25 220,45 Z" fill="#00072d" />
    <Path d="M35,45 C80,75 170,65 220,45 Z" fill="#ffffff" />
    <Circle cx="185" cy="35" r="3" fill="#ffffff" />
  </Svg>
);

const ONBOARDING_DATA = [
  {
    id: "1",
    title: "Manage Fish Distribution",
    description: "The best marine catch transaction recording system. Record purchases from fishermen and sales to customers effortlessly.",
    Mascot: Mascot1,
  },
  {
    id: "2",
    title: "Accurate & Transparent",
    description: "Monitor cash flow, payables, and receivables in real-time. All data is neatly stored to support your business growth.",
    Mascot: Mascot2,
  },
  {
    id: "3",
    title: "Grow Your Business",
    description: "Get ready to sail towards greater success with Kulakan Ikan. Let's start your journey now!",
    Mascot: Mascot3,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const transitionAnim = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const navigateToLogin = () => {
    // Seamless dissolve transition into login screen's ocean background
    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.replace("/(auth)/login");
    });
  };

  const scrollToNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigateToLogin();
    }
  };

  const skip = () => {
    navigateToLogin();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Skip Button */}
      <View style={styles.header}>
        {currentIndex < ONBOARDING_DATA.length - 1 ? (
          <Pressable onPress={skip} style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.6 }]}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : <View />}
      </View>

      <View style={{ flex: 3 }}>
        <FlatList
          data={ONBOARDING_DATA}
          renderItem={({ item, index }) => (
            <View style={styles.slide}>
              <View style={styles.mascotContainer}>
                {/* Background Bubble */}
                <View style={styles.bubbleBg} />
                <FloatingMascot delay={index * 500}>
                  <item.Mascot />
                </FloatingMascot>
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
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
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          ref={slidesRef}
        />
      </View>

      <View style={styles.bottomContainer}>
        {/* Paginator */}
        <View style={styles.paginatorContainer}>
          {ONBOARDING_DATA.map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];

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

            return (
              <Animated.View
                key={i.toString()}
                style={[styles.dot, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={scrollToNext}
        >
          <Text style={styles.actionButtonText}>
            {currentIndex === ONBOARDING_DATA.length - 1 ? "Get Started" : "Next"}
          </Text>
        </Pressable>
      </View>

      {/* Seamless Transition Overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "#051650", // Matches login.tsx background exactly
            opacity: transitionAnim,
            zIndex: 999,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a2472", // Core nautical blue
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "flex-end",
    height: 100,
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  skipText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  slide: {
    flex: 1,
    width: SCREEN_WIDTH,
    alignItems: "center",
    paddingHorizontal: 30,
  },
  mascotContainer: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  bubbleBg: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    backgroundColor: "#123499", // Lighter blue for contrast
    borderRadius: SCREEN_WIDTH,
    opacity: 0.5,
  },
  textContainer: {
    flex: 0.4,
    alignItems: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    color: "#e2e8f0", // Very light slate
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
    paddingHorizontal: 10,
  },
  bottomContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 30,
  },
  paginatorContainer: {
    flexDirection: "row",
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ffffff",
    marginHorizontal: 6,
  },
  actionButton: {
    backgroundColor: "#ffffff",
    width: "100%",
    paddingVertical: 18,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    color: "#051650",
    fontSize: 18,
    fontWeight: "800",
  },
});
