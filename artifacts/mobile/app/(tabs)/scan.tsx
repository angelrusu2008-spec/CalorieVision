import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import {
  useScan,
  type MealType,
  type NutritionData,
  type ScanRecord,
  MEAL_LABELS,
} from "@/context/ScanContext";
import { useColors } from "@/hooks/useColors";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const MEAL_ICONS: Record<MealType, React.ComponentProps<typeof Feather>["name"]> = {
  breakfast: "sun",
  lunch: "cloud",
  dinner: "moon",
  snack: "coffee",
};

type ScanState =
  | { phase: "idle" }
  | { phase: "preview"; uri: string; base64: string }
  | { phase: "analyzing"; uri: string };

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addScan, pendingMealType, setPendingMealType } = useScan();
  const isDark = useColorScheme() === "dark";
  const [scanState, setScanState] = useState<ScanState>({ phase: "idle" });
  const [selectedMeal, setSelectedMeal] = useState<MealType>(pendingMealType);
  const [hint, setHint] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  async function pickImage(fromCamera: boolean) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (fromCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permiso necesario", "Se necesita acceso a la cámara para escanear alimentos.");
        return;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: "images",
          quality: 0.7,
          base64: true,
          allowsEditing: true,
          aspect: [4, 3],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          quality: 0.7,
          base64: true,
          allowsEditing: true,
          aspect: [4, 3],
        });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("Error", "No se pudo procesar la imagen. Inténtalo de nuevo.");
      return;
    }

    setScanState({ phase: "preview", uri: asset.uri, base64: asset.base64 });
  }

  async function analyzeFood() {
    if (scanState.phase !== "preview") return;
    const { base64, uri } = scanState;

    setScanState({ phase: "analyzing", uri });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";
      const response = await fetch(`${baseUrl}/api/analyze-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, hint: hint.trim() || undefined }),
      });

      if (!response.ok) throw new Error("Failed to analyze image");
      const json = (await response.json()) as { success: boolean; data: NutritionData };
      if (!json.success || !json.data) throw new Error("Invalid response");

      const today = new Date().toISOString().split("T")[0] ?? "";
      const record: ScanRecord = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        imageUri: uri,
        scannedAt: new Date().toISOString(),
        date: today,
        mealType: selectedMeal,
        nutrition: json.data,
      };

      addScan(record);
      setPendingMealType(selectedMeal);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHint("");
      setScanState({ phase: "idle" });
      router.push({ pathname: "/result", params: { id: record.id } });
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanState({ phase: "idle" });
      Alert.alert("Análisis fallido", "No se pudo analizar la imagen. Prueba con una foto más clara del alimento.");
    }
  }

  if (scanState.phase === "analyzing") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Image source={{ uri: scanState.uri }} style={styles.previewImage} blurRadius={8} />
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: isDark ? "rgba(0,0,0,0.78)" : "rgba(255,255,255,0.88)" },
            ]}
          >
            <View style={[styles.scanRing, { borderColor: colors.primary }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={[styles.analyzingTitle, { color: colors.foreground }]}>
              Analizando alimento...
            </Text>
            <Text style={[styles.analyzingSubtitle, { color: colors.mutedForeground }]}>
              Calculando calorías y macros
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (scanState.phase === "preview") {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomPad }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.header, { paddingTop: topPad + 16 }]}>
            <TouchableOpacity
              style={styles.backChip}
              onPress={() => { setScanState({ phase: "idle" }); setHint(""); }}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>Revisar imagen</Text>
          </View>

          <View style={styles.previewSection}>
            <View style={styles.previewImageWrapper}>
              <Image source={{ uri: scanState.uri }} style={styles.previewImg} resizeMode="cover" />
              <TouchableOpacity
                style={[styles.retakeBtn, { backgroundColor: "rgba(0,0,0,0.55)" }]}
                onPress={() => { setScanState({ phase: "idle" }); setHint(""); }}
                activeOpacity={0.85}
              >
                <Feather name="refresh-ccw" size={16} color="#fff" />
                <Text style={styles.retakeBtnText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              ¿Para qué comida?
            </Text>
            <View style={styles.mealRow}>
              {MEAL_ORDER.map((meal) => {
                const active = meal === selectedMeal;
                return (
                  <TouchableOpacity
                    key={meal}
                    style={[
                      styles.mealChip,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedMeal(meal);
                    }}
                    activeOpacity={0.75}
                  >
                    <Feather
                      name={MEAL_ICONS[meal]}
                      size={13}
                      color={active ? colors.primaryForeground : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.mealChipText,
                        { color: active ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {MEAL_LABELS[meal]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Describe el alimento (opcional)
            </Text>
            <View
              style={[
                styles.hintInputWrapper,
                { backgroundColor: colors.card, borderColor: hint.length > 0 ? colors.primary + "80" : colors.border },
              ]}
            >
              <Feather name="edit-2" size={15} color={colors.mutedForeground} />
              <TextInput
                style={[styles.hintInput, { color: colors.foreground }]}
                placeholder="Ej: 100g de pasta, un vaso de leche entera..."
                placeholderTextColor={colors.mutedForeground}
                value={hint}
                onChangeText={setHint}
                returnKeyType="done"
                maxLength={150}
                autoFocus={false}
                multiline
              />
              {hint.length > 0 && (
                <TouchableOpacity onPress={() => setHint("")} activeOpacity={0.7}>
                  <Feather name="x-circle" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.hintHelp, { color: colors.mutedForeground }]}>
              Indica la cantidad o nombre exacto para mayor precisión
            </Text>
          </View>

          <View style={styles.analyzeRow}>
            <TouchableOpacity
              style={[styles.analyzeBtn, { backgroundColor: colors.primary }]}
              onPress={analyzeFood}
              activeOpacity={0.85}
            >
              <Feather name="zap" size={20} color={colors.primaryForeground} />
              <Text style={[styles.analyzeBtnText, { color: colors.primaryForeground }]}>
                Analizar con IA
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Escanear</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Fotografía tu alimento para analizarlo
          </Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            ¿Para qué comida?
          </Text>
          <View style={styles.mealRow}>
            {MEAL_ORDER.map((meal) => {
              const active = meal === selectedMeal;
              return (
                <TouchableOpacity
                  key={meal}
                  style={[
                    styles.mealChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMeal(meal);
                  }}
                  activeOpacity={0.75}
                >
                  <Feather
                    name={MEAL_ICONS[meal]}
                    size={13}
                    color={active ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.mealChipText,
                      { color: active ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {MEAL_LABELS[meal]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.cameraSection}>
          <TouchableOpacity
            style={[styles.cameraFrame, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => pickImage(true)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(0,210,106,0.08)", "rgba(0,210,106,0.02)"]
                  : ["rgba(0,210,106,0.06)", "rgba(0,210,106,0.01)"]
              }
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
            <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
            <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
            <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
            <View
              style={[
                styles.cameraCircle,
                { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" },
              ]}
            >
              <Feather name="camera" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.heroLabel, { color: colors.foreground }]}>
              Toca para fotografiar
            </Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              Primero elige la comida, luego saca la foto
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => pickImage(true)}
            activeOpacity={0.85}
          >
            <Feather name="camera" size={20} color={colors.primaryForeground} />
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
              Usar cámara
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => pickImage(false)}
            activeOpacity={0.85}
          >
            <Feather name="image" size={20} color={colors.foreground} />
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Galería</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  backChip: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  sectionBlock: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  mealRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  mealChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  mealChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  cameraSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    height: 210,
  },
  cameraFrame: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    gap: 10,
  },
  cornerTL: { position: "absolute", top: 14, left: 14, width: 24, height: 24, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderRadius: 4 },
  cornerTR: { position: "absolute", top: 14, right: 14, width: 24, height: 24, borderTopWidth: 2.5, borderRightWidth: 2.5, borderRadius: 4 },
  cornerBL: { position: "absolute", bottom: 14, left: 14, width: 24, height: 24, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderRadius: 4 },
  cornerBR: { position: "absolute", bottom: 14, right: 14, width: 24, height: 24, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderRadius: 4 },
  cameraCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  heroSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  previewSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  previewImageWrapper: {
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
  },
  previewImg: {
    width: "100%",
    height: "100%",
  },
  retakeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  retakeBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  hintInputWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hintInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
    minHeight: 40,
  },
  hintHelp: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  analyzeRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  analyzeBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  loadingContainer: { flex: 1 },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  scanRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  analyzingTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  analyzingSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
