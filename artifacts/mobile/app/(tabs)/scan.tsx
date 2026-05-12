import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useScan, type NutritionData, type ScanRecord, MEAL_LABELS } from "@/context/ScanContext";
import { useColors } from "@/hooks/useColors";

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addScan, pendingMealType } = useScan();
  const isDark = useColorScheme() === "dark";
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  async function pickImage(fromCamera: boolean) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (fromCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Camera access is required to scan food.");
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
      Alert.alert("Error", "Could not process image. Please try again.");
      return;
    }

    setSelectedImage(asset.uri);
    await analyzeFood(asset.base64, asset.uri);
  }

  async function analyzeFood(base64: string, uri: string) {
    setAnalyzing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";
      const response = await fetch(`${baseUrl}/api/analyze-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const json = (await response.json()) as { success: boolean; data: NutritionData };

      if (!json.success || !json.data) {
        throw new Error("Invalid response from server");
      }

      const today = new Date().toISOString().split("T")[0] ?? "";
      const record: ScanRecord = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        imageUri: uri,
        scannedAt: new Date().toISOString(),
        date: today,
        mealType: pendingMealType,
        nutrition: json.data,
      };

      addScan(record);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.push({
        pathname: "/result",
        params: { id: record.id },
      });
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Analysis failed",
        "Could not analyze the image. Please try again with a clearer photo of food.",
      );
    } finally {
      setAnalyzing(false);
      setSelectedImage(null);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {analyzing ? (
        <View style={styles.loadingContainer}>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
              blurRadius={8}
            />
          )}
          <View
            style={[styles.loadingOverlay, { backgroundColor: isDark ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.85)" }]}
          >
            <View style={[styles.scanRing, { borderColor: colors.primary }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={[styles.analyzingTitle, { color: colors.foreground }]}>
              Analyzing food...
            </Text>
            <Text style={[styles.analyzingSubtitle, { color: colors.mutedForeground }]}>
              Calculating calories & macros
            </Text>
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.header, { paddingTop: topPad + 16 }]}>
            <Text style={[styles.appName, { color: colors.foreground }]}>Scan Food</Text>
            <View style={[styles.mealBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="tag" size={12} color={colors.primary} />
              <Text style={[styles.mealBadgeText, { color: colors.foreground }]}>
                {MEAL_LABELS[pendingMealType]}
              </Text>
            </View>
          </View>

          <View style={styles.heroArea}>
            <View style={[styles.cameraFrame, { borderColor: colors.border, backgroundColor: colors.card }]}>
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
              <Feather name="camera-off" size={48} color={colors.mutedForeground} />
              <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
                Point at any food to scan
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.actions,
              {
                paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: colors.primary }]}
              onPress={() => pickImage(true)}
              activeOpacity={0.85}
            >
              <Feather name="camera" size={26} color={colors.primaryForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.galleryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => pickImage(false)}
              activeOpacity={0.85}
            >
              <Feather name="image" size={20} color={colors.foreground} />
            </TouchableOpacity>

            <View style={styles.actionLabels}>
              <Text style={[styles.scanLabel, { color: colors.foreground }]}>Take Photo</Text>
              <Text style={[styles.galleryLabel, { color: colors.mutedForeground }]}>Gallery</Text>
            </View>
          </View>

          <View style={[styles.tipRow, { bottom: Platform.OS === "web" ? 34 + 84 + 80 : insets.bottom + 180 }]}>
            <View style={[styles.tipPill, { backgroundColor: colors.secondary }]}>
              <Feather name="zap" size={12} color={colors.primary} />
              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                Instant AI analysis in seconds
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  appName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  mealBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  mealBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  heroArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  cameraFrame: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    gap: 12,
  },
  cornerTL: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 28,
    height: 28,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRadius: 4,
  },
  cornerTR: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderRadius: 4,
  },
  cornerBL: {
    position: "absolute",
    bottom: 16,
    left: 16,
    width: 28,
    height: 28,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderRadius: 4,
  },
  cornerBR: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 28,
    height: 28,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderRadius: 4,
  },
  heroLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 0,
  },
  actionLabels: {
    flexDirection: "row",
    width: "100%",
    marginTop: 12,
    gap: 0,
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  scanLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "center",
    marginLeft: -48,
  },
  galleryLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    width: 64,
    textAlign: "center",
  },
  scanButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00D26A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  galleryButton: {
    position: "absolute",
    right: 24,
    bottom: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  tipRow: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tipText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  loadingContainer: {
    flex: 1,
  },
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
