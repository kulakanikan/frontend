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

  const activeColor = "#1199D6";
  const inactiveColor = "#64748b";

  return (
    <View style={{ position: Platform.OS === "web" ? "fixed" : "absolute", bottom: 0, left: 0, right: 0, zIndex: 9999 }} pointerEvents="box-none">
      <View
        style={{
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "space-around",
          backgroundColor: "rgba(255, 255, 255, 0.88)",
          borderTopWidth: 1,
          borderTopColor: "rgba(0, 0, 0, 0.06)",
          paddingBottom: Math.max(insets.bottom, 8),
          height: 48 + Math.max(insets.bottom, 8),
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
            },
            android: {
              elevation: 8,
            },
            web: {
              boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05)",
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
                <View style={{ alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>{isFocused && !isTambah && (
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
                )}{isTambah ? (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isItemHighlighted ? activeColor : "#ffffff",
                      borderWidth: 1,
                      borderColor: "rgba(0, 0, 0, 0.05)",
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
                          transition: "all 0.2s ease-in-out",
                        },
                      }),
                    }}
                  ><Ionicons
                    name={isItemHighlighted ? "add" : "add"}
                    size={22}
                    color={isItemHighlighted ? "#ffffff" : activeColor}
                  /></View>
                ) : (
                  <Ionicons
                    name={isItemHighlighted ? config.iconFilled : config.iconOutline}
                    size={20}
                    color={isItemHighlighted ? activeColor : inactiveColor}
                    style={{
                      opacity: isItemHighlighted ? 1 : 0.8,
                      ...Platform.select({
                        web: {
                          transition: "color 0.15s ease-in-out, opacity 0.15s ease-in-out",
                        },
                      }),
                    }}
                  />
                )}</View>
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
                bottom: 56 + Math.max(insets.bottom, 8),
                width: 190,
                backgroundColor: "#0F1A30",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.12)",
                paddingVertical: 4,
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                  },
                  android: {
                    elevation: 8,
                  },
                  web: {
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
                  },
                }),
              }}
            ><Pressable
                onPress={() => {
                  setShowMenu(false);
                  alert("Fitur Input Barang segera hadir!");
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: pressed ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(255, 255, 255, 0.08)",
                })}
              ><Ionicons name="cube-outline" size={16} color="#ffffff" style={{ marginRight: 12 }} /><Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "500" }}>Input Barang</Text></Pressable><Pressable
                onPress={() => {
                  setShowMenu(false);
                  alert("Fitur Input Pembeli segera hadir!");
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: pressed ? "rgba(255, 255, 255, 0.08)" : "transparent",
                })}
              ><Ionicons name="person-outline" size={16} color="#ffffff" style={{ marginRight: 12 }} /><Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "500" }}>Input Pembeli</Text></Pressable></View></View></Pressable></Modal></View>
  );
}
