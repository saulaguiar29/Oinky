import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

function AppStack() {
  const { isDark } = useTheme();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const goalId = response.notification.request.content.data?.goalId;
        if (goalId) {
          router.push(`/goal/${goalId}`);
        }
      },
    );
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="goal/[id]"
          options={{
            headerShown: true,
            title: "Goal Details",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="goal/create"
          options={{
            headerShown: true,
            title: "New Goal",
            headerBackTitle: "Back",
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppStack />
      </AuthProvider>
    </ThemeProvider>
  );
}
