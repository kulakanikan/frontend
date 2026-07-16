import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatCurrency } from "@/src/utils";

const QUICK_ACTIONS = [
  { icon: "🐟", label: "Stok Ikan", color: "bg-ocean-600" },
  { icon: "📦", label: "Pesanan", color: "bg-brand-700" },
  { icon: "🧾", label: "Transaksi", color: "bg-brand-700" },
  { icon: "👥", label: "Pelanggan", color: "bg-brand-700" },
  { icon: "🚛", label: "Pengiriman", color: "bg-ocean-600" },
  { icon: "📊", label: "Laporan", color: "bg-brand-700" },
] as const;

const MOCK_TRANSACTIONS = [
  {
    id: "1",
    name: "Bandeng Segar",
    buyer: "Toko Pak Ali",
    amount: 450000,
    qty: "15 kg",
    time: "10 menit lalu",
  },
  {
    id: "2",
    name: "Tongkol",
    buyer: "RM Bahari",
    amount: 320000,
    qty: "8 kg",
    time: "1 jam lalu",
  },
  {
    id: "3",
    name: "Udang Windu",
    buyer: "Catering Jaya",
    amount: 1200000,
    qty: "10 kg",
    time: "2 jam lalu",
  },
] as const;

export function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface-0">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-content-secondary text-sm tracking-wider uppercase">
                Selamat Datang
              </Text>
              <Text className="text-content-primary text-2xl font-bold mt-1">
                🐟 Kulakan Ikan
              </Text>
            </View>
            <TouchableOpacity
              className="w-11 h-11 rounded-full bg-surface-100 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-xl">🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View className="px-6 mb-5">
          <TouchableOpacity
            className="bg-surface-50 rounded-2xl px-5 py-3.5 flex-row items-center border border-surface-200"
            activeOpacity={0.7}
          >
            <Text className="text-lg mr-3">🔍</Text>
            <Text className="text-content-tertiary text-sm">
              Cari ikan, pelanggan, transaksi...
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="px-6 mb-5">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-ocean-600 rounded-2xl p-4">
              <Text className="text-ocean-200 text-[10px] uppercase tracking-widest">
                Total Stok
              </Text>
              <Text className="text-content-primary text-xl font-bold mt-1">1.250</Text>
              <Text className="text-ocean-200 text-[10px] mt-0.5">kg tersedia</Text>
            </View>

            <View className="flex-1 bg-surface-50 rounded-2xl p-4 border border-surface-200">
              <Text className="text-content-tertiary text-[10px] uppercase tracking-widest">
                Transaksi
              </Text>
              <Text className="text-content-primary text-xl font-bold mt-1">48</Text>
              <Text className="text-content-tertiary text-[10px] mt-0.5">hari ini</Text>
            </View>

            <View className="flex-1 bg-warning-500/10 rounded-2xl p-4 border border-warning-500/20">
              <Text className="text-warning-500 text-[10px] uppercase tracking-widest">
                Pendapatan
              </Text>
              <Text className="text-content-primary text-xl font-bold mt-1">5.2jt</Text>
              <Text className="text-warning-500 text-[10px] mt-0.5">bulan ini</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-5">
          <Text className="text-content-primary text-base font-bold mb-3">
            Menu Cepat
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {QUICK_ACTIONS.map((item, index) => (
              <TouchableOpacity
                key={index}
                className={`${item.color} rounded-2xl p-4 items-center justify-center`}
                style={{ width: "30%", aspectRatio: 1 }}
                activeOpacity={0.7}
              >
                <Text className="text-2xl mb-2">{item.icon}</Text>
                <Text className="text-content-primary text-[11px] font-medium text-center">
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-content-primary text-base font-bold">
              Transaksi Terbaru
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text className="text-brand-400 text-sm font-medium">Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {MOCK_TRANSACTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-surface-50 rounded-2xl p-4 mb-3 flex-row items-center border border-surface-200"
              activeOpacity={0.7}
            >
              <View className="w-11 h-11 rounded-xl bg-ocean-600/20 items-center justify-center mr-3">
                <Text className="text-xl">🐟</Text>
              </View>
              <View className="flex-1">
                <Text className="text-content-primary font-semibold text-sm">
                  {item.name}
                </Text>
                <Text className="text-content-tertiary text-xs mt-0.5">
                  {item.buyer} • {item.qty}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-ocean-300 font-bold text-sm">
                  {formatCurrency(item.amount)}
                </Text>
                <Text className="text-content-tertiary text-[10px] mt-0.5">
                  {item.time}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
