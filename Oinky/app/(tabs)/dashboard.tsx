import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants";

// Mock data — will be replaced with real API calls in Week 7/8
const MOCK_GOALS = [
  {
    _id: "1",
    title: "PS5",
    targetAmount: 500,
    currentAmount: 175,
    status: "active",
  },
  {
    _id: "2",
    title: "Japan Trip",
    targetAmount: 2000,
    currentAmount: 640,
    status: "active",
  },
  {
    _id: "3",
    title: "AirPods Pro",
    targetAmount: 250,
    currentAmount: 250,
    status: "completed",
  },
];

const totalSaved = MOCK_GOALS.filter((g) => g.status === "active").reduce(
  (sum, g) => sum + g.currentAmount,
  0,
);

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  );
}

function GoalCard({ goal }: { goal: (typeof MOCK_GOALS)[0] }) {
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

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hey there 👋</Text>
            <Text style={styles.subGreeting}>Here's your savings overview</Text>
          </View>
          <Text style={styles.piggy}>🐷</Text>
        </View>

        {/* Total Saved Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Saved</Text>
          <Text style={styles.totalAmount}>${totalSaved.toLocaleString()}</Text>
          <Text style={styles.totalSub}>
            across {MOCK_GOALS.filter((g) => g.status === "active").length}{" "}
            active goals
          </Text>
        </View>

        {/* Goals Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Goals</Text>
          <Link href="/(tabs)/goals" asChild>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {MOCK_GOALS.filter((g) => g.status === "active").map((goal) => (
          <GoalCard key={goal._id} goal={goal} />
        ))}

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
});
