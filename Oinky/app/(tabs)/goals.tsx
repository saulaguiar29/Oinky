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
import { Link, useFocusEffect } from "expo-router";
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
  savingPlan: string;
  deadline?: string;
};

export default function GoalsScreen() {
  const { token } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadGoals = useCallback(
    async (showRefresh = false) => {
      if (!token) return;
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const data = await goalsAPI.getAll(token);
        setGoals(data.goals);
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

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");

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
          <Text style={styles.title}>My Goals</Text>
          <Link href="/goal/create" asChild>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={22} color={Colors.white} />
            </TouchableOpacity>
          </Link>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Active Goals */}
            <Text style={styles.sectionLabel}>Active ({active.length})</Text>
            {active.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No active goals. Create one! 🐷
                </Text>
              </View>
            ) : (
              active.map((goal) => (
                <Link key={goal._id} href={`/goal/${goal._id}`} asChild>
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
                        {Math.round(
                          (goal.currentAmount / goal.targetAmount) * 100,
                        )}
                        %
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              ))
            )}

            {/* Completed Goals */}
            {completed.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
                  Completed ({completed.length})
                </Text>
                {completed.map((goal) => (
                  <Link key={goal._id} href={`/goal/${goal._id}`} asChild>
                    <TouchableOpacity
                      style={[styles.card, styles.completedCard]}
                    >
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
                    </TouchableOpacity>
                  </Link>
                ))}
              </>
            )}
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
  emptyState: { paddingVertical: 24, alignItems: "center" },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
