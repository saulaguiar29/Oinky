import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Linking,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { goalsAPI, transactionsAPI } from "../../services/api";
import {
  scheduleMissedPaymentNudge,
  cancelGoalReminder,
} from "../../services/notifications";

type Transaction = {
  _id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  note?: string;
  createdAt: string;
};

type Goal = {
  _id: string;
  title: string;
  category?: string;
  targetAmount: number;
  currentAmount: number;
  savingPlan: string;
  deadline?: string;
  status: string;
  notes?: string;
  productUrl?: string;
  imageUrl?: string | null;
};

type ModalType = "deposit" | "withdraw" | null;

function ActionModal({
  visible,
  type,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  visible: boolean;
  type: ModalType;
  onClose: () => void;
  onConfirm: (amount: string, note: string) => void;
  isSubmitting: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const isDeposit = type === "deposit";

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }
    onConfirm(amount, note);
    setAmount("");
    setNote("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={modal.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <TouchableWithoutFeedback>
              <View style={modal.sheet}>
                <View style={modal.handle} />
                <Text style={modal.title}>
                  {isDeposit ? "💰 Add Money" : "💸 Withdraw"}
                </Text>
                <Text style={modal.subtitle}>
                  {isDeposit
                    ? "How much are you saving?"
                    : "How much do you need back?"}
                </Text>
                <View style={modal.amountRow}>
                  <Text style={modal.dollarSign}>$</Text>
                  <TextInput
                    style={modal.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  <TouchableOpacity
                    style={modal.keyboardDoneBtn}
                    onPress={Keyboard.dismiss}
                  >
                    <Text style={modal.keyboardDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={modal.noteInput}
                  placeholder="Add a note (optional)"
                  placeholderTextColor={Colors.textSecondary}
                  value={note}
                  onChangeText={setNote}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
                <TouchableOpacity
                  style={[
                    modal.confirmBtn,
                    !isDeposit && modal.withdrawBtn,
                    isSubmitting && { opacity: 0.7 },
                  ]}
                  onPress={handleConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={modal.confirmText}>
                      {isDeposit ? "Add to Goal" : "Withdraw"}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={modal.cancelBtn}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={modal.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "transactions">(
    "overview",
  );
  const [modalType, setModalType] = useState<ModalType>(null);

  const loadGoal = useCallback(
    async (showRefresh = false) => {
      if (!token || !id) return;
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const data = await goalsAPI.getOne(token, id as string);
        setGoal(data.goal);
        setTransactions(data.transactions);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Could not load goal.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, id],
  );

  useFocusEffect(
    useCallback(() => {
      loadGoal();
    }, [loadGoal]),
  );

  const handleAction = async (amount: string, note: string) => {
    if (!token || !goal) return;
    setIsSubmitting(true);
    try {
      if (modalType === "deposit") {
        const res = await transactionsAPI.deposit(token, {
          goalId: goal._id,
          amount: parseFloat(amount),
          note,
        });
        if (res.goalCompleted) {
          // Goal is done — cancel all reminders
          await cancelGoalReminder(goal._id);
          Alert.alert(
            "Goal Completed! 🎉",
            `You've reached your savings goal for "${goal.title}"!`,
          );
        } else {
          // Reset the missed payment nudge timer since they just saved
          await scheduleMissedPaymentNudge({
            _id: goal._id,
            title: goal.title,
            savingPlan: goal.savingPlan,
          });
          Alert.alert("Done!", `$${amount} added successfully.`);
        }
      } else {
        await transactionsAPI.withdraw(token, {
          goalId: goal._id,
          amount: parseFloat(amount),
          note,
        });
        Alert.alert("Done!", `$${amount} withdrawn successfully.`);
      }
      setModalType(null);
      loadGoal();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Transaction failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!token || !goal) return;
    Alert.alert("Delete goal?", "This will also delete all transactions.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await goalsAPI.delete(token, goal._id);
            // Cancel notifications so they don't fire for a deleted goal
            await cancelGoalReminder(goal._id);
            router.replace("/(tabs)/goals");
          } catch (err: any) {
            Alert.alert("Error", err.message || "Could not delete goal.");
          }
        },
      },
    ]);
  };

  if (isLoading || !goal) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator
          color={Colors.primary}
          style={{ flex: 1, marginTop: 80 }}
        />
      </SafeAreaView>
    );
  }

  const pct = Math.min(
    Math.round((goal.currentAmount / goal.targetAmount) * 100),
    100,
  );
  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {goal.title}
        </Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push(`/goal/edit/${goal._id}` as any)}
        >
          <Ionicons name="create-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadGoal(true)}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          {goal.imageUrl ? (
            <Image source={{ uri: goal.imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Text style={styles.heroEmoji}>🎯</Text>
            </View>
          )}
          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroTitle}>{goal.title}</Text>
                <Text style={styles.heroCat}>
                  {goal.category ? `${goal.category} · ` : ""}
                  {goal.savingPlan}
                </Text>
              </View>
              {pct >= 100 && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓ Done!</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroAmount}>
              ${goal.currentAmount.toLocaleString()}
            </Text>
            <Text style={styles.heroSub}>
              of ${goal.targetAmount.toLocaleString()} goal
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>{pct}% saved</Text>
              <Text style={styles.progressLabel}>
                ${remaining.toLocaleString()} to go
              </Text>
            </View>
            {goal.deadline && (
              <View style={styles.deadlineRow}>
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.deadlineText}>
                  Due {goal.deadline.split("T")[0]}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionDeposit}
            onPress={() => setModalType("deposit")}
            disabled={goal.status === "completed"}
          >
            <Ionicons name="add-circle" size={20} color={Colors.white} />
            <Text style={styles.actionDepositText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionSecondary}
            onPress={() => setModalType("withdraw")}
          >
            <Ionicons
              name="remove-circle-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.actionSecondaryText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionSecondary}
            onPress={() =>
              router.push(`/goal/transfer?from=${goal._id}` as any)
            }
          >
            <Ionicons name="swap-horizontal" size={20} color={Colors.primary} />
            <Text style={styles.actionSecondaryText}>Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* Product Link */}
        {goal.productUrl ? (
          <TouchableOpacity
            style={styles.productLink}
            onPress={() => Linking.openURL(goal.productUrl!)}
          >
            <Ionicons name="cart-outline" size={18} color={Colors.primary} />
            <Text style={styles.productLinkText}>
              {pct >= 100
                ? "🎉 Ready to buy! Open product link"
                : "View product you're saving for"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        ) : null}

        {/* Tabs */}
        <View style={styles.tabs}>
          {(["overview", "transactions"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === "overview" ? "Overview" : "Transactions"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "overview" ? (
          <View style={styles.tabContent}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>${goal.currentAmount}</Text>
                <Text style={styles.statLabel}>Saved</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>${remaining}</Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{pct}%</Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
            </View>
            {goal.notes ? (
              <View style={styles.notesCard}>
                <Text style={styles.notesLabel}>📝 Notes</Text>
                <Text style={styles.notesText}>{goal.notes}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.dangerBtn} onPress={handleDelete}>
              <Ionicons
                name="trash-outline"
                size={16}
                color={Colors.secondary}
              />
              <Text style={styles.dangerText}>Delete Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tabContent}>
            {transactions.map((tx) => (
              <View key={tx._id} style={styles.txRow}>
                <View
                  style={[
                    styles.txIcon,
                    tx.type === "deposit"
                      ? styles.depositIcon
                      : styles.withdrawIcon,
                  ]}
                >
                  <Ionicons
                    name={tx.type === "deposit" ? "arrow-down" : "arrow-up"}
                    size={16}
                    color={
                      tx.type === "deposit" ? Colors.success : Colors.secondary
                    }
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txNote}>
                    {tx.note ||
                      (tx.type === "deposit" ? "Deposit" : "Withdrawal")}
                  </Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    tx.type === "withdrawal" && styles.withdrawAmount,
                  ]}
                >
                  {tx.type === "deposit" ? "+" : "-"}${tx.amount}
                </Text>
              </View>
            ))}
            {transactions.length === 0 && (
              <Text style={styles.emptyText}>
                No transactions yet. Start saving! 🐷
              </Text>
            )}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      <ActionModal
        visible={modalType !== null}
        type={modalType}
        onClose={() => setModalType(null)}
        onConfirm={handleAction}
        isSubmitting={isSubmitting}
      />
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
    paddingTop: 12,
    paddingBottom: 8,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.primary,
  },
  heroImage: { width: "100%", height: 140 },
  heroImagePlaceholder: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  heroEmoji: { fontSize: 48 },
  heroContent: { padding: 20 },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: Colors.white },
  heroCat: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    textTransform: "capitalize",
  },
  completedBadge: {
    backgroundColor: Colors.success,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  completedText: { color: Colors.white, fontSize: 12, fontWeight: "800" },
  heroAmount: {
    fontSize: 46,
    fontWeight: "800",
    color: Colors.white,
    lineHeight: 52,
  },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 16 },
  progressTrack: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.white,
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
  },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  deadlineText: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
  },
  actionDeposit: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  actionDepositText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  actionSecondary: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  actionSecondaryText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  productLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
  },
  productLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  tabContent: { marginHorizontal: 20, marginTop: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginTop: 2,
  },
  notesCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  notesText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 14,
  },
  dangerText: { fontSize: 14, fontWeight: "700", color: Colors.secondary },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  depositIcon: { backgroundColor: "#DCFCE7" },
  withdrawIcon: { backgroundColor: "#FFE4E6" },
  txInfo: { flex: 1 },
  txNote: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  txDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: "800", color: Colors.success },
  withdrawAmount: { color: Colors.secondary },
  emptyText: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
    paddingVertical: 32,
  },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
  amountRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  dollarSign: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: "800",
    color: Colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 8,
  },
  keyboardDoneBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 10,
  },
  keyboardDoneText: { color: Colors.primary, fontWeight: "700", fontSize: 14 },
  noteInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  withdrawBtn: { backgroundColor: Colors.secondary },
  confirmText: { color: Colors.white, fontSize: 16, fontWeight: "800" },
  cancelBtn: { alignItems: "center", paddingVertical: 10 },
  cancelText: { fontSize: 15, color: Colors.textSecondary, fontWeight: "600" },
});
