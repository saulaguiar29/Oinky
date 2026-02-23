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

const MOCK_GOALS = [
  {
    _id: "1",
    title: "PS5",
    targetAmount: 500,
    currentAmount: 175,
    status: "active",
    savingPlan: "monthly",
    deadline: "2025-06-01",
  },
  {
    _id: "2",
    title: "Japan Trip",
    targetAmount: 2000,
    currentAmount: 640,
    status: "active",
    savingPlan: "weekly",
    deadline: "2025-12-01",
  },
  {
    _id: "3",
    title: "AirPods Pro",
    targetAmount: 250,
    currentAmount: 250,
    status: "completed",
    savingPlan: "monthly",
    deadline: "2025-02-01",
  },
];

export default function GoalsScreen() {
  const active = MOCK_GOALS.filter((g) => g.status === "active");
  const completed = MOCK_GOALS.filter((g) => g.status === "completed");

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>My Goals</Text>
          <Link href="./goal/create" asChild>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={22} color={Colors.white} />
            </TouchableOpacity>
          </Link>
        </View>

        {/* Active Goals */}
        <Text style={styles.sectionLabel}>Active ({active.length})</Text>
        {active.map((goal) => (
          <Link key={goal._id} href={`./goal/${goal._id}`} asChild>
            <TouchableOpacity style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{goal.title}</Text>
                <Text style={styles.cardPlan}>{goal.savingPlan}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.cardSaved}>
                  ${goal.currentAmount} / ${goal.targetAmount}
                </Text>
                <Text style={styles.cardPct}>
                  {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        ))}

        {/* Completed Goals */}
        {completed.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
              Completed ({completed.length})
            </Text>
            {completed.map((goal) => (
              <View key={goal._id} style={[styles.card, styles.completedCard]}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{goal.title}</Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={Colors.success}
                  />
                </View>
                <Text style={styles.completedSub}>
                  ${goal.targetAmount} saved ✓
                </Text>
              </View>
            ))}
          </>
        )}

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
  title: { fontSize: 28, fontWeight: "800", color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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
  completedCard: { opacity: 0.75 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  cardPlan: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
    textTransform: "capitalize",
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
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
  cardBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardSaved: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  cardPct: { fontSize: 13, color: Colors.textSecondary },
  completedSub: { fontSize: 14, color: Colors.success, fontWeight: "600" },
});
