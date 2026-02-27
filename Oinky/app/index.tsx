import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../constants";

export default function Index() {
  const { user, isLoading } = useAuth();

  // While Firebase is checking if there's an existing session, show a spinner
  // so we don't flash the login screen for already-logged-in users
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // If logged in → go straight to dashboard; otherwise → login
  return <Redirect href={user ? "/(tabs)/dashboard" : "/(auth)/login"} />;
}
