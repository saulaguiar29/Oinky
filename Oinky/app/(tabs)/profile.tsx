import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState, useCallback } from "react";
import * as Notifications from "expo-notifications";
import {
  create as plaidCreate,
  open as plaidOpen,
  destroy as plaidDestroy,
  LinkSuccess,
  LinkExit,
} from "react-native-plaid-link-sdk";
import { useTheme, ColorPalette } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { requestNotificationPermission } from "../../services/notifications";
import { plaidAPI } from "../../services/api";

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [isLinked, setIsLinked] = useState(false);
  const [isLinkLoading, setIsLinkLoading] = useState(false);

  const handleOpenLink = useCallback(async () => {
    if (!token) return;
    setIsLinkLoading(true);
    try {
      const data = await plaidAPI.createLinkToken(token);
      await plaidDestroy();
      plaidCreate({ token: data.link_token });
      plaidOpen({
        onSuccess: async (success: LinkSuccess) => {
          try {
            await plaidAPI.exchangeToken(token, success.publicToken);
            setIsLinked(true);
            Alert.alert("Bank Linked!", "Your bank account is now connected.");
          } catch (err: any) {
            Alert.alert("Error", err.message || "Could not link bank account.");
          }
        },
        onExit: (_exit: LinkExit) => {},
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not connect to Plaid.");
    } finally {
      setIsLinkLoading(false);
    }
  }, [token]);

  const handleUnlink = () => {
    Alert.alert("Unlink Bank", "Remove your linked bank account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlink",
        style: "destructive",
        onPress: async () => {
          if (!token) return;
          await plaidAPI.unlink(token);
          setIsLinked(false);
        },
      },
    ]);
  };

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

  const displayName = user?.displayName || "Oinky User";
  const email = user?.email || "";
  const initials = displayName.charAt(0).toUpperCase();

  const menuItems = [
    { icon: "flag-outline", label: "My Goals", onPress: () => router.push("/(tabs)/goals") },
    { icon: "receipt-outline", label: "Transaction History", onPress: () => router.push("/(tabs)/transactions") },
    { icon: "notifications-outline", label: "Notifications", onPress: undefined },
    {
      icon: isDark ? "sunny-outline" : "moon-outline",
      label: isDark ? "Light Mode" : "Dark Mode",
      onPress: toggleTheme,
    },
  ];

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
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bank Account */}
        <View style={styles.bankSection}>
          <Text style={styles.bankSectionTitle}>Bank Account</Text>
          {isLinked ? (
            <TouchableOpacity style={styles.bankLinkedRow} onPress={handleUnlink}>
              <View style={styles.bankLinkedLeft}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={styles.bankLinkedText}>Bank account linked</Text>
              </View>
              <Text style={styles.bankUnlinkText}>Unlink</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.bankLinkBtn}
              onPress={handleOpenLink}
              disabled={isLinkLoading}
            >
              {isLinkLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="link-outline" size={20} color={colors.white} />
                  <Text style={styles.bankLinkBtnText}>Link Bank Account</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          <Text style={styles.bankHint}>
            Sandbox: use username <Text style={{ fontWeight: "700" }}>user_good</Text> / password <Text style={{ fontWeight: "700" }}>pass_good</Text>
          </Text>
        </View>

        {/* TEST ONLY — remove before shipping */}
        <TouchableOpacity style={styles.testBtn} onPress={handleTestNotification}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          <Text style={styles.testBtnText}>Test Notification (5s)</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.secondary} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: c.textPrimary,
      marginBottom: 24,
    },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: 12,
    },
    avatarText: { fontSize: 32, fontWeight: "800", color: c.white },
    name: {
      fontSize: 20,
      fontWeight: "700",
      color: c.textPrimary,
      textAlign: "center",
    },
    email: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: "center",
      marginBottom: 32,
    },
    menu: { gap: 4 },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 4,
    },
    menuLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: c.textPrimary,
    },
    bankSection: {
      marginTop: 24,
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
    },
    bankSectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    bankLinkedRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    bankLinkedLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    bankLinkedText: { fontSize: 15, fontWeight: "600", color: c.textPrimary },
    bankUnlinkText: { fontSize: 13, fontWeight: "600", color: c.secondary },
    bankLinkBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.primary,
      borderRadius: 12,
      padding: 14,
      minHeight: 48,
    },
    bankLinkBtnText: { fontSize: 15, fontWeight: "700", color: c.white },
    bankHint: {
      fontSize: 11,
      color: c.textSecondary,
      marginTop: 10,
      textAlign: "center",
    },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 16,
      marginTop: 24,
      justifyContent: "center",
    },
    logoutText: { fontSize: 15, fontWeight: "700", color: c.secondary },
    testBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: c.primary,
      borderRadius: 14,
      padding: 16,
      marginTop: 24,
    },
    testBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  });
}
