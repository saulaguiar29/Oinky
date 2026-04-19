import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useMemo } from "react";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme, ColorPalette } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { goalsAPI } from "../../../services/api";
import { uploadGoalImage } from "../../../services/uploadImage";

const CATEGORIES = [
  { label: "Tech", icon: "laptop-outline" },
  { label: "Travel", icon: "airplane-outline" },
  { label: "Fashion", icon: "bag-handle-outline" },
  { label: "Gaming", icon: "game-controller-outline" },
  { label: "Home", icon: "home-outline" },
  { label: "Health", icon: "barbell-outline" },
  { label: "Food", icon: "restaurant-outline" },
  { label: "Other", icon: "grid-outline" },
];

const PLANS = [
  { key: "daily", label: "Daily", icon: "sunny-outline" },
  { key: "biweekly", label: "Bi-Weekly", icon: "calendar-outline" },
  { key: "monthly", label: "Monthly", icon: "calendar-clear-outline" },
];

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [savingPlan, setSavingPlan] = useState("monthly");
  const [image, setImage] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token || !id) return;
      try {
        const data = await goalsAPI.getOne(token, id as string);
        const g = data.goal;
        setTitle(g.title);
        setTargetAmount(String(g.targetAmount));
        setCategory(g.category || "");
        setDeadline(g.deadline ? parseDate(g.deadline.split("T")[0]) : null);
        setNotes(g.notes || "");
        setProductUrl(g.productUrl || "");
        setSavingPlan(g.savingPlan || "monthly");
        setImage(g.imageUrl || null);
      } catch (err: any) {
        Alert.alert("Error", err.message || "Could not load goal.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token, id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo access to update goal image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const handlePreviewLink = () => {
    const normalized = normalizeUrl(productUrl.trim());
    if (!normalized) return;
    Linking.openURL(normalized).catch(() =>
      Alert.alert("Couldn't open link", "Make sure the URL is valid."),
    );
  };

  const handleConnectPayPal = async () => {
    try {
      await Linking.openURL("paypal://");
    } catch {
      Linking.openURL("https://www.paypal.com");
    }
  };

  const handleConnectVenmo = async () => {
    try {
      await Linking.openURL("venmo://");
    } catch {
      Linking.openURL("https://venmo.com");
    }
  };

  const handleSave = async () => {
    if (!title || !targetAmount) {
      Alert.alert("Missing info", "Goal name and target amount are required.");
      return;
    }
    if (!token || !id) return;

    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageChanged && image) {
        try {
          imageUrl = await uploadGoalImage(image, id as string, token);
        } catch (e) {
          console.warn("Image upload failed (non-fatal):", e);
        }
      }

      await goalsAPI.update(token, id as string, {
        title,
        targetAmount: parseFloat(targetAmount),
        category,
        deadline: deadline?.toISOString(),
        notes,
        productUrl: productUrl ? normalizeUrl(productUrl) : undefined,
        savingPlan,
        ...(imageUrl ? { imageUrl } : {}),
      });
      Alert.alert("Goal updated! ✅", `"${title}" has been saved.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not update goal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.primary} style={{ flex: 1, marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Goal</Text>
            <TouchableOpacity
              style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Change notice */}
          <View style={styles.infoBar}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
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
                  <Ionicons name="camera" size={20} color={colors.white} />
                  <Text style={styles.imageOverlayText}>Change Photo</Text>
                </View>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                <Text style={styles.imagePlaceholderText}>Add a photo of your goal</Text>
                <Text style={styles.imagePlaceholderSub}>Tap to browse your library</Text>
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
                placeholderTextColor={colors.textSecondary}
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
                  placeholderTextColor={colors.textSecondary}
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
                    <Ionicons
                      name={c.icon as any}
                      size={22}
                      color={category === c.label ? colors.white : colors.primary}
                    />
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

            {/* Due Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={deadline ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.dateBtnText, deadline && styles.dateBtnTextFilled]}>
                  {deadline ? formatDate(deadline) : "Select a date"}
                </Text>
                {deadline && (
                  <TouchableOpacity
                    onPress={() => setDeadline(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
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
                        textColor={colors.textPrimary}
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
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
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
                    <Ionicons
                      name={plan.icon as any}
                      size={20}
                      color={savingPlan === plan.key ? colors.white : colors.primary}
                    />
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
                  color={colors.textSecondary}
                  style={styles.inputIconLeft}
                />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="amazon.com/... or https://..."
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={productUrl}
                  onChangeText={setProductUrl}
                />
              </View>
              {productUrl.length > 0 && (
                <TouchableOpacity style={styles.previewLink} onPress={handlePreviewLink}>
                  <Ionicons name="open-outline" size={14} color={colors.primary} />
                  <Text style={styles.previewLinkText}>Preview link</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* PayPal & Venmo */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Payment Apps <Text style={styles.optional}>(optional)</Text>
              </Text>
              <Text style={styles.fieldHint}>
                Link your payment apps to make saving easier.
              </Text>
              <View style={styles.paymentRow}>
                <TouchableOpacity style={styles.paypalBtn} onPress={handleConnectPayPal}>
                  <Ionicons name="card-outline" size={16} color="#fff" />
                  <Text style={styles.paypalBtnText}>PayPal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.venmoBtn} onPress={handleConnectVenmo}>
                  <Ionicons name="phone-portrait-outline" size={16} color="#fff" />
                  <Text style={styles.venmoBtnText}>Venmo</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Notes <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Why do you want this? What's your motivation?"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelText}>Discard Changes</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 48 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
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
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    headerTitle: { fontSize: 18, fontWeight: "800", color: c.textPrimary },
    saveBtn: {
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minWidth: 60,
      alignItems: "center",
    },
    saveBtnText: { color: c.white, fontSize: 14, fontWeight: "700" },
    infoBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: c.primaryLight,
      marginHorizontal: 20,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    infoText: { flex: 1, fontSize: 13, color: c.primary, fontWeight: "600" },
    imagePicker: {
      marginHorizontal: 20,
      borderRadius: 20,
      overflow: "hidden",
      height: 180,
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: c.border,
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
    imageOverlayText: { color: c.white, fontWeight: "700", fontSize: 14 },
    imagePlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    imagePlaceholderText: {
      fontSize: 15,
      fontWeight: "700",
      color: c.textSecondary,
    },
    imagePlaceholderSub: { fontSize: 12, color: c.border },
    form: { paddingHorizontal: 20 },
    fieldGroup: { marginBottom: 22 },
    label: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textPrimary,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    optional: {
      fontWeight: "400",
      color: c.textSecondary,
      textTransform: "none",
    },
    fieldHint: {
      fontSize: 12,
      color: c.textSecondary,
      marginBottom: 8,
      marginTop: -4,
    },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: c.textPrimary,
      flex: 1,
    },
    textArea: { height: 90, textAlignVertical: "top", paddingTop: 14 },
    amountRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    currencyTag: {
      backgroundColor: c.primary,
      borderRadius: 12,
      width: 46,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
    },
    currencyText: { color: c.white, fontSize: 20, fontWeight: "800" },
    amountInput: { fontSize: 22, fontWeight: "700" },
    categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    categoryBtn: {
      width: "22%",
      aspectRatio: 1,
      borderRadius: 14,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    categoryBtnActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    categoryLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: c.textSecondary,
    },
    categoryLabelActive: { color: c.primary },
    dateBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    dateBtnText: { flex: 1, fontSize: 15, color: c.textSecondary },
    dateBtnTextFilled: { color: c.textPrimary, fontWeight: "600" },
    dateModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    dateModalSheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingBottom: 48,
      overflow: "hidden",
    },
    dateModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.primary,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    dateModalTitle: { fontSize: 17, fontWeight: "800", color: c.white },
    dateModalDoneBtn: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    dateModalDoneText: { color: c.white, fontWeight: "700", fontSize: 15 },
    datePickerCard: {
      backgroundColor: c.surface,
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
    dateSelectedText: { fontSize: 14, fontWeight: "600", color: c.success },
    inputIcon: { flexDirection: "row", alignItems: "center" },
    inputIconLeft: { position: "absolute", left: 14, zIndex: 1 },
    inputWithIcon: { paddingLeft: 42 },
    planRow: { flexDirection: "row", gap: 10 },
    planBtn: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      gap: 4,
    },
    planBtnActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    planLabel: { fontSize: 12, fontWeight: "700", color: c.textSecondary },
    planLabelActive: { color: c.white },
    previewLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
    },
    previewLinkText: { fontSize: 13, color: c.primary, fontWeight: "600" },
    paymentRow: { flexDirection: "row", gap: 10 },
    paypalBtn: {
      flex: 1,
      backgroundColor: "#0070BA",
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    paypalBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    venmoBtn: {
      flex: 1,
      backgroundColor: "#3D95CE",
      borderRadius: 14,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    venmoBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    submitBtn: {
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: "center",
      marginBottom: 12,
      marginTop: 8,
      shadowColor: c.primary,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    submitText: { color: c.white, fontSize: 17, fontWeight: "800" },
    cancelBtn: { alignItems: "center", paddingVertical: 14 },
    cancelText: { color: c.textSecondary, fontSize: 15, fontWeight: "600" },
  });
}
