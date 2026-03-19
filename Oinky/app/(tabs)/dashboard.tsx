import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { Colors } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { goalsAPI } from "../../services/api";

type Goal = {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────
function GoalCard({ goal }: { goal: Goal }) {
  const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100);
  return (
    <Link href={`/goal/${goal._id}`} asChild>
      <TouchableOpacity style={styles.card}>
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
      </TouchableOpacity>
    </Link>
  );
}

// ─── Savings Breakdown Chart ──────────────────────────────────────────────────
function SavingsBreakdownChart({ goals }: { goals: Goal[] }) {
  if (goals.length === 0) return null;

  return (
    <View style={chartStyles.container}>
      <Text style={chartStyles.title}>Savings Breakdown</Text>
      {goals.map((goal) => {
        const pct = Math.min(
          (goal.currentAmount / goal.targetAmount) * 100,
          100,
        );
        return (
          <View key={goal._id} style={chartStyles.row}>
            <Text style={chartStyles.label} numberOfLines={1}>
              {goal.title}
            </Text>
            <View style={chartStyles.barTrack}>
              <View style={[chartStyles.barFill, { width: `${pct}%` }]} />
            </View>
            <Text style={chartStyles.pct}>{Math.round(pct)}%</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Dashboard Screen
export default function DashboardScreen() {
  const { user, token } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadGoals = useCallback(
    async (showRefresh = false) => {
      if (!token) return;
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const data = await goalsAPI.getAll(token, "active");
        setGoals(data.goals);
        setTotalSaved(data.totalSaved);
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
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hey {displayName} 👋</Text>
            <Text style={styles.subGreeting}>Here's your savings overview</Text>
          </View>
          <Text style={styles.piggy}>🐷</Text>
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

        {/* ── Savings Breakdown Chart (shows after data loads) ── */}
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
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 32 }} />
        ) : activeGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🐷</Text>
            <Text style={styles.emptyText}>No active goals yet.</Text>
            <Text style={styles.emptySub}>Tap below to create your first!</Text>
          </View>
        ) : (
          activeGoals.map((goal) => <GoalCard key={goal._id} goal={goal} />)
        )}

        {/* Add Goal Button */}
        <Link href="/goal/create" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle" size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Add New Goal</Text>
          </TouchableOpacity>
        </Link>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 24,
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  subGreeting: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  piggy: { fontSize: 40 },
  totalCard: {
    backgroundColor: Colors.primary,
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
    color: Colors.white,
    marginTop: 4,
  },
  totalSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  seeAll: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  completedBadge: {
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  completedText: { fontSize: 11, color: Colors.white, fontWeight: "700" },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  cardAmount: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  cardPct: { fontSize: 13, color: Colors.textSecondary },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  addButtonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  emptySub: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
});

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
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
    color: Colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  pct: {
    width: 36,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "right",
  },
});
