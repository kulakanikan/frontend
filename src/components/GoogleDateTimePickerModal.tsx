import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Type, Shadow } from "../constants/theme";
import { fontSize as rfs, radius, spacing, iconSize } from "../utils/responsive";

interface GoogleDateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (dateStr: string, timeStr: string) => void;
  initialDate?: Date;
  minimumDate?: Date;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function GoogleDateTimePickerModal({
  visible,
  onClose,
  onConfirm,
  initialDate,
  minimumDate = new Date(),
}: GoogleDateTimePickerProps) {
  const [step, setStep] = useState<"calendar" | "clock">("calendar");

  // Selected Date State
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  // Selected Time State (Hour & Minute)
  const [selectedHour, setSelectedHour] = useState<number>(5);
  const [selectedMinute, setSelectedMinute] = useState<number>(30);
  const [clockMode, setClockMode] = useState<"hour" | "minute">("hour");

  useEffect(() => {
    if (visible) {
      setStep("calendar");
      const init = initialDate || new Date();
      setSelectedDate(init);
      setCurrentMonth(init.getMonth());
      setCurrentYear(init.getFullYear());
      setSelectedHour(init.getHours());
      setSelectedMinute(Math.floor(init.getMinutes() / 5) * 5);
      setClockMode("hour");
    }
  }, [visible, initialDate]);

  // Normalize minimumDate to midnight for exact date comparison
  const minDateMidnight = new Date(minimumDate);
  minDateMidnight.setHours(0, 0, 0, 0);

  // ─── CALENDAR GENERATION LOGIC ─────────────────────────────────────────────
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dayNum: number) => {
    const target = new Date(currentYear, currentMonth, dayNum);
    if (target < minDateMidnight) return; // Block selecting past dates!
    setSelectedDate(target);
  };

  const handleGoToClock = () => {
    setStep("clock");
  };

  const handleConfirmAll = () => {
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(selectedDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const hh = String(selectedHour).padStart(2, "0");
    const min = String(selectedMinute).padStart(2, "0");
    const timeStr = `${hh}:${min}`;

    onConfirm(dateStr, timeStr);
    onClose();
  };

  // ─── CIRCULAR CLOCK DIAL NUMBERS ───────────────────────────────────────────
  const hoursDial = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesDial = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Compute angle for clock hand
  const getClockHandAngle = () => {
    if (clockMode === "hour") {
      const h = selectedHour % 12;
      return h * 30; // 360 / 12 = 30 deg
    } else {
      return selectedMinute * 6; // 360 / 60 = 6 deg
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          {/* Header Area (Google Material Style Blue Top) */}
          <View style={styles.materialHeader}>
            <Text style={styles.headerSubtext}>
              {step === "calendar" ? "PILIH TANGGAL PENGANTARAN" : "PILIH JAM PENGANTARAN"}
            </Text>
            {step === "calendar" ? (
              <Text style={styles.headerMainTitle}>
                {DAY_NAMES[selectedDate.getDay()]}, {selectedDate.getDate()}{" "}
                {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
            ) : (
              <View style={styles.timeDisplayRow}>
                <TouchableOpacity
                  onPress={() => setClockMode("hour")}
                  style={[styles.timeBox, clockMode === "hour" && styles.timeBoxActive]}
                >
                  <Text style={[styles.timeBoxText, clockMode === "hour" && styles.timeBoxTextActive]}>
                    {String(selectedHour).padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.timeColon}>:</Text>
                <TouchableOpacity
                  onPress={() => setClockMode("minute")}
                  style={[styles.timeBox, clockMode === "minute" && styles.timeBoxActive]}
                >
                  <Text style={[styles.timeBoxText, clockMode === "minute" && styles.timeBoxTextActive]}>
                    {String(selectedMinute).padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.wibLabel}>WIB</Text>
              </View>
            )}
          </View>

          {/* Body Content */}
          {step === "calendar" ? (
            <View style={styles.calendarBody}>
              {/* Month Navigator Header */}
              <View style={styles.monthNavRow}>
                <Text style={styles.monthNavTitle}>
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrow}>
                    <Ionicons name="chevron-back" size={20} color={Colors.navy} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.navArrow}>
                    <Ionicons name="chevron-forward" size={20} color={Colors.navy} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Day Headers (Min Sen Sel ...) */}
              <View style={styles.weekHeaderRow}>
                {DAY_NAMES.map((name) => (
                  <Text key={name} style={styles.weekHeaderText}>
                    {name}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {/* Blank cells for offset */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <View key={`blank-${i}`} style={styles.dayCell} />
                ))}

                {/* Days of Month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const thisDate = new Date(currentYear, currentMonth, dayNum);
                  thisDate.setHours(0, 0, 0, 0);

                  const isPast = thisDate < minDateMidnight; // DISABLED past dates
                  const isSelected =
                    selectedDate.getFullYear() === currentYear &&
                    selectedDate.getMonth() === currentMonth &&
                    selectedDate.getDate() === dayNum;

                  const isToday =
                    new Date().getFullYear() === currentYear &&
                    new Date().getMonth() === currentMonth &&
                    new Date().getDate() === dayNum;

                  return (
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      disabled={isPast}
                      onPress={() => handleSelectDay(dayNum)}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isToday && !isSelected && styles.dayCellToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          isPast && styles.dayCellTextDisabled,
                          isSelected && styles.dayCellTextSelected,
                          isToday && !isSelected && styles.dayCellTextToday,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons for Calendar Step */}
              <View style={styles.dialogActions}>
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleGoToClock} style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>Lanjut Pilih Jam ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.clockBody}>
              <Text style={styles.clockInstruction}>
                {clockMode === "hour" ? "Geser atau ketuk angka jam (0-23)" : "Geser atau ketuk menit (0-55)"}
              </Text>

              {/* Google Material Circular Clock Container */}
              <View style={styles.clockFaceContainer}>
                <View style={styles.clockFace}>
                  {/* Center Pivot Point */}
                  <View style={styles.clockCenterPivot} />

                  {/* Clock Hand Pointer */}
                  <View
                    style={[
                      styles.clockHand,
                      {
                        transform: [
                          { rotate: `${getClockHandAngle()}deg` },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.clockHandDot} />
                  </View>

                  {/* Dial Numbers in 360 Circle */}
                  {(clockMode === "hour" ? hoursDial : minutesDial).map((val, idx) => {
                    const angle = idx * 30 * (Math.PI / 180);
                    const radiusOffset = 88; // distance from center
                    const x = Math.sin(angle) * radiusOffset;
                    const y = -Math.cos(angle) * radiusOffset;

                    const isValSelected =
                      clockMode === "hour"
                        ? selectedHour % 12 === val % 12
                        : selectedMinute === val;

                    return (
                      <TouchableOpacity
                        key={`num-${val}`}
                        onPress={() => {
                          if (clockMode === "hour") {
                            setSelectedHour(val === 12 ? 0 : val);
                            setClockMode("minute"); // Auto advance to minute picking!
                          } else {
                            setSelectedMinute(val);
                          }
                        }}
                        style={[
                          styles.dialNumberBtn,
                          {
                            transform: [
                              { translateX: x },
                              { translateY: y },
                            ],
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dialNumberText,
                            isValSelected && styles.dialNumberTextSelected,
                          ]}
                        >
                          {val < 10 ? `0${val}` : val}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons for Clock Step */}
              <View style={styles.dialogActions}>
                <TouchableOpacity onPress={() => setStep("calendar")} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>‹ Ulangi Tanggal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirmAll} style={styles.confirmBtn}>
                  <Text style={styles.confirmBtnText}>Simpan Tanggal & Jam</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 35, 92, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  dialogContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#ffffff",
    borderRadius: radius(24),
    overflow: "hidden",
    ...Shadow.cardLift,
  },
  materialHeader: {
    backgroundColor: Colors.navy,
    padding: spacing(18),
  },
  headerSubtext: {
    color: Colors.royalBlueMuted,
    fontSize: rfs(10),
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerMainTitle: {
    color: "#ffffff",
    fontSize: rfs(16),
    fontWeight: "bold",
  },
  timeDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  timeBox: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: radius(12),
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeBoxActive: {
    backgroundColor: Colors.royalBlue,
  },
  timeBoxText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: rfs(26),
    fontWeight: "900",
  },
  timeBoxTextActive: {
    color: "#ffffff",
  },
  timeColon: {
    color: "#ffffff",
    fontSize: rfs(24),
    fontWeight: "bold",
  },
  wibLabel: {
    color: "#ffffff",
    fontSize: rfs(12),
    fontWeight: "bold",
    marginLeft: 6,
  },
  calendarBody: {
    padding: spacing(16),
  },
  monthNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing(12),
  },
  monthNavTitle: {
    fontSize: rfs(14),
    fontWeight: "bold",
    color: Colors.navy,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  weekHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekHeaderText: {
    width: 36,
    textAlign: "center",
    fontSize: rfs(11),
    fontWeight: "bold",
    color: Colors.textMuted,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: 36,
    height: 36,
    margin: 3,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellSelected: {
    backgroundColor: Colors.navy,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.royalBlue,
  },
  dayCellText: {
    fontSize: rfs(12.5),
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  dayCellTextDisabled: {
    color: "#cbd5e1",
  },
  dayCellTextSelected: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  dayCellTextToday: {
    color: Colors.royalBlue,
    fontWeight: "bold",
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    marginTop: spacing(16),
    paddingTop: spacing(12),
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontSize: rfs(12),
    fontWeight: "600",
  },
  confirmBtn: {
    backgroundColor: Colors.navy,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius(10),
  },
  confirmBtnText: {
    color: "#ffffff",
    fontSize: rfs(12),
    fontWeight: "bold",
  },
  clockBody: {
    padding: spacing(18),
    alignItems: "center",
  },
  clockInstruction: {
    fontSize: rfs(11.5),
    color: Colors.textMuted,
    marginBottom: spacing(16),
    fontWeight: "600",
  },
  clockFaceContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  clockFace: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  clockCenterPivot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.royalBlue,
    position: "absolute",
    zIndex: 10,
  },
  clockHand: {
    position: "absolute",
    width: 3,
    height: 88,
    backgroundColor: Colors.royalBlue,
    bottom: "50%",
    transformOrigin: "bottom center",
    alignItems: "center",
  },
  clockHandDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.royalBlue,
    marginTop: -16,
  },
  dialNumberBtn: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  dialNumberText: {
    fontSize: rfs(12.5),
    fontWeight: "bold",
    color: Colors.navy,
  },
  dialNumberTextSelected: {
    color: "#ffffff",
  },
});
