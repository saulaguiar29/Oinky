import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { Colors } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { requestNotificationPermission } from "../../services/notifications";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert("Permission denied", "Enable notifications in Settings.");
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🐷 Test notification!",
        body: "Oinky notifications are working correctly.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        repeats: false,
      },
    });
    Alert.alert("Scheduled!", "A test notification will fire in 5 seconds. Background the app to see it.");
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  // Use Firebase display name / email, fallback to placeholders
  const displayName = user?.displayName || "Oinky User";
  const email = user?.email || "";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>

        {/* Menu Items */}
        <View style={styles.menu}>
          {[
            { icon: "flag-outline", label: "My Goals" },
            { icon: "receipt-outline", label: "Transaction History" },
            { icon: "notifications-outline", label: "Notifications" },
            { icon: "moon-outline", label: "Dark Mode" },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem}>
              <Ionicons
                name={item.icon as any}
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* TEST ONLY — remove before shipping */}
        <TouchableOpacity style={styles.testBtn} onPress={handleTestNotification}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          <Text style={styles.testBtnText}>Test Notification (5s)</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.secondary} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: Colors.white },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  menu: { gap: 4 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    marginTop: 24,
    justifyContent: "center",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: Colors.secondary },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
  },
  testBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
