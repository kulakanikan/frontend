import { Tabs } from "expo-router";
import CustomTabBar from "@/src/components/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Uang",
        }}
      />
      <Tabs.Screen
        name="tambah"
        options={{
          title: "Tambah",
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: "Gudang",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}

