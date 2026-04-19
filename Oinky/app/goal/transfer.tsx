import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ColorPalette } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { goalsAPI, transactionsAPI } from "../../services/api";

type Goal = {
  _id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  category?: string;
};

const GOAL_ICONS: Record<string, string> = {
  Tech: "laptop-outline",
  Travel: "airplane-outline",
  Fashion: "bag-handle-outline",
  Gaming: "game-controller-outline",
  Home: "home-outline",
  Health: "barbell-outline",
  Food: "restaurant-outline",
  Other: "flag-outline",
};

export default function TransferScreen() {
  const { from } = useLocalSearchParams<{ from: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTo, setSelectedTo] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const data = await goalsAPI.getAll(token, "active");
        setGoals(data.goals);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Could not load goals.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  const fromGoal = goals.find((g) => g._id === from) ?? goals[0];
  const toGoals = goals.filter((g) => g._id !== fromGoal?._id);
  const toGoal = toGoals.find((g) => g._id === selectedTo);

  const maxTransfer = fromGoal?.currentAmount ?? 0;
  const parsedAmount = parseFloat(amount) || 0;
  const isValid = selectedTo && parsedAmount > 0 && parsedAmount <= maxTransfer;

  const handleTransfer = () => {
    if (!isValid || !fromGoal || !toGoal) return;
    Alert.alert(
      "Confirm Transfer",
      `Move $${parsedAmount.toFixed(2)} from "${fromGoal.title}" to "${toGoal.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Transfer",
          onPress: async () => {
            if (!token) return;
            setIsSubmitting(true);
            try {
              await transactionsAPI.transfer(token, {
                fromGoalId: fromGoal._id,
                toGoalId: selectedTo,
                amount: parsedAmount,
              });
              Alert.alert(
                "Transferred! 🔄",
                `$${parsedAmount.toFixed(2)} moved to "${toGoal.title}".`,
                [{ text: "Done", onPress: () => router.replace("/(tabs)/goals") }],
              );
            } catch (err: any) {
              Alert.alert("Error", err.message || "Transfer failed.");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const setMax = () => setAmount(maxTransfer.toString());

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.primary} style={{ flex: 1, marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!fromGoal) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transfer Savings</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.textSecondary }}>No goals found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer Savings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.explainer}>
          <Text style={styles.explainerText}>
            Move money between your goals. Your total savings stays the same —
            it just goes to a different goal.
          </Text>
        </View>

        {/* From Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transferring From</Text>
          <View style={styles.fromCard}>
            <Ionicons
              name={(GOAL_ICONS[fromGoal.category ?? ""] ?? "flag-outline") as any}
              size={32}
              color={colors.primary}
            />
            <View style={styles.fromInfo}>
              <Text style={styles.fromTitle}>{fromGoal.title}</Text>
              <Text style={styles.fromBalance}>
                ${fromGoal.currentAmount.toLocaleString()} available
              </Text>
            </View>
            <View style={styles.fromBadge}>
              <Text style={styles.fromBadgeText}>Source</Text>
            </View>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Amount</Text>
          <View style={styles.amountCard}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <TouchableOpacity style={styles.maxBtn} onPress={setMax}>
              <Text style={styles.maxText}>MAX</Text>
            </TouchableOpacity>
          </View>
          {parsedAmount > maxTransfer && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.secondary} />
              <Text style={styles.errorText}>
                Exceeds available balance of ${maxTransfer}
              </Text>
            </View>
          )}
          {parsedAmount > 0 && parsedAmount <= maxTransfer && (
            <View style={styles.remainRow}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
              <Text style={styles.remainText}>
                ${(maxTransfer - parsedAmount).toFixed(2)} will stay in "{fromGoal.title}"
              </Text>
            </View>
          )}
        </View>

        {/* Arrow */}
        <View style={styles.arrowRow}>
          <View style={styles.arrowLine} />
          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-down" size={20} color={colors.white} />
          </View>
          <View style={styles.arrowLine} />
        </View>

        {/* To Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transfer To</Text>
          {toGoals.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                No other active goals to transfer to.
              </Text>
            </View>
          ) : (
            <View style={styles.goalList}>
              {toGoals.map((goal) => {
                const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                const isSelected = selectedTo === goal._id;
                return (
                  <TouchableOpacity
                    key={goal._id}
                    style={[styles.goalOption, isSelected && styles.goalOptionSelected]}
                    onPress={() => setSelectedTo(goal._id)}
                  >
                    <View style={styles.goalOptionLeft}>
                      <Ionicons
                        name={(GOAL_ICONS[goal.category ?? ""] ?? "flag-outline") as any}
                        size={28}
                        color={isSelected ? colors.white : colors.primary}
                      />
                      <View style={styles.goalOptionInfo}>
                        <Text
                          style={[
                            styles.goalOptionTitle,
                            isSelected && styles.goalOptionTitleSelected,
                          ]}
                        >
                          {goal.title}
                        </Text>
                        <View style={styles.miniProgressTrack}>
                          <View
                            style={[
                              styles.miniProgressFill,
                              {
                                width: `${pct}%`,
                                backgroundColor: isSelected ? colors.white : colors.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.goalOptionSub,
                            isSelected && styles.goalOptionSubSelected,
                          ]}
                        >
                          ${goal.currentAmount} / ${goal.targetAmount} · {pct}%
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Preview */}
        {isValid && toGoal && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Transfer Summary</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>From</Text>
              <Text style={styles.previewValue}>{fromGoal.title}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>To</Text>
              <Text style={styles.previewValue}>{toGoal.title}</Text>
            </View>
            <View style={[styles.previewRow, styles.previewRowLast]}>
              <Text style={styles.previewLabel}>Amount</Text>
              <Text style={styles.previewAmount}>${parsedAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.transferBtn,
              (!isValid || isSubmitting) && styles.transferBtnDisabled,
            ]}
            onPress={handleTransfer}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="swap-horizontal" size={20} color={colors.white} />
                <Text style={styles.transferBtnText}>Transfer Now</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    headerTitle: { fontSize: 18, fontWeight: "800", color: c.textPrimary },
    explainer: {
      marginHorizontal: 20,
      marginBottom: 8,
      backgroundColor: c.primaryLight,
      borderRadius: 14,
      padding: 14,
    },
    explainerText: {
      fontSize: 13,
      color: c.primary,
      fontWeight: "600",
      lineHeight: 19,
    },
    section: { paddingHorizontal: 20, marginTop: 20 },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textPrimary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    fromCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 2,
      borderColor: c.primary,
    },
    fromInfo: { flex: 1 },
    fromTitle: { fontSize: 16, fontWeight: "800", color: c.textPrimary },
    fromBalance: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    fromBadge: {
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    fromBadgeText: { color: c.white, fontSize: 11, fontWeight: "700" },
    amountCard: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.border,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
    },
    dollarSign: {
      fontSize: 28,
      fontWeight: "800",
      color: c.textSecondary,
      marginRight: 6,
    },
    amountInput: {
      flex: 1,
      fontSize: 34,
      fontWeight: "800",
      color: c.textPrimary,
      paddingVertical: 16,
    },
    maxBtn: {
      backgroundColor: c.primaryLight,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    maxText: { color: c.primary, fontSize: 12, fontWeight: "800" },
    errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
    errorText: { fontSize: 13, color: c.secondary, fontWeight: "600" },
    remainRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
    remainText: { fontSize: 13, color: c.success, fontWeight: "600" },
    arrowRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginTop: 20,
    },
    arrowLine: { flex: 1, height: 1.5, backgroundColor: c.border },
    arrowCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 12,
    },
    goalList: { gap: 10 },
    goalOption: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1.5,
      borderColor: c.border,
    },
    goalOptionSelected: {
      borderColor: c.primary,
      backgroundColor: c.primary,
    },
    goalOptionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    goalOptionInfo: { flex: 1 },
    goalOptionTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: c.textPrimary,
      marginBottom: 6,
    },
    goalOptionTitleSelected: { color: c.white },
    miniProgressTrack: {
      height: 5,
      backgroundColor: "rgba(0,0,0,0.08)",
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 4,
    },
    miniProgressFill: { height: "100%", borderRadius: 3 },
    goalOptionSub: {
      fontSize: 11,
      color: c.textSecondary,
      fontWeight: "600",
    },
    goalOptionSubSelected: { color: "rgba(255,255,255,0.75)" },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    radioSelected: { borderColor: c.white },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.white,
    },
    previewCard: {
      marginHorizontal: 20,
      marginTop: 20,
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    previewTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 12,
    },
    previewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.background,
    },
    previewRowLast: { borderBottomWidth: 0 },
    previewLabel: { fontSize: 14, color: c.textSecondary, fontWeight: "600" },
    previewValue: { fontSize: 14, color: c.textPrimary, fontWeight: "700" },
    previewAmount: { fontSize: 16, color: c.primary, fontWeight: "800" },
    footer: { paddingHorizontal: 20, marginTop: 24 },
    transferBtn: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      shadowColor: c.primary,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    transferBtnDisabled: { opacity: 0.4 },
    transferBtnText: { color: c.white, fontSize: 17, fontWeight: "800" },
    cancelBtn: { alignItems: "center", paddingVertical: 14 },
    cancelText: { color: c.textSecondary, fontSize: 15, fontWeight: "600" },
  });
}
