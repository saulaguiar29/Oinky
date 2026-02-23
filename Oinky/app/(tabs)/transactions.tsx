import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants";

const MOCK_TRANSACTIONS = [
  {
    _id: "t1",
    type: "deposit",
    amount: 50,
    goalTitle: "PS5",
    note: "Birthday money",
    createdAt: "2025-04-10",
  },
  {
    _id: "t2",
    type: "deposit",
    amount: 100,
    goalTitle: "Japan Trip",
    note: "Weekly save",
    createdAt: "2025-04-09",
  },
  {
    _id: "t3",
    type: "withdrawal",
    amount: 25,
    goalTitle: "PS5",
    note: "Needed cash",
    createdAt: "2025-04-07",
  },
  {
    _id: "t4",
    type: "deposit",
    amount: 250,
    goalTitle: "AirPods Pro",
    note: "Final payment",
    createdAt: "2025-04-01",
  },
];

export default function TransactionsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Activity</Text>

        {MOCK_TRANSACTIONS.map((tx) => (
          <View key={tx._id} style={styles.row}>
            <View
              style={[
                styles.icon,
                tx.type === "deposit"
                  ? styles.depositIcon
                  : styles.withdrawIcon,
              ]}
            >
              <Ionicons
                name={tx.type === "deposit" ? "arrow-down" : "arrow-up"}
                size={18}
                color={
                  tx.type === "deposit" ? Colors.success : Colors.secondary
                }
              />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{tx.goalTitle}</Text>
              <Text style={styles.rowNote}>
                {tx.note} · {tx.createdAt}
              </Text>
            </View>
            <Text
              style={[
                styles.rowAmount,
                tx.type === "withdrawal" && styles.withdrawAmount,
              ]}
            >
              {tx.type === "deposit" ? "+" : "-"}${tx.amount}
            </Text>
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 20 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    paddingTop: 24,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  depositIcon: { backgroundColor: "#DCFCE7" },
  withdrawIcon: { backgroundColor: "#FFE4E6" },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  rowNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rowAmount: { fontSize: 16, fontWeight: "700", color: Colors.success },
  withdrawAmount: { color: Colors.secondary },
});
