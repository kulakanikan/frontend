import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TransactionsTab() {
  return (
    <SafeAreaView className="flex-1 bg-surface-0">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl mb-4">🧾</Text>
        <Text className="text-content-primary text-xl font-bold">
          Transaksi
        </Text>
        <Text className="text-content-secondary text-center mt-2">
          Riwayat transaksi jual beli ikan.
        </Text>
      </View>
    </SafeAreaView>
  );
}
