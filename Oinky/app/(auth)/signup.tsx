import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Colors } from "../../constants";
import { useAuth } from "../../context/AuthContext";

export default function SignupScreen() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    // Validate all fields
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords Don't Match",
        "Make sure both passwords are the same.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(name.trim(), email.trim(), password);
      router.replace("/(tabs)/dashboard");
    } catch (error: any) {
      const msg = firebaseErrorMessage(error.code);
      Alert.alert("Sign Up Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🐷</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start saving toward your goals</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            editable={!isSubmitting}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!isSubmitting}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isSubmitting}
          />
          <TextInput
            style={[
              styles.input,
              // Highlight if passwords typed and don't match
              confirmPassword.length > 0 && password !== confirmPassword
                ? styles.inputError
                : null,
            ]}
            placeholder="Confirm Password"
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isSubmitting}
            onSubmitEditing={handleSignup}
            returnKeyType="go"
          />
          {/* Inline password mismatch hint */}
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <Text style={styles.errorHint}>Passwords don't match</Text>
          )}

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkButton}>
              <Text style={styles.linkText}>
                Already have an account?{" "}
                <Text style={styles.linkBold}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Maps Firebase error codes to friendly messages
function firebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger password.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    fontSize: 52,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.secondary,
  },
  errorHint: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: "600",
    marginTop: -8,
    marginLeft: 4,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  linkBold: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
