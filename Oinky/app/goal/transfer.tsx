import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
} from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants";

// Mock goals — Week 7/8 will load from goalsAPI.getAll(token)
const MOCK_GOALS = [
  {
    _id: "1",
    title: "PS5",
    emoji: "🎮",
    currentAmount: 175,
    targetAmount: 500,
  },
  {
    _id: "2",
    title: "Japan Trip",
    emoji: "✈️",
    currentAmount: 320,
    targetAmount: 2000,
  },
  {
    _id: "3",
    title: "New MacBook",
    emoji: "💻",
    currentAmount: 50,
    targetAmount: 1299,
  },
  {
    _id: "4",
    title: "Nike Dunks",
    emoji: "👟",
    currentAmount: 80,
    targetAmount: 120,
  },
];

export default function TransferScreen() {
  const { from } = useLocalSearchParams<{ from: string }>();

  const fromGoal = MOCK_GOALS.find((g) => g._id === from) ?? MOCK_GOALS[0];
  const toGoals = MOCK_GOALS.filter((g) => g._id !== fromGoal._id);

  const [selectedTo, setSelectedTo] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const toGoal = toGoals.find((g) => g._id === selectedTo);
  const maxTransfer = fromGoal.currentAmount;
  const parsedAmount = parseFloat(amount) || 0;
  const isValid = selectedTo && parsedAmount > 0 && parsedAmount <= maxTransfer;

  const handleTransfer = () => {
    if (!isValid) return;
    Alert.alert(
      "Confirm Transfer",
      `Move $${parsedAmount.toFixed(2)} from "${fromGoal.title}" to "${toGoal?.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Transfer",
          onPress: () => {
            // TODO Week 7: call transactionsAPI.transfer(token, { fromGoalId: fromGoal._id, toGoalId: selectedTo, amount: parsedAmount })
            Alert.alert(
              "Transferred! 🔄",
              `$${parsedAmount.toFixed(2)} moved to "${toGoal?.title}".`,
              [
                {
                  text: "Done",
                  onPress: () => router.replace("/(tabs)/goals"),
                },
              ],
            );
          },
        },
      ],
    );
  };

  const setMax = () => setAmount(maxTransfer.toString());

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transfer Savings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Explainer */}
        <View style={styles.explainer}>
          <Text style={styles.explainerText}>
            Move money between your goals. Your total savings stays the same —
            it just goes to a different goal. 🐷
          </Text>
        </View>

        {/* From Goal (fixed) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transferring From</Text>
          <View style={styles.fromCard}>
            <Text style={styles.fromEmoji}>{fromGoal.emoji}</Text>
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
              placeholderTextColor={Colors.textSecondary}
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
              <Ionicons
                name="alert-circle-outline"
                size={14}
                color={Colors.secondary}
              />
              <Text style={styles.errorText}>
                Exceeds available balance of ${maxTransfer}
              </Text>
            </View>
          )}
          {parsedAmount > 0 && parsedAmount <= maxTransfer && (
            <View style={styles.remainRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={14}
                color={Colors.success}
              />
              <Text style={styles.remainText}>
                ${(maxTransfer - parsedAmount).toFixed(2)} will stay in "
                {fromGoal.title}"
              </Text>
            </View>
          )}
        </View>

        {/* Arrow */}
        <View style={styles.arrowRow}>
          <View style={styles.arrowLine} />
          <View style={styles.arrowCircle}>
            <Ionicons name="arrow-down" size={20} color={Colors.white} />
          </View>
          <View style={styles.arrowLine} />
        </View>

        {/* To Goal (selectable) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transfer To</Text>
          <View style={styles.goalList}>
            {toGoals.map((goal) => {
              const pct = Math.round(
                (goal.currentAmount / goal.targetAmount) * 100,
              );
              const isSelected = selectedTo === goal._id;
              return (
                <TouchableOpacity
                  key={goal._id}
                  style={[
                    styles.goalOption,
                    isSelected && styles.goalOptionSelected,
                  ]}
                  onPress={() => setSelectedTo(goal._id)}
                >
                  <View style={styles.goalOptionLeft}>
                    <Text style={styles.goalOptionEmoji}>{goal.emoji}</Text>
                    <View style={styles.goalOptionInfo}>
                      <Text
                        style={[
                          styles.goalOptionTitle,
                          isSelected && styles.goalOptionTitleSelected,
                        ]}
                      >
                        {goal.title}
                      </Text>
                      {/* Mini progress */}
                      <View style={styles.miniProgressTrack}>
                        <View
                          style={[
                            styles.miniProgressFill,
                            {
                              width: `${pct}%`,
                              backgroundColor: isSelected
                                ? Colors.white
                                : Colors.primary,
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
                  <View
                    style={[styles.radio, isSelected && styles.radioSelected]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Preview */}
        {isValid && toGoal && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Transfer Summary</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>From</Text>
              <Text style={styles.previewValue}>
                {fromGoal.emoji} {fromGoal.title}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>To</Text>
              <Text style={styles.previewValue}>
                {toGoal.emoji} {toGoal.title}
              </Text>
            </View>
            <View style={[styles.previewRow, styles.previewRowLast]}>
              <Text style={styles.previewLabel}>Amount</Text>
              <Text style={styles.previewAmount}>
                ${parsedAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.transferBtn, !isValid && styles.transferBtnDisabled]}
            onPress={handleTransfer}
            disabled={!isValid}
          >
            <Ionicons name="swap-horizontal" size={20} color={Colors.white} />
            <Text style={styles.transferBtnText}>Transfer Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },

  explainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
  },
  explainerText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
    lineHeight: 19,
  },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  // From card
  fromCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  fromEmoji: { fontSize: 32 },
  fromInfo: { flex: 1 },
  fromTitle: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary },
  fromBalance: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  fromBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  fromBadgeText: { color: Colors.white, fontSize: 11, fontWeight: "700" },

  // Amount
  amountCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  dollarSign: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textSecondary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 34,
    fontWeight: "800",
    color: Colors.textPrimary,
    paddingVertical: 16,
  },
  maxBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  maxText: { color: Colors.primary, fontSize: 12, fontWeight: "800" },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  errorText: { fontSize: 13, color: Colors.secondary, fontWeight: "600" },
  remainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  remainText: { fontSize: 13, color: Colors.success, fontWeight: "600" },

  // Arrow divider
  arrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 20,
  },
  arrowLine: { flex: 1, height: 1.5, backgroundColor: Colors.border },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },

  // Goal list
  goalList: { gap: 10 },
  goalOption: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  goalOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  goalOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  goalOptionEmoji: { fontSize: 28 },
  goalOptionInfo: { flex: 1 },
  goalOptionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  goalOptionTitleSelected: { color: Colors.white },
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
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  goalOptionSubSelected: { color: "rgba(255,255,255,0.75)" },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: Colors.white },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
  },

  // Preview
  previewCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  previewRowLast: { borderBottomWidth: 0 },
  previewLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  previewValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: "700" },
  previewAmount: { fontSize: 16, color: Colors.primary, fontWeight: "800" },

  // Footer
  footer: { paddingHorizontal: 20, marginTop: 24 },
  transferBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  transferBtnDisabled: { opacity: 0.4 },
  transferBtnText: { color: Colors.white, fontSize: 17, fontWeight: "800" },
  cancelBtn: { alignItems: "center", paddingVertical: 14 },
  cancelText: { color: Colors.textSecondary, fontSize: 15, fontWeight: "600" },
});
