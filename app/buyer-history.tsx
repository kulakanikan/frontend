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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#00072d" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: "#00072d",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            padding: 8,
            borderRadius: 20,
            backgroundColor: pressed ? "rgba(255, 255, 255, 0.1)" : "transparent",
            marginRight: 8,
          })}
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </Pressable>
        <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "bold" }}>
          Riwayat Nota Pembeli
        </Text>
      </View>

      {/* Main Container */}
      <View style={{ flex: 1, backgroundColor: "#e5eaf7", padding: 16 }}>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#ffffff",
            borderRadius: 12,
            paddingHorizontal: 14,
            height: 46,
            borderWidth: 1.2,
            borderColor: "rgba(18, 52, 153, 0.25)",
            marginBottom: 16,
            shadowColor: "#123499",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Ionicons name="search-outline" size={18} color="#64748b" style={{ marginRight: 10 }} />
          <TextInput
            style={{ flex: 1, fontSize: 14, color: "#00072d" }}
            placeholder="Cari nama pembeli..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#64748b" />
            </Pressable>
          )}
        </View>

        {/* Dynamic content view */}
        {selectedBuyer === null ? (
          // === LIST OF BUYERS VIEW ===
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold", marginBottom: 12 }}>
              Daftar Pelanggan Terdaftar
            </Text>
            {buyersList.length === 0 ? (
              <View
                style={{
                  backgroundColor: "#ffffff",
                  padding: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  borderWidth: 1.2,
                  borderColor: "rgba(18, 52, 153, 0.25)",
                }}
              >
                <Ionicons name="people-outline" size={48} color="#64748b" style={{ marginBottom: 12 }} />
                <Text style={{ color: "#64748b", fontSize: 14, textAlign: "center" }}>
                  Tidak ada pelanggan yang cocok dengan pencarian.
                </Text>
              </View>
            ) : (
              buyersList.map((buyer) => (
                <Pressable
                  key={buyer.name}
                  onPress={() => setSelectedBuyer(buyer.name)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#f8fafc" : "#ffffff",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1.2,
                    borderColor: "rgba(18, 52, 153, 0.25)",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    shadowColor: "#123499",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                  })}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ color: "#00072d", fontSize: 16, fontWeight: "bold" }}>
                      {buyer.name}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                      {buyer.transactions.length} Transaksi Belanja
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: "#123499", fontSize: 14, fontWeight: "bold" }}>
                      Rp {buyer.totalSpent.toLocaleString()}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                      <Text style={{ color: "#123499", fontSize: 11, fontWeight: "600", marginRight: 2 }}>Detail</Text>
                      <Ionicons name="chevron-forward" size={12} color="#123499" />
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        ) : (
          // === SINGLE BUYER PURCHASE HISTORY DETAIL VIEW ===
          <View style={{ flex: 1 }}>
            {/* Back to list button */}
            <Pressable
              onPress={() => setSelectedBuyer(null)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 14,
                backgroundColor: "rgba(18, 52, 153, 0.08)",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignSelf: "flex-start",
              }}
            >
              <Ionicons name="arrow-back" size={14} color="#123499" style={{ marginRight: 6 }} />
              <Text style={{ color: "#123499", fontSize: 12, fontWeight: "bold" }}>
                Kembali ke Daftar Pelanggan
              </Text>
            </Pressable>

            {/* Buyer Title Info Header */}
            <View
              style={{
                backgroundColor: "#ffffff",
                padding: 16,
                borderRadius: 16,
                borderWidth: 1.2,
                borderColor: "rgba(18, 52, 153, 0.25)",
                marginBottom: 16,
              }}
            >
              <Text style={{ color: "#64748b", fontSize: 12 }}>Pelanggan</Text>
              <Text style={{ color: "#00072d", fontSize: 20, fontWeight: "bold", marginTop: 2 }}>
                {selectedBuyer}
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, borderTopWidth: 1, borderTopColor: "#e5eaf7", paddingTop: 10 }}>
                <Text style={{ color: "#64748b", fontSize: 12 }}>Total Belanja:</Text>
                <Text style={{ color: "#123499", fontSize: 14, fontWeight: "bold" }}>
                  Rp {buyersMap[selectedBuyer]?.totalSpent.toLocaleString() || 0}
                </Text>
              </View>
            </View>

            {/* History of Invoices */}
            <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold", marginBottom: 12 }}>
              Daftar Nota Belanja
            </Text>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {buyersMap[selectedBuyer]?.transactions.map((tx) => (
                <View
                  key={tx.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1.2,
                    borderColor: "rgba(18, 52, 153, 0.25)",
                    shadowColor: "#123499",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
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
                    <View
                      style={{
                        backgroundColor: tx.payment_status === "paid" ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: tx.payment_status === "paid" ? "#22c55e" : "#ef4444",
                          fontSize: 9,
                          fontWeight: "bold",
                        }}
                      >
                        {tx.payment_status === "paid" ? "Lunas" : "Tempo"}
                      </Text>
                    </View>
                  </View>

                  {/* Items display */}
                  <View style={{ backgroundColor: "#f8fafc", padding: 10, borderRadius: 10, marginBottom: 12 }}>
                    {tx.items.map((i) => (
                      <View key={i.id} style={{ flexDirection: "row", justifyContent: "space-between", marginVertical: 2 }}>
                        <Text style={{ color: "#051650", fontSize: 12, flex: 1, marginRight: 8 }} numberOfLines={1}>
                          {i.fish_name} ({i.quantity} Kg)
                        </Text>
                        <Text style={{ color: "#64748b", fontSize: 12 }}>
                          Rp {i.subtotal.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                    <View style={{ borderTopWidth: 1, borderTopColor: "#e5eaf7", marginTop: 8, paddingTop: 6, flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: "#00072d", fontSize: 12, fontWeight: "bold" }}>Total:</Text>
                      <Text style={{ color: "#123499", fontSize: 13, fontWeight: "bold" }}>
                        Rp {tx.total_amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  {/* Action buttons side-by-side */}
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Pressable
                      onPress={() => handlePrint(tx)}
                      disabled={isGenerating}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        backgroundColor: pressed ? "rgba(18, 52, 153, 0.08)" : "#ffffff",
                        borderWidth: 1.2,
                        borderColor: "#123499",
                        height: 44,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: isGenerating ? 0.7 : 1,
                      })}
                    >
                      <Ionicons name="print-outline" size={16} color="#123499" style={{ marginRight: 6 }} />
                      <Text style={{ color: "#123499", fontSize: 13, fontWeight: "bold" }}>
                        Cetak Nota
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDownloadPDF(tx)}
                      disabled={isGenerating}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        backgroundColor: pressed ? "#15803d" : "#22c55e",
                        height: 44,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: isGenerating ? 0.7 : 1,
                        shadowColor: "#22c55e",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        elevation: 2,
                      })}
                    >
                      <Ionicons name="download-outline" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "bold" }}>
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
