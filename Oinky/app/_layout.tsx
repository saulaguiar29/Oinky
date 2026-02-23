import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
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
    </>
  );
}
