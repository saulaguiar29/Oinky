import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useState, useMemo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme, ColorPalette } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Info", "Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)/dashboard");
    } catch (error: any) {
      const msg = firebaseErrorMessage(error.code);
      Alert.alert("Login Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Logo / Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="pig-variant" size={64} color={colors.primary} />
        <Text style={styles.appName}>Oinky</Text>
        <Text style={styles.tagline}>Save smarter, spend better</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!isSubmitting}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
          onSubmitEditing={handleLogin}
          returnKeyType="go"
        />

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>
              Don't have an account?{" "}
              <Text style={styles.linkBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

function firebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      justifyContent: "center",
      paddingHorizontal: 28,
    },
    header: {
      alignItems: "center",
      marginBottom: 48,
    },
    appName: {
      fontSize: 36,
      fontWeight: "800",
      color: c.primary,
      letterSpacing: -1,
    },
    tagline: {
      fontSize: 15,
      color: c.textSecondary,
      marginTop: 4,
    },
    form: {
      gap: 14,
    },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 14,
      fontSize: 16,
      color: c.textPrimary,
    },
    button: {
      backgroundColor: c.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 4,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: c.white,
      fontSize: 16,
      fontWeight: "700",
    },
    linkButton: {
      alignItems: "center",
      paddingVertical: 8,
    },
    linkText: {
      color: c.textSecondary,
      fontSize: 14,
    },
    linkBold: {
      color: c.primary,
      fontWeight: "700",
    },
  });
}
