import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    // AuthProvider wraps everything so all screens can access auth state
    <AuthProvider>
      <StatusBar style="dark" />
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
    </AuthProvider>
  );
}
