import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useFishStore } from "../src/store";
import { Transaction, TransactionItem } from "../src/types";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";

export default function BuyerHistoryScreen() {
  const router = useRouter();
  const { transactions, customers } = useFishStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Group transactions by buyer name
  const buyersMap = transactions.reduce((acc, tx) => {
    const name = tx.customer_name || "Pembeli Umum";
    if (!acc[name]) {
      acc[name] = {
        name,
        transactions: [],
        totalSpent: 0,
      };
    }
    acc[name].transactions.push(tx);
    acc[name].totalSpent += tx.total_amount;
    return acc;
  }, {} as Record<string, { name: string; transactions: Transaction[]; totalSpent: number }>);

  // Convert map to list and filter by search query
  const buyersList = Object.values(buyersMap).filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to generate the HTML content for the invoice
  const getInvoiceHtml = (tx: Transaction) => {
    const itemsHtml = tx.items
      .map(
        (item) => `
      <tr class="item-row">
        <td class="col-desc">${item.fish_name}${item.stock_not_found ? " <span class='no-stock'>(Stok tidak ada)</span>" : ""}</td>
        <td class="col-qty">${item.quantity} Kg</td>
        <td class="col-price">Rp ${item.unit_price.toLocaleString()}</td>
        <td class="col-total">Rp ${item.subtotal.toLocaleString()}</td>
      </tr>
    `
      )
      .join("");

    const formattedDate = new Date(tx.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nota Belanja ${tx.invoice_number}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333333;
            margin: 0;
            padding: 24px;
            font-size: 13px;
            line-height: 1.4;
          }
          .invoice-box {
            max-width: 600px;
            margin: auto;
            background: #ffffff;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #00072d;
            padding-bottom: 18px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0 0 6px 0;
            font-size: 22px;
            color: #00072d;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .header p {
            margin: 2px 0;
            color: #666;
            font-size: 11px;
          }
          .meta-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
            font-size: 12px;
          }
          .meta-col {
            width: 48%;
          }
          .meta-col strong {
            color: #00072d;
          }
          .meta-col p {
            margin: 3px 0;
          }
          .table-items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .table-items th {
            border-bottom: 2px solid #00072d;
            padding: 8px;
            text-align: left;
            color: #00072d;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 11px;
          }
          .table-items td {
            padding: 10px 8px;
            border-bottom: 1px solid #eeeeee;
          }
          .item-row {
            background: #ffffff;
          }
          .col-desc {
            font-weight: 600;
            color: #333;
          }
          .no-stock {
            color: #ef4444;
            font-size: 9px;
            font-weight: bold;
          }
          .col-qty, .col-price, .col-total {
            text-align: right;
          }
          .table-items th.col-qty, .table-items th.col-price, .table-items th.col-total {
            text-align: right;
          }
          .total-section {
            margin-top: 15px;
            border-top: 2px dashed #cccccc;
            padding-top: 12px;
            float: right;
            width: 250px;
            font-size: 13px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
          }
          .total-row.grand-total {
            border-top: 1px solid #333;
            font-weight: bold;
            font-size: 15px;
            color: #123499;
            padding-top: 6px;
            margin-top: 4px;
          }
          .footer-note {
            margin-top: 180px;
            text-align: center;
            border-top: 1px solid #eeeeee;
            padding-top: 12px;
            color: #888888;
            font-size: 10px;
          }
          .badge {
            display: inline-block;
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .badge-paid {
            background-color: #22c55e;
            color: #ffffff;
          }
          .badge-unpaid {
            background-color: #ef4444;
            color: #ffffff;
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <h1>KULAKAN IKAN</h1>
            <p>Pelabuhan Perikanan Samudera Jakarta, Indonesia</p>
            <p>Telp: 0812-3456-7890 | Email: support@kulakanikan.com</p>
          </div>

          <div class="meta-section">
            <div class="meta-col">
              <p><strong>No. Invoice:</strong> ${tx.invoice_number}</p>
              <p><strong>Tanggal:</strong> ${formattedDate}</p>
              <p><strong>Metode:</strong> ${tx.payment_method.toUpperCase()}</p>
            </div>
            <div class="meta-col" style="text-align: right;">
              <p><strong>Pelanggan:</strong> ${tx.customer_name}</p>
              <p style="margin-top: 6px;">
                <span class="badge ${tx.payment_status === "paid" ? "badge-paid" : "badge-unpaid"}">
                  ${tx.payment_status === "paid" ? "Lunas" : "Tempo"}
                </span>
              </p>
            </div>
          </div>

          <table class="table-items">
            <thead>
              <tr>
                <th style="width: 45%;">Ikan / Produk</th>
                <th class="col-qty" style="width: 15%;">Berat</th>
                <th class="col-price" style="width: 20%;">Harga/Kg</th>
                <th class="col-total" style="width: 20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>Rp ${tx.total_amount.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Bayar:</span>
              <span>Rp ${tx.paid_amount.toLocaleString()}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total Tagihan:</span>
              <span>Rp ${(tx.total_amount - tx.paid_amount).toLocaleString()}</span>
            </div>
          </div>

          <div style="clear: both;"></div>

          <div class="footer-note">
            <p>Terima kasih atas kunjungan dan pembelian Anda di Kulakan Ikan!</p>
            <p>Nota belanja ini diterbitkan sah secara digital oleh sistem POS Kulakan Ikan.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = async (tx: Transaction) => {
    setIsGenerating(true);
    try {
      const htmlContent = getInvoiceHtml(tx);
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal mencetak nota belanja");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async (tx: Transaction) => {
    setIsGenerating(true);
    try {
      const htmlContent = getInvoiceHtml(tx);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal mengunduh PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter transactions by selected buyer
  const filteredTransactions = transactions.filter(
    (tx) => (tx.customer_name || "Pembeli Umum") === selectedBuyer
  );

  return (
    <SafeAreaView style={SharedStyles.screen}>
      {/* Header */}
      <View style={SharedStyles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            ...SharedStyles.backButton,
            backgroundColor: pressed ? "rgba(0,0,0,0.05)" : "transparent",
          })}
        >
          <Ionicons name="chevron-back" size={iconSize(24)} color={Colors.textPrimary} />
        </Pressable>
        <Text style={Type.headerTitle}>Riwayat Nota Pembeli</Text>
      </View>

      {/* Main Container */}
      <View style={{ flex: 1, backgroundColor: Colors.background, padding: spacing(16) }}>
        {/* Search Bar */}
        <View
          style={[SharedStyles.row, {
            backgroundColor: Colors.card,
            borderRadius: radius(12),
            paddingHorizontal: spacing(14),
            height: hp(46),
            borderWidth: 1.2,
            borderColor: Colors.royalBlueMuted,
            marginBottom: spacing(16),
            ...Shadow.card,
          }]}
        >
          <Ionicons name="search-outline" size={iconSize(18)} color={Colors.textMuted} style={{ marginRight: spacing(10) }} />
          <TextInput
            style={{ flex: 1, fontSize: rfs(14), color: Colors.textPrimary }}
            placeholder="Cari nama pembeli..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={iconSize(18)} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Dynamic content view */}
        {selectedBuyer === null ? (
          // === LIST OF BUYERS VIEW ===
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={SharedStyles.sectionTitle}>
              Daftar Pelanggan Terdaftar
            </Text>
            {buyersList.length === 0 ? (
              <View style={SharedStyles.emptyState}>
                <Ionicons name="people-outline" size={iconSize(48)} color={Colors.textMuted} style={{ marginBottom: spacing(12) }} />
                <Text style={{ ...Type.bodySmall, textAlign: "center" }}>
                  Tidak ada pelanggan yang cocok dengan pencarian.
                </Text>
              </View>
            ) : (
              buyersList.map((buyer) => (
                <Pressable
                  key={buyer.name}
                  onPress={() => setSelectedBuyer(buyer.name)}
                  style={({ pressed }) => [
                    SharedStyles.card,
                    {
                      padding: spacing(14),
                      marginBottom: spacing(10),
                      backgroundColor: pressed ? Colors.cardPressed : Colors.card,
                    },
                  ]}
                >
                  <View style={[SharedStyles.row, { justifyContent: "space-between" }]}>
                    <View style={[SharedStyles.row, { flex: 1 }]}>
                      <View
                        style={{
                          width: wp(40),
                          height: wp(40),
                          borderRadius: wp(20),
                          backgroundColor: Colors.royalBlueMuted,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: spacing(12),
                        }}
                      >
                        <Text style={{ color: Colors.royalBlue, fontSize: rfs(16), fontWeight: "bold" }}>
                          {buyer.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={Type.body}>{buyer.name}</Text>
                        <Text style={{ ...Type.caption, marginTop: 2 }}>
                          {buyer.transactions.length} Transaksi (Total Rp {buyer.totalSpent.toLocaleString()})
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={iconSize(20)} color={Colors.textMuted} />
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        ) : (
          // === SINGLE BUYER PURCHASE HISTORY DETAIL VIEW ===
          <View style={{ flex: 1 }}>
            {/* Back button to buyers list */}
            <Pressable
              onPress={() => setSelectedBuyer(null)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: spacing(8),
                marginBottom: spacing(12),
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="arrow-back" size={iconSize(16)} color={Colors.royalBlue} />
              <Text style={{ color: Colors.royalBlue, fontSize: rfs(14), fontWeight: "bold", marginLeft: spacing(6) }}>
                Kembali ke Daftar Pelanggan
              </Text>
            </Pressable>

            {/* Buyer Title Info Header */}
            <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(16) }]}>
              <Text style={SharedStyles.sectionTitle}>
                Riwayat: {selectedBuyer}
              </Text>
              <View style={[SharedStyles.badgePaid, { backgroundColor: Colors.royalBlueMuted }]}>
                <Text style={{ color: Colors.royalBlue, fontSize: rfs(10), fontWeight: "700" }}>
                  {filteredTransactions.length} Transaksi
                </Text>
              </View>
            </View>

            {/* History of Invoices */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {filteredTransactions.map((tx) => (
                <View
                  key={tx.id}
                  style={[SharedStyles.card, { padding: spacing(16), marginBottom: spacing(12) }]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <View>
                      <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold" }}>
                        {tx.invoice_number}
                      </Text>
                      <Text style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                        {new Date(tx.created_at).toLocaleDateString("id-ID")}
                      </Text>
                    </View>
                    <View style={tx.payment_status === "paid" ? SharedStyles.badgePaid : SharedStyles.badgeUnpaid}>
                      <Text
                        style={{
                          color: tx.payment_status === "paid" ? Colors.success : Colors.danger,
                          fontSize: rfs(9),
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      >
                        {tx.payment_status === "paid" ? "Lunas" : "Tempo"}
                      </Text>
                    </View>
                  </View>

                  {/* Items display */}
                  <View style={SharedStyles.infoRow}>
                    {tx.items.map((i) => (
                      <View key={i.id} style={[SharedStyles.row, { justifyContent: "space-between", marginVertical: spacing(2) }]}>
                        <Text style={{ ...Type.bodySmall, color: Colors.navyLight, flex: 1, marginRight: spacing(8) }} numberOfLines={1}>
                          {i.fish_name} ({i.quantity} Kg)
                        </Text>
                        <Text style={Type.bodySmall}>
                          Rp {i.subtotal.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                    <View style={[SharedStyles.row, { justifyContent: "space-between", borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: spacing(8), paddingTop: spacing(6) }]}>
                      <Text style={Type.caption}>Total:</Text>
                      <Text style={Type.statSmall}>
                        Rp {tx.total_amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  {/* Action buttons side-by-side */}
                  <View style={[SharedStyles.row, { gap: spacing(10), marginTop: spacing(12) }]}>
                    <Pressable
                      onPress={() => handlePrint(tx)}
                      disabled={isGenerating}
                      style={({ pressed }) => [
                        SharedStyles.outlineButton,
                        {
                          flex: 1,
                          flexDirection: "row",
                          backgroundColor: pressed ? Colors.cardPressed : Colors.card,
                          opacity: isGenerating ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="print-outline" size={iconSize(16)} color={Colors.royalBlue} style={{ marginRight: spacing(6) }} />
                      <Text style={{ color: Colors.royalBlue, fontSize: rfs(13), fontWeight: "bold" }}>
                        Cetak Nota
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDownloadPDF(tx)}
                      disabled={isGenerating}
                      style={({ pressed }) => [
                        SharedStyles.primaryButton,
                        {
                          flex: 1,
                          flexDirection: "row",
                          backgroundColor: pressed ? Colors.successDark : Colors.success,
                          opacity: isGenerating ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="download-outline" size={iconSize(16)} color={Colors.textWhite} style={{ marginRight: spacing(6) }} />
                      <Text style={{ color: Colors.textWhite, fontSize: rfs(13), fontWeight: "bold" }}>
                        Unduh PDF
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
