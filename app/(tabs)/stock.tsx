import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StockTab() {
  return (
    <SafeAreaView className="flex-1 bg-surface-0">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl mb-4">🐟</Text>
        <Text className="text-content-primary text-xl font-bold">
          Stok Ikan
        </Text>
        <Text className="text-content-secondary text-center mt-2">
          Kelola stok ikan dan inventaris di sini.
        </Text>
      </View>
    </SafeAreaView>
  );
}
