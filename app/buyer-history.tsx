import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  TextInput,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useBuyerStore, useTransactionStore } from "../src/store";
import { Colors, Type, Shadow, SharedStyles } from "../src/constants/theme";
import { wp, hp, spacing, fontSize as rfs, radius, iconSize } from "../src/utils/responsive";
import { formatCurrency, formatWeight } from "../src/utils";
import { salesApi, type ApiBuyer, type ApiSale, type ApiSaleDetail } from "../src/services/api";

export default function BuyerHistoryScreen() {
  const router = useRouter();
  const { buyers, fetchBuyers, updateBuyer } = useBuyerStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState<ApiBuyer | null>(null);
  
  // Sales History State
  const [buyerSales, setBuyerSales] = useState<(ApiSaleDetail | ApiSale)[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Edit Buyer State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editType, setEditType] = useState("perorangan");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Fetch buyers list on focus
  useFocusEffect(
    useCallback(() => {
      fetchBuyers().catch((err) => console.error("Failed to fetch buyers:", err));
    }, [fetchBuyers])
  );

  // If a buyer is selected, refresh their sales list
  const refreshBuyerSales = async (buyerId: string) => {
    setIsHistoryLoading(true);
    try {
      const salesRes = await salesApi.list({ buyer_id: buyerId });
      // Fetch details with payments for tempo sales
      const detailedSales = await Promise.all(
        salesRes.sales.map(async (sale) => {
          if (sale.statusBayar === "tempo") {
            try {
              const detailRes = await salesApi.get(sale.id);
              return detailRes.sale;
            } catch (err) {
              return sale;
            }
          }
          return sale;
        })
      );
      setBuyerSales(detailedSales);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSelectBuyer = (buyer: ApiBuyer) => {
    setSelectedBuyer(buyer);
    refreshBuyerSales(buyer.id);
  };

  const handleOpenEdit = () => {
    if (!selectedBuyer) return;
    setEditName(selectedBuyer.nama);
    setEditPhone(selectedBuyer.telepon || "");
    setEditType(selectedBuyer.tipePembeli || "perorangan");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBuyer) return;
    if (!editName.trim()) {
      alert("Nama pembeli wajib diisi");
      return;
    }

    setIsSavingEdit(true);
    try {
      // Auto-prefix phone with +62 if entered as 08
      let formattedPhone = editPhone.trim();
      if (formattedPhone.startsWith("08")) {
        formattedPhone = "+628" + formattedPhone.slice(2);
      }

      await updateBuyer(selectedBuyer.id, {
        nama: editName.trim(),
        telepon: formattedPhone || null,
        tipe_pembeli: editType,
      });

      setSelectedBuyer((prev) =>
        prev
          ? {
              ...prev,
              nama: editName.trim(),
              telepon: formattedPhone || null,
              tipePembeli: editType,
            }
          : null
      );
      setShowEditModal(false);
      alert("Data pembeli berhasil disimpan");
    } catch (err) {
      alert("Gagal memperbarui data pembeli");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getInvoiceHtml = (tx: ApiSaleDetail | ApiSale) => {
    const mainFishHtml = `
      <tr class="item-row">
        <td class="col-desc">Ikan ${tx.batch?.jenisIkan || "Ikan"}</td>
        <td class="col-qty">${formatWeight(Number(tx.beratJual))}</td>
        <td class="col-price">${formatCurrency(Number(tx.hargaSatuan))}</td>
        <td class="col-total">${formatCurrency(Number(tx.beratJual) * Number(tx.hargaSatuan))}</td>
      </tr>
    `;

    const extrasHtml = tx.saleExtras
      .map(
        (item) => `
      <tr class="item-row">
        <td class="col-desc">+ ${item.namaItem}</td>
        <td class="col-qty">${item.jumlah}x</td>
        <td class="col-price">${formatCurrency(Number(item.hargaSatuan))}</td>
        <td class="col-total">${formatCurrency(Number(item.subtotal))}</td>
      </tr>
    `
      )
      .join("");

    const formattedDate = new Date(tx.tanggal).toLocaleDateString("id-ID", {
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
        <title>Nota Belanja ${tx.receipt?.nomorStruk || tx.id.slice(0, 8)}</title>
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
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <h1>KULAKAN IKAN</h1>
            <p>Sistem Kasir & Gudang Distributor Ikan</p>
          </div>
          
          <div class="meta-section">
            <div class="meta-col">
              <p><strong>Nota Untuk:</strong></p>
              <p>${selectedBuyer?.nama || "Pelanggan Umum"}</p>
              <p>HP: ${selectedBuyer?.telepon || "-"}</p>
              <p>Tipe: ${selectedBuyer?.tipePembeli || "perorangan"}</p>
            </div>
            <div class="meta-col" style="text-align: right;">
              <p><strong>No. Invoice:</strong> ${tx.receipt?.nomorStruk || tx.id.slice(0, 8)}</p>
              <p><strong>Tanggal:</strong> ${formattedDate}</p>
              <p><strong>Status:</strong> ${tx.statusBayar.toUpperCase()}</p>
            </div>
          </div>
          
          <table class="table-items">
            <thead>
              <tr>
                <th style="width: 45%;">Produk</th>
                <th style="width: 15%; text-align: right;">Qty</th>
                <th style="width: 20%; text-align: right;">Harga</th>
                <th style="width: 20%; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${mainFishHtml}
              ${extrasHtml}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-row grand-total">
              <span>Total Tagihan:</span>
              <span>${formatCurrency(Number(tx.total))}</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = async (tx: ApiSaleDetail | ApiSale) => {
    setIsGenerating(true);
    try {
      const htmlContent = getInvoiceHtml(tx);
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      Alert.alert("Gagal mencetak nota", "Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async (tx: ApiSaleDetail | ApiSale) => {
    setIsGenerating(true);
    try {
      const htmlContent = getInvoiceHtml(tx);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      if (Platform.OS === "ios") {
        await Sharing.shareAsync(uri);
      } else {
        const permission = await Sharing.isAvailableAsync();
        if (permission) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert("Fitur tidak didukung", "Sharing tidak tersedia pada perangkat ini.");
        }
      }
    } catch (error) {
      Alert.alert("Gagal mengunduh PDF", "Terjadi kesalahan saat memproses file.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter local buyers for display query
  const filteredBuyers = buyers.filter((b) =>
    b.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Computations for buyer statistics
  const totalSpent = buyerSales.reduce((sum, s) => sum + Number(s.total), 0);
  
  const totalDebt = buyerSales.reduce((sum, s) => {
    if (s.statusBayar === "lunas") return sum;
    // If tempo, check detailed payments
    const detail = s as ApiSaleDetail;
    const paid = detail.payments?.reduce((pSum, p) => pSum + Number(p.jumlahBayar), 0) || 0;
    return sum + (Number(s.total) - paid);
  }, 0);

  return (
    <SafeAreaView style={SharedStyles.screen}>
      {/* Header */}
      <View style={SharedStyles.header}>
        <View style={SharedStyles.row}>
          <Pressable
            onPress={() => (selectedBuyer ? setSelectedBuyer(null) : router.back())}
            style={({ pressed }) => ({
              ...SharedStyles.backButton,
              backgroundColor: pressed ? "rgba(0,0,0,0.05)" : "transparent",
            })}
          >
            <Ionicons name="chevron-back" size={iconSize(24)} color={Colors.textPrimary} />
          </Pressable>
          <Text style={Type.headerTitle}>
            {selectedBuyer ? selectedBuyer.nama : "Manajemen Pelanggan"}
          </Text>
        </View>
        {selectedBuyer && (
          <Pressable
            onPress={handleOpenEdit}
            style={({ pressed }) => ({
              ...SharedStyles.headerSaveButton,
              backgroundColor: pressed ? "rgba(0, 7, 45, 0.15)" : "rgba(0, 7, 45, 0.08)",
              borderWidth: 1,
              borderColor: Colors.royalBlue,
            })}
          >
            <Text style={{ color: Colors.royalBlue, fontSize: rfs(12), fontWeight: "700" }}>
              Edit Info
            </Text>
          </Pressable>
        )}
      </View>

      <View style={[SharedStyles.content, { padding: spacing(16) }]}>
        
        {/* Search bar displayed only on list view */}
        {selectedBuyer === null && (
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#ffffff",
            borderRadius: radius(16),
            paddingHorizontal: spacing(12),
            height: 48,
            marginBottom: spacing(20),
            borderWidth: 1.5,
            borderColor: "#e5eaf7",
          }}>
            <Ionicons name="search" size={iconSize(20)} color="#64748b" style={{ marginRight: spacing(8) }} />
            <TextInput
              style={{ flex: 1, height: "100%", color: "#00072d", fontSize: rfs(14) }}
              placeholder="Cari pelanggan..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}

        {selectedBuyer === null ? (
          // === LIST OF BUYERS VIEW ===
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={{ color: "#00072d", fontSize: rfs(16), fontWeight: "bold", marginBottom: spacing(12) }}>
              Daftar Pelanggan Terdaftar
            </Text>
            {filteredBuyers.length === 0 ? (
              <View style={{ alignItems: "center", marginTop: 40 }}>
                <Ionicons name="people-outline" size={iconSize(48)} color="#64748b" style={{ marginBottom: spacing(12) }} />
                <Text style={{ color: "#64748b", textAlign: "center", fontSize: rfs(13) }}>
                  Tidak ada pelanggan yang cocok dengan pencarian.
                </Text>
              </View>
            ) : (
              filteredBuyers.map((buyer) => (
                <Pressable
                  key={buyer.id}
                  onPress={() => handleSelectBuyer(buyer)}
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
                      {/* Avatar */}
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: Colors.royalBlueMuted,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: spacing(12),
                        }}
                      >
                        <Text style={{ color: Colors.royalBlue, fontSize: rfs(16), fontWeight: "bold" }}>
                          {buyer.nama.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={{ color: "#00072d", fontSize: rfs(14), fontWeight: "bold" }}>{buyer.nama}</Text>
                        <Text style={{ color: "#64748b", fontSize: rfs(11), marginTop: 2 }}>
                          Tipe: <Text style={{ textTransform: "capitalize", fontWeight: "600" }}>{buyer.tipePembeli || "perorangan"}</Text> {buyer.telepon ? `| ${buyer.telepon}` : ""}
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
                marginBottom: spacing(16),
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="arrow-back" size={iconSize(16)} color={Colors.royalBlue} />
              <Text style={{ color: Colors.royalBlue, fontSize: rfs(13), fontWeight: "bold", marginLeft: spacing(6) }}>
                Kembali ke Daftar Pelanggan
              </Text>
            </Pressable>

            {/* Stats Summary Card */}
            <View style={{ backgroundColor: "#f0f4f9", borderRadius: radius(18), padding: spacing(16), marginBottom: spacing(18) }}>
              <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: 12 }]}>
                <Text style={{ color: "#64748b", fontSize: 12 }}>Telepon</Text>
                <Text style={{ color: "#00072d", fontWeight: "bold", fontSize: 13 }}>{selectedBuyer.telepon || "-"}</Text>
              </View>
              <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: 12 }]}>
                <Text style={{ color: "#64748b", fontSize: 12 }}>Total Pembelian</Text>
                <Text style={{ color: "#00072d", fontWeight: "bold", fontSize: 13 }}>{formatCurrency(totalSpent)}</Text>
              </View>
              <View style={[SharedStyles.row, { justifyContent: "space-between" }]}>
                <Text style={{ color: "#64748b", fontSize: 12 }}>Total Hutang (Piutang)</Text>
                <Text style={{ color: totalDebt > 0 ? Colors.danger : Colors.success, fontWeight: "900", fontSize: 14 }}>
                  {formatCurrency(totalDebt)}
                </Text>
              </View>
            </View>

            {/* Buyer Title Info Header */}
            <View style={[SharedStyles.row, { justifyContent: "space-between", marginBottom: spacing(16) }]}>
              <Text style={{ color: "#00072d", fontSize: rfs(16), fontWeight: "bold" }}>
                Riwayat Transaksi
              </Text>
              <View style={{ backgroundColor: Colors.royalBlueMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius(8) }}>
                <Text style={{ color: Colors.royalBlue, fontSize: rfs(11), fontWeight: "700" }}>
                  {buyerSales.length} Transaksi
                </Text>
              </View>
            </View>

            {/* History of Invoices */}
            {isHistoryLoading ? (
              <ActivityIndicator size="large" color={Colors.royalBlue} style={{ marginTop: 40 }} />
            ) : buyerSales.length === 0 ? (
              <Text style={{ color: "#64748b", fontSize: 13, textAlign: "center", marginTop: 40, fontStyle: "italic" }}>
                Belum ada transaksi untuk pembeli ini.
              </Text>
            ) : (
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {buyerSales.map((tx) => (
                  <View
                    key={tx.id}
                    style={[SharedStyles.card, { padding: spacing(16), marginBottom: spacing(12) }]}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <View>
                        <Text style={{ color: "#00072d", fontSize: 14, fontWeight: "bold" }}>
                          {tx.receipt?.nomorStruk || tx.id.slice(0, 8)}
                        </Text>
                        <Text style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                          {new Date(tx.tanggal).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: tx.statusBayar === "lunas" ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text
                          style={{
                            color: tx.statusBayar === "lunas" ? Colors.success : "#d97706",
                            fontSize: rfs(10),
                            fontWeight: "bold",
                            textTransform: "uppercase",
                          }}
                        >
                          {tx.statusBayar}
                        </Text>
                      </View>
                    </View>

                    {/* Items display */}
                    <View style={SharedStyles.infoRow}>
                      <View style={[SharedStyles.row, { justifyContent: "space-between", marginVertical: spacing(2) }]}>
                        <Text style={{ fontSize: rfs(12), color: "#00072d", flex: 1, marginRight: spacing(8) }} numberOfLines={1}>
                          Ikan {tx.batch?.jenisIkan || "Ikan"} ({formatWeight(Number(tx.beratJual))})
                        </Text>
                        <Text style={{ fontSize: rfs(12), color: "#00072d" }}>
                          {formatCurrency(Number(tx.total))}
                        </Text>
                      </View>
                      {tx.saleExtras.map((extra) => (
                        <View key={extra.id} style={[SharedStyles.row, { justifyContent: "space-between", marginVertical: spacing(1) }]}>
                          <Text style={{ fontSize: rfs(11), color: "#64748b" }}>
                            + {extra.namaItem} ({extra.jumlah}x)
                          </Text>
                          <Text style={{ fontSize: rfs(11), color: "#64748b" }}>
                            {formatCurrency(Number(extra.subtotal))}
                          </Text>
                        </View>
                      ))}
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
            )}
          </View>
        )}
      </View>

      {/* MODAL: EDIT BUYER INFO */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0, 7, 45, 0.7)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ width: "100%", maxWidth: 330, backgroundColor: "#ffffff", borderRadius: 24, padding: 22, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 8 }}>
            
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <Text style={{ color: "#00072d", fontSize: 17, fontWeight: "bold" }}>Edit Info Pelanggan</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#00072d" />
              </Pressable>
            </View>

            {/* Name */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>Nama Pelanggan *</Text>
              <TextInput
                style={{ height: 44, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            {/* Phone */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 6 }}>No. HP / Telepon</Text>
              <TextInput
                style={{ height: 44, backgroundColor: "#e5eaf7", borderRadius: 12, paddingHorizontal: 14, fontSize: 14, color: "#00072d" }}
                placeholder="Contoh: 08123..."
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={editPhone}
                onChangeText={setEditPhone}
              />
            </View>

            {/* Tipe Pembeli Dropdown choice */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: "#00072d", fontSize: 13, fontWeight: "600", marginBottom: 8 }}>Tipe Pelanggan</Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {["pengecer", "grosir", "perorangan", "lainnya"].map((type) => {
                  const isSel = editType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setEditType(type)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: isSel ? Colors.navy : "#f0f4f9",
                        borderWidth: 1,
                        borderColor: isSel ? Colors.navy : "#e5eaf7",
                      }}
                    >
                      <Text style={{ color: isSel ? "#ffffff" : "#00072d", fontSize: 11, fontWeight: "bold", textTransform: "capitalize" }}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                disabled={isSavingEdit}
                onPress={() => setShowEditModal(false)}
                style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: "#051650", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#051650", fontWeight: "bold", fontSize: 13 }}>Batal</Text>
              </Pressable>
              <Pressable
                disabled={isSavingEdit}
                onPress={handleSaveEdit}
                style={{ flex: 1, height: 44, backgroundColor: "#123499", borderRadius: 12, alignItems: "center", justifyContent: "center" }}
              >
                {isSavingEdit ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 13 }}>Simpan</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
