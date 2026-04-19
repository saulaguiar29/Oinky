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
import { Link, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { useCallback, useState, useMemo } from "react";
import { useTheme, ColorPalette } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { goalsAPI } from "../../services/api";
import { getPaymentPlan, formatShortDate } from "../../services/paymentPlan";

type Goal = {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  savingPlan: string;
  deadline?: string;
  imageUrl?: string | null;
  productUrl?: string | null;
};

export default function GoalsScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>My Goals</Text>
          <Link href="/goal/create" asChild>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add" size={22} color={colors.white} />
            </TouchableOpacity>
          </Link>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Active Goals */}
            <Text style={styles.sectionLabel}>Active ({active.length})</Text>
            {active.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No active goals. Create one!</Text>
              </View>
            ) : (
              active.map((goal) => (
                <View key={goal._id} style={styles.cardWrapper}>
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
                          {(() => {
                            const plan = getPaymentPlan(goal);
                            if (!plan) {
                              return goal.deadline ? null : (
                                <Text style={styles.cardPaymentHint}>
                                  Add a deadline to see your payment plan
                                </Text>
                              );
                            }
                            return (
                              <View style={styles.cardPaymentRow}>
                                <Ionicons name="calendar-outline" size={11} color={colors.primary} />
                                <Text style={styles.cardPayment}>
                                  Save ${plan.amountPerPeriod.toFixed(2)}/{plan.periodLabel}
                                  {" · "}{plan.periodsLeft} left
                                  {" · "}{formatShortDate(plan.deadlineDate)}
                                </Text>
                              </View>
                            );
                          })()}
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
              ))
            )}

            {/* Completed Goals */}
            {completed.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
                  Completed ({completed.length})
                </Text>
                {completed.map((goal) => (
                  <View key={goal._id} style={styles.cardWrapper}>
                    <Link href={`/goal/${goal._id}`} asChild>
                      <TouchableOpacity style={[styles.card, styles.completedCard]}>
                        <View style={styles.cardRow}>
                          {goal.imageUrl ? (
                            <Image source={{ uri: goal.imageUrl }} style={styles.thumbnail} />
                          ) : (
                            <View style={styles.thumbnailPlaceholder}>
                              <MaterialCommunityIcons name="pig-variant" size={28} color={colors.primary} />
                            </View>
                          )}
                          <View style={styles.cardContent}>
                            <View style={styles.cardTop}>
                              <Text style={styles.cardTitle}>{goal.title}</Text>
                              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            </View>
                            <Text style={styles.completedSub}>
                              ${goal.targetAmount} saved ✓
                            </Text>
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
    title: { fontSize: 28, fontWeight: "800", color: c.textPrimary },
    addBtn: {
      backgroundColor: c.primary,
      borderRadius: 12,
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textSecondary,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    cardWrapper: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 8,
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
    completedCard: { opacity: 0.75 },
    cardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    cardTitle: { fontSize: 16, fontWeight: "700", color: c.textPrimary },
    cardPlan: {
      fontSize: 12,
      color: c.primary,
      fontWeight: "600",
      textTransform: "capitalize",
      backgroundColor: c.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    progressTrack: {
      height: 8,
      backgroundColor: c.primaryLight,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 10,
    },
    progressFill: {
      height: "100%",
      backgroundColor: c.primary,
      borderRadius: 4,
    },
    cardBottom: { flexDirection: "row", justifyContent: "space-between" },
    cardSaved: { fontSize: 13, fontWeight: "600", color: c.textPrimary },
    cardPct: { fontSize: 13, color: c.textSecondary },
    cardPaymentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
      backgroundColor: c.primaryLight,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
      alignSelf: "flex-start",
    },
    cardPayment: { fontSize: 11, fontWeight: "600", color: c.primary },
    cardPaymentHint: { fontSize: 11, color: c.textSecondary, marginTop: 6, fontStyle: "italic" },
    completedSub: { fontSize: 14, color: c.success, fontWeight: "600" },
    linkBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: c.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: { paddingVertical: 24, alignItems: "center" },
    emptyText: { fontSize: 14, color: c.textSecondary },
  });
}
