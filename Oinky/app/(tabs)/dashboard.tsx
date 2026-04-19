import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { useCallback, useState, useMemo } from "react";
import { useTheme, ColorPalette } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { goalsAPI, plaidAPI } from "../../services/api";

type Goal = {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  imageUrl?: string | null;
  productUrl?: string | null;
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, target }: { current: number; target: number }) {
  const { colors } = useTheme();
  const pct = Math.min((current / target) * 100, 100);
  return (
    <View style={{ height: 8, backgroundColor: colors.primaryLight, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
      <View style={{ height: "100%", width: `${pct}%`, backgroundColor: colors.primary, borderRadius: 4 }} />
    </View>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────
function GoalCard({ goal }: { goal: Goal }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeCardStyles(colors), [colors]);
  const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
  return (
    <View style={styles.cardWrapper}>
      <Link href={`/goal/${goal._id}`} asChild>
        <TouchableOpacity style={styles.card}>
          <View style={styles.cardRow}>
            {goal.imageUrl ? (
              <Image source={{ uri: goal.imageUrl }} style={styles.thumbnail} />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <MaterialCommunityIcons name="pig-variant" size={28} color={colors.primary} />
              </View>
            )}
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{goal.title}</Text>
                {goal.status === "completed" && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓ Done</Text>
                  </View>
                )}
              </View>
              <ProgressBar current={goal.currentAmount} target={goal.targetAmount} />
              <View style={styles.cardFooter}>
                <Text style={styles.cardAmount}>
                  ${goal.currentAmount.toLocaleString()} saved
                </Text>
                <Text style={styles.cardPct}>
                  {pct}% of ${goal.targetAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
      {goal.productUrl && (
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => Linking.openURL(goal.productUrl!)}
        >
          <Ionicons name="cart-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Bank Balance Card ────────────────────────────────────────────────────────
type PlaidAccount = {
  account_id: string;
  name: string;
  subtype: string;
  balances: { available: number | null; current: number | null };
};

function BankBalanceCard({ accounts }: { accounts: PlaidAccount[] }) {
  const { colors } = useTheme();
  if (accounts.length === 0) return null;

  const totalAvailable = accounts.reduce(
    (sum, a) => sum + (a.balances.available ?? a.balances.current ?? 0),
    0,
  );

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Ionicons name="business-outline" size={18} color={colors.primary} />
        <Text style={{ fontSize: 15, fontWeight: "800", color: colors.textPrimary }}>
          Linked Bank
        </Text>
      </View>
      <Text
        style={{
          fontSize: 32,
          fontWeight: "800",
          color: colors.success,
          marginBottom: 4,
        }}
      >
        ${totalAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
        Available balance
      </Text>
      {accounts.map((acct) => (
        <View
          key={acct.account_id}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 6,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.textSecondary, textTransform: "capitalize" }}>
            {acct.name} · {acct.subtype}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary }}>
            ${(acct.balances.available ?? acct.balances.current ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Savings Breakdown Chart ──────────────────────────────────────────────────
function SavingsBreakdownChart({ goals }: { goals: Goal[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeChartStyles(colors), [colors]);
  if (goals.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Savings Breakdown</Text>
      {goals.map((goal) => {
        const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
        return (
          <View key={goal._id} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {goal.title}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.pct}>{Math.round(pct)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<PlaidAccount[]>([]);

  const loadGoals = useCallback(
    async (showRefresh = false) => {
      if (!token) return;
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const [goalsData, balanceData] = await Promise.all([
          goalsAPI.getAll(token, "active"),
          plaidAPI.getBalance(token).catch(() => ({ linked: false, accounts: [] })),
        ]);
        setGoals(goalsData.goals);
        setTotalSaved(goalsData.totalSaved);
        if (balanceData.linked) setBankAccounts(balanceData.accounts);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Could not load goals.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals]),
  );

  const displayName = user?.displayName?.split(" ")[0] || "there";
  const activeGoals = goals.filter((g) => g.status === "active");

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadGoals(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hey {displayName}</Text>
            <Text style={styles.subGreeting}>Here's your savings overview</Text>
          </View>
          <MaterialCommunityIcons name="pig-variant" size={40} color={colors.primary} />
        </View>

        {/* Total Saved Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Saved</Text>
          <Text style={styles.totalAmount}>${totalSaved.toLocaleString()}</Text>
          <Text style={styles.totalSub}>
            across {activeGoals.length} active goal
            {activeGoals.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {!isLoading && <BankBalanceCard accounts={bankAccounts} />}
        {!isLoading && <SavingsBreakdownChart goals={activeGoals} />}

        {/* Active Goals Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          <Link href="/(tabs)/goals" asChild>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : activeGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="pig-variant" size={48} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>No active goals yet.</Text>
            <Text style={styles.emptySub}>Tap below to create your first!</Text>
          </View>
        ) : (
          activeGoals.map((goal) => <GoalCard key={goal._id} goal={goal} />)
        )}

        {/* Add Goal Button */}
        <Link href="/goal/create" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle" size={20} color={colors.white} />
            <Text style={styles.addButtonText}>Add New Goal</Text>
          </TouchableOpacity>
        </Link>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    container: { flex: 1, paddingHorizontal: 20 },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 24,
      marginBottom: 20,
    },
    greeting: { fontSize: 22, fontWeight: "800", color: c.textPrimary },
    subGreeting: { fontSize: 14, color: c.textSecondary, marginTop: 2 },
    totalCard: {
      backgroundColor: c.primary,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
    },
    totalLabel: {
      fontSize: 13,
      color: "rgba(255,255,255,0.75)",
      fontWeight: "600",
    },
    totalAmount: {
      fontSize: 42,
      fontWeight: "800",
      color: c.white,
      marginTop: 4,
    },
    totalSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: c.textPrimary },
    seeAll: { fontSize: 14, color: c.primary, fontWeight: "600" },
    addButton: {
      backgroundColor: c.primary,
      borderRadius: 14,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
    },
    addButtonText: { color: c.white, fontSize: 16, fontWeight: "700" },
    emptyState: { alignItems: "center", paddingVertical: 40 },
    emptyText: { fontSize: 16, fontWeight: "700", color: c.textPrimary },
    emptySub: { fontSize: 14, color: c.textSecondary, marginTop: 4 },
  });
}

function makeCardStyles(c: ColorPalette) {
  return StyleSheet.create({
    cardWrapper: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 8,
    },
    linkBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: c.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 12,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    thumbnail: {
      width: 60,
      height: 60,
      borderRadius: 12,
    },
    thumbnailPlaceholder: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: c.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    cardContent: { flex: 1 },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    cardTitle: { fontSize: 16, fontWeight: "700", color: c.textPrimary },
    completedBadge: {
      backgroundColor: c.success,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    completedText: { fontSize: 11, color: c.white, fontWeight: "700" },
    cardFooter: { flexDirection: "row", justifyContent: "space-between" },
    cardAmount: { fontSize: 13, fontWeight: "600", color: c.textPrimary },
    cardPct: { fontSize: 13, color: c.textSecondary },
  });
}

function makeChartStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
    },
    title: {
      fontSize: 16,
      fontWeight: "800",
      color: c.textPrimary,
      marginBottom: 16,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 10,
    },
    label: {
      width: 90,
      fontSize: 12,
      fontWeight: "600",
      color: c.textSecondary,
    },
    barTrack: {
      flex: 1,
      height: 10,
      backgroundColor: c.primaryLight,
      borderRadius: 5,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      backgroundColor: c.primary,
      borderRadius: 5,
    },
    pct: {
      width: 36,
      fontSize: 12,
      fontWeight: "700",
      color: c.textPrimary,
      textAlign: "right",
    },
  });
}
