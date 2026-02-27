import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  Linking,
  Alert,
  Modal,
} from "react-native";
import { useState } from "react";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors } from "../../../constants";

const CATEGORIES = [
  { label: "Tech", icon: "💻" },
  { label: "Travel", icon: "✈️" },
  { label: "Fashion", icon: "👟" },
  { label: "Gaming", icon: "🎮" },
  { label: "Home", icon: "🏠" },
  { label: "Health", icon: "💪" },
  { label: "Food", icon: "🍕" },
  { label: "Other", icon: "🎯" },
];

const PLANS = [
  { key: "daily", label: "Daily", icon: "☀️" },
  { key: "biweekly", label: "Bi-Weekly", icon: "📅" },
  { key: "monthly", label: "Monthly", icon: "🗓️" },
];

// Ensures a URL has a scheme so Linking.openURL works correctly
function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

// Format a Date object as YYYY-MM-DD for display
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Parse a YYYY-MM-DD string into a Date (avoids timezone shifting)
function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Mock pre-loaded data — Week 7 will load from goalsAPI.getOne(token, id)
const MOCK_GOAL = {
  _id: "1",
  title: "PS5",
  targetAmount: "500",
  category: "Gaming",
  deadline: "2025-06-01",
  notes: "Been wanting this forever. No more payment plans!",
  productUrl: "https://www.bestbuy.com/site/sony-playstation-5/6523167.p",
  savingPlan: "monthly",
  imageUrl: null as string | null,
};

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams();

  // Pre-fill with existing goal data
  const [title, setTitle] = useState(MOCK_GOAL.title);
  const [targetAmount, setTargetAmount] = useState(MOCK_GOAL.targetAmount);
  const [category, setCategory] = useState(MOCK_GOAL.category);
  // Parse existing deadline string into a Date so the picker can use it
  const [deadline, setDeadline] = useState<Date | null>(
    MOCK_GOAL.deadline ? parseDate(MOCK_GOAL.deadline) : null,
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState(MOCK_GOAL.notes);
  const [productUrl, setProductUrl] = useState(MOCK_GOAL.productUrl);
  const [savingPlan, setSavingPlan] = useState(MOCK_GOAL.savingPlan);
  const [image, setImage] = useState<string | null>(MOCK_GOAL.imageUrl);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow photo access to update goal image.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // Normalize URL before opening so bare domains work
  const handlePreviewLink = () => {
    const normalized = normalizeUrl(productUrl.trim());
    if (!normalized) return;
    Linking.openURL(normalized).catch(() =>
      Alert.alert("Couldn't open link", "Make sure the URL is valid."),
    );
  };

  // Try PayPal app first, fall back to browser if not installed
  const handleConnectPayPal = async () => {
    try {
      await Linking.openURL("paypal://");
    } catch {
      Linking.openURL("https://www.paypal.com");
    }
  };

  const handleSave = () => {
    if (!title || !targetAmount) {
      Alert.alert("Missing info", "Goal name and target amount are required.");
      return;
    }
    // TODO Week 7: call goalsAPI.update(token, id, {
    //   title, targetAmount: parseFloat(targetAmount),
    //   category, deadline: deadline?.toISOString(),
    //   notes, productUrl: normalizeUrl(productUrl), savingPlan
    // })
    Alert.alert("Goal updated! ✅", `"${title}" has been saved.`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Suppress the Stack header so our custom back button is the only one */}
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={Colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Goal</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Change notice */}
          <View style={styles.infoBar}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>
              Changing the target amount won't affect your saved balance.
            </Text>
          </View>

          {/* Image Picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={20} color={Colors.white} />
                  <Text style={styles.imageOverlayText}>Change Photo</Text>
                </View>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={32}
                  color={Colors.textSecondary}
                />
                <Text style={styles.imagePlaceholderText}>
                  Add a photo of your goal
                </Text>
                <Text style={styles.imagePlaceholderSub}>
                  Tap to browse your library
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.form}>
            {/* Goal Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Goal Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. PS5, Japan Trip, New MacBook"
                placeholderTextColor={Colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Target Amount */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Target Amount</Text>
              <View style={styles.amountRow}>
                <View style={styles.currencyTag}>
                  <Text style={styles.currencyText}>$</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.label}
                    style={[
                      styles.categoryBtn,
                      category === c.label && styles.categoryBtnActive,
                    ]}
                    onPress={() => setCategory(c.label)}
                  >
                    <Text style={styles.categoryIcon}>{c.icon}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        category === c.label && styles.categoryLabelActive,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due Date — branded modal picker (matches create screen) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={deadline ? Colors.primary : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.dateBtnText,
                    deadline && styles.dateBtnTextFilled,
                  ]}
                >
                  {deadline ? formatDate(deadline) : "Select a date"}
                </Text>
                {deadline && (
                  <TouchableOpacity
                    onPress={() => setDeadline(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <Modal
                visible={showDatePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.dateModalOverlay}>
                  <View style={styles.dateModalSheet}>
                    <View style={styles.dateModalHeader}>
                      <Text style={styles.dateModalTitle}>📅 Pick a Date</Text>
                      <TouchableOpacity
                        style={styles.dateModalDoneBtn}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.dateModalDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.datePickerCard}>
                      <DateTimePicker
                        value={deadline ?? new Date()}
                        mode="date"
                        display="spinner"
                        minimumDate={new Date()}
                        textColor={Colors.textPrimary}
                        onChange={(event, selectedDate) => {
                          if (event.type !== "dismissed" && selectedDate) {
                            setDeadline(selectedDate);
                          }
                        }}
                        style={{ width: "100%" }}
                      />
                    </View>

                    {deadline && (
                      <View style={styles.dateSelectedRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={Colors.success}
                        />
                        <Text style={styles.dateSelectedText}>
                          Goal due by {formatDate(deadline)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Modal>
            </View>

            {/* Saving Plan */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Saving Plan</Text>
              <View style={styles.planRow}>
                {PLANS.map((plan) => (
                  <TouchableOpacity
                    key={plan.key}
                    style={[
                      styles.planBtn,
                      savingPlan === plan.key && styles.planBtnActive,
                    ]}
                    onPress={() => setSavingPlan(plan.key)}
                  >
                    <Text style={styles.planIcon}>{plan.icon}</Text>
                    <Text
                      style={[
                        styles.planLabel,
                        savingPlan === plan.key && styles.planLabelActive,
                      ]}
                    >
                      {plan.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Product Link */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Product Link <Text style={styles.optional}>(optional)</Text>
              </Text>
              <View style={styles.inputIcon}>
                <Ionicons
                  name="link-outline"
                  size={18}
                  color={Colors.textSecondary}
                  style={styles.inputIconLeft}
                />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="amazon.com/... or https://..."
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={productUrl}
                  onChangeText={setProductUrl}
                />
              </View>
              {productUrl.length > 0 && (
                <TouchableOpacity
                  style={styles.previewLink}
                  onPress={handlePreviewLink}
                >
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.previewLinkText}>Preview link</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* PayPal */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                PayPal <Text style={styles.optional}>(optional)</Text>
              </Text>
              <Text style={styles.fieldHint}>
                Opens the PayPal app if installed, otherwise opens in browser.
              </Text>
              <TouchableOpacity
                style={styles.paypalBtn}
                onPress={handleConnectPayPal}
              >
                <Text style={styles.paypalBtnText}>💳 Connect PayPal</Text>
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Notes <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Why do you want this? What's your motivation?"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Text style={styles.submitText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelText}>Discard Changes</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 48 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: { color: Colors.white, fontSize: 14, fontWeight: "700" },

  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primaryLight,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.primary, fontWeight: "600" },

  imagePicker: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    height: 180,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: "dashed",
    marginBottom: 24,
  },
  imagePreview: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  imageOverlayText: { color: Colors.white, fontWeight: "700", fontSize: 14 },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  imagePlaceholderText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  imagePlaceholderSub: { fontSize: 12, color: Colors.border },

  form: { paddingHorizontal: 20 },
  fieldGroup: { marginBottom: 22 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  optional: {
    fontWeight: "400",
    color: Colors.textSecondary,
    textTransform: "none",
  },
  fieldHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: -4,
  },

  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  textArea: { height: 90, textAlignVertical: "top", paddingTop: 14 },

  amountRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  currencyTag: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    width: 46,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  currencyText: { color: Colors.white, fontSize: 20, fontWeight: "800" },
  amountInput: { fontSize: 22, fontWeight: "700" },

  // Category
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryBtn: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  categoryBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  categoryIcon: { fontSize: 22 },
  categoryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  categoryLabelActive: { color: Colors.primary },

  // Date picker trigger button
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateBtnText: { flex: 1, fontSize: 15, color: Colors.textSecondary },
  dateBtnTextFilled: { color: Colors.textPrimary, fontWeight: "600" },

  // Date picker modal
  dateModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  dateModalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 48,
    overflow: "hidden",
  },
  dateModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateModalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.white,
  },
  dateModalDoneBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateModalDoneText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
  datePickerCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
  },
  dateSelectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
  },
  dateSelectedText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.success,
  },

  // Input with icon
  inputIcon: { flexDirection: "row", alignItems: "center" },
  inputIconLeft: { position: "absolute", left: 14, zIndex: 1 },
  inputWithIcon: { paddingLeft: 42 },

  // Saving Plan
  planRow: { flexDirection: "row", gap: 10 },
  planBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  planBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  planIcon: { fontSize: 20 },
  planLabel: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  planLabelActive: { color: Colors.white },

  // Product link preview
  previewLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  previewLinkText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },

  // PayPal
  paypalBtn: {
    backgroundColor: "#003087",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  paypalBtnText: { color: Colors.white, fontSize: 15, fontWeight: "700" },

  // Submit / cancel
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitText: { color: Colors.white, fontSize: 17, fontWeight: "800" },
  cancelBtn: { alignItems: "center", paddingVertical: 14 },
  cancelText: { color: Colors.textSecondary, fontSize: 15, fontWeight: "600" },
});
