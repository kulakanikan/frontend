import React, { useState } from "react";
import {
  View,
  Text,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/theme";
import { wp, hp, spacing, fontSize as rfs } from "../utils/responsive";

type TabRouteName = "index" | "transactions" | "tambah" | "stock" | "profile";

interface TabConfig {
  label: string;
  iconOutline: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
}

const TAB_CONFIGS: Record<TabRouteName, TabConfig> = {
  index: {
    label: "Home",
    iconOutline: "home-outline",
    iconFilled: "home",
  },
  transactions: {
    label: "Uang",
    iconOutline: "card-outline",
    iconFilled: "card",
  },
  tambah: {
    label: "Tambah",
    iconOutline: "add-circle-outline",
    iconFilled: "add-circle",
  },
  stock: {
    label: "Gudang",
    iconOutline: "cube-outline",
    iconFilled: "cube",
  },
  profile: {
    label: "Profile",
    iconOutline: "person-outline",
    iconFilled: "person",
  },
};

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeColor = Colors.royalBlue;
  const inactiveColor = Colors.textMuted;

  return (
    <View style={{ position: Platform.OS === "web" ? "fixed" : "absolute", bottom: 0, left: 0, right: 0, zIndex: 9999 }} pointerEvents="box-none">
      <View
        style={{
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "space-around",
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: Colors.divider,
          paddingBottom: Math.max(insets.bottom, 6),
          height: hp(60) + Math.max(insets.bottom, 6),
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
            web: {
              boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.15)",
            },
          }),
        }}
      >{state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const routeName = route.name as TabRouteName;
          const config = TAB_CONFIGS[routeName];

          if (!config) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (routeName === "tambah") {
              setShowMenu(true);
              return;
            }

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const isTambah = routeName === "tambah";

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarButtonTestID || (options as any).tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
              {...({
                onMouseEnter: () => setHoveredIndex(index),
                onMouseLeave: () => setHoveredIndex(null),
              } as any)}
            >{({ hovered }) => {
              const isItemHighlighted = isFocused || hovered;
              return (
                <View style={{ alignItems: "center", justifyContent: "center", width: "100%", height: "100%", paddingTop: 4 }}>
                  {isFocused && !isTambah && (
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        width: 24,
                        height: 3,
                        backgroundColor: activeColor,
                        borderBottomLeftRadius: 1.5,
                        borderBottomRightRadius: 1.5,
                      }}
                    />
                  )}
                  {isTambah ? (
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                      <View
                        style={{
                          width: wp(40),
                          height: wp(40),
                          borderRadius: wp(20),
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: Colors.royalBlue,
                          marginBottom: 2,
                          ...Platform.select({
                            ios: {
                              shadowColor: activeColor,
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.15,
                              shadowRadius: 4,
                            },
                            android: {
                              elevation: 2,
                            },
                            web: {
                              boxShadow: isItemHighlighted
                                ? `0 2px 10px ${activeColor}55`
                                : "0 2px 6px rgba(0, 0, 0, 0.05)",
                            },
                          }),
                        }}
                      >
                        <Ionicons
                          name="add"
                          size={wp(24)}
                          color={isItemHighlighted ? Colors.navy : Colors.textWhite}
                        />
                      </View>
                      <Text style={{ color: isItemHighlighted ? activeColor : inactiveColor, fontSize: rfs(10), fontWeight: "600" }}>
                        {config.label}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                      <Ionicons
                        name={isItemHighlighted ? config.iconFilled : config.iconOutline}
                        size={wp(22)}
                        color={isItemHighlighted ? activeColor : inactiveColor}
                        style={{
                          opacity: isItemHighlighted ? 1 : 0.8,
                        }}
                      />
                      <Text style={{ color: isItemHighlighted ? activeColor : inactiveColor, fontSize: rfs(10), fontWeight: "600", marginTop: 4 }}>
                        {config.label}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}</Pressable>
          );
        })}</View><Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      ><Pressable
          style={{ flex: 1, backgroundColor: "transparent" }}
          onPress={() => setShowMenu(false)}
        ><View
            style={{
              flex: 1,
              backgroundColor: "transparent",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          ><View
              style={{
                position: "absolute",
                bottom: hp(66) + Math.max(insets.bottom, 6),
                width: wp(210),
                backgroundColor: Colors.navyLight,
                borderRadius: wp(16),
                borderWidth: 1.5,
                borderColor: Colors.headerBorder,
                paddingVertical: spacing(6),
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                  },
                  android: {
                    elevation: 10,
                  },
                  web: {
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
                  },
                }),
              }}
            >
              <Pressable
                onPress={() => {
                  setShowMenu(false);
                  router.push("/input-barang");
                }}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: spacing(14),
                      paddingHorizontal: spacing(18),
                      backgroundColor: pressed ? Colors.headerBorder : "transparent",
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.headerBorder,
                    }}
                  >
                    <Ionicons name="cube-outline" size={wp(18)} color={Colors.textWhite} style={{ marginRight: spacing(12) }} />
                    <Text style={{ color: Colors.textWhite, fontSize: rfs(14), fontWeight: "600" }}>
                      Input Barang
                    </Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowMenu(false);
                  router.push("/input-pembeli");
                }}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: spacing(14),
                      paddingHorizontal: spacing(18),
                      backgroundColor: pressed ? Colors.headerBorder : "transparent",
                    }}
                  >
                    <Ionicons name="person-outline" size={wp(18)} color={Colors.textWhite} style={{ marginRight: spacing(12) }} />
                    <Text style={{ color: Colors.textWhite, fontSize: rfs(14), fontWeight: "600" }}>
                      Input Pembeli
                    </Text>
                  </View>
                )}
              </Pressable>
            </View></View></Pressable></Modal></View>
  );
}
