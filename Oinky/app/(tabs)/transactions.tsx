import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState, useMemo } from "react";
import { useTheme, ColorPalette } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { transactionsAPI } from "../../services/api";

type Transaction = {
  _id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  note?: string;
  createdAt: string;
  goalId: { _id: string; title: string } | null;
};

function groupByDate(transactions: Transaction[]): { label: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  for (const tx of transactions) {
    const d = new Date(tx.createdAt);
    let label: string;
    if (d.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(tx);
  }

  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

export default function ActivityScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(
    async (showRefresh = false) => {
      if (!token) return;
      if (showRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const data = await transactionsAPI.getAll(token);
        setTransactions(data.transactions);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Could not load activity.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totalDeposited = transactions
    .filter((t) => t.type === "deposit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = transactions
    .filter((t) => t.type === "withdrawal")
    .reduce((sum, t) => sum + t.amount, 0);

  const groups = groupByDate(transactions);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Activity</Text>
        </View>

        {/* Summary Cards */}
        {!isLoading && transactions.length > 0 && (
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryCardGreen]}>
              <Ionicons name="arrow-down-circle" size={22} color={colors.success} />
              <Text style={styles.summaryAmount}>
                ${totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.summaryLabel}>Total Saved</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardRed]}>
              <Ionicons name="arrow-up-circle" size={22} color={colors.secondary} />
              <Text style={[styles.summaryAmount, styles.summaryAmountRed]}>
                ${totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.summaryLabel}>Total Withdrawn</Text>
            </View>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
        ) : transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={52} color={colors.border} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptySub}>
              Deposits and withdrawals across all your goals will appear here.
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.label}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.items.map((tx) => (
                <View key={tx._id} style={styles.txRow}>
                  <View
                    style={[
                      styles.txIcon,
                      tx.type === "deposit" ? styles.depositIcon : styles.withdrawIcon,
                    ]}
                  >
                    <Ionicons
                      name={tx.type === "deposit" ? "arrow-down" : "arrow-up"}
                      size={16}
                      color={tx.type === "deposit" ? colors.success : colors.secondary}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txGoal} numberOfLines={1}>
                      {tx.goalId?.title ?? "Deleted goal"}
                    </Text>
                    <Text style={styles.txNote} numberOfLines={1}>
                      {tx.note || (tx.type === "deposit" ? "Deposit" : "Withdrawal")}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      tx.type === "withdrawal" && styles.txAmountRed,
                    ]}
                  >
                    {tx.type === "deposit" ? "+" : "-"}$
                    {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
            </View>
          ))
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
      paddingTop: 24,
      marginBottom: 20,
    },
    title: { fontSize: 28, fontWeight: "800", color: c.textPrimary },
    summaryRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 24,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      gap: 4,
    },
    summaryCardGreen: { backgroundColor: c.depositBg },
    summaryCardRed: { backgroundColor: c.withdrawBg },
    summaryAmount: {
      fontSize: 18,
      fontWeight: "800",
      color: c.success,
    },
    summaryAmountRed: { color: c.secondary },
    summaryLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: c.textSecondary,
    },
    groupLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: c.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 4,
    },
    txRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
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
    depositIcon: { backgroundColor: c.depositBg },
    withdrawIcon: { backgroundColor: c.withdrawBg },
    txInfo: { flex: 1 },
    txGoal: { fontSize: 14, fontWeight: "700", color: c.textPrimary },
    txNote: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    txAmount: {
      fontSize: 15,
      fontWeight: "800",
      color: c.success,
    },
    txAmountRed: { color: c.secondary },
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: c.textPrimary,
      marginBottom: 6,
    },
    emptySub: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
  });
}
