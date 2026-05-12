import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MacroBar } from "@/components/MacroBar";
import { useScan } from "@/context/ScanContext";
import { useColors } from "@/hooks/useColors";

const PROTEIN_COLOR = "#4F8EF7";
const CARBS_COLOR = "#F7B24F";
const FAT_COLOR = "#F74F4F";
const FIBER_COLOR = "#4FF7B2";

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const colors = useColors();
  const color =
    confidence === "high"
      ? "#00D26A"
      : confidence === "medium"
        ? "#F7B24F"
        : "#F74F4F";
  const label =
    confidence === "high"
      ? "High Accuracy"
      : confidence === "medium"
        ? "Medium Accuracy"
        : "Low Accuracy";

  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function ResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history } = useScan();

  const record = history.find((r) => r.id === id);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!record) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.foreground }]}>Scan not found</Text>
      </View>
    );
  }

  const { nutrition, imageUri } = record;
  const totalMacros = nutrition.protein + nutrition.carbs + nutrition.fat;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 + 16 : insets.bottom + 24,
        }}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
          <LinearGradient
            colors={["transparent", colors.background]}
            style={styles.imageGradient}
          />
          <TouchableOpacity
            style={[
              styles.backButton,
              { top: topPad + 12, backgroundColor: "rgba(0,0,0,0.4)" },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <View style={styles.titleRow}>
              <Text style={[styles.foodName, { color: colors.foreground }]}>
                {nutrition.foodName}
              </Text>
              <ConfidenceBadge confidence={nutrition.confidence} />
            </View>
            <Text style={[styles.servingSize, { color: colors.mutedForeground }]}>
              {nutrition.servingSize}
            </Text>
            {nutrition.description ? (
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {nutrition.description}
              </Text>
            ) : null}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={[styles.calorieCard, { backgroundColor: isDark ? "#141414" : "#F5FAF7", borderColor: colors.primary + "30" }]}
          >
            <Text style={[styles.calorieNumber, { color: colors.primary }]}>
              {Math.round(nutrition.calories)}
            </Text>
            <Text style={[styles.calorieLabel, { color: colors.mutedForeground }]}>
              kcal
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Macronutrients</Text>
            <View style={[styles.macroContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MacroBar
                label="Protein"
                value={nutrition.protein}
                color={PROTEIN_COLOR}
                maxValue={Math.max(totalMacros * 0.4, 1)}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <MacroBar
                label="Carbohydrates"
                value={nutrition.carbs}
                color={CARBS_COLOR}
                maxValue={Math.max(totalMacros * 0.6, 1)}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <MacroBar
                label="Fat"
                value={nutrition.fat}
                color={FAT_COLOR}
                maxValue={Math.max(totalMacros * 0.4, 1)}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <MacroBar
                label="Fiber"
                value={nutrition.fiber}
                color={FIBER_COLOR}
                maxValue={30}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Details</Text>
            <View style={[styles.detailsGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <DetailItem label="Sugar" value={`${nutrition.sugar.toFixed(1)}g`} colors={colors} />
              <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
              <DetailItem label="Sodium" value={`${Math.round(nutrition.sodium)}mg`} colors={colors} />
            </View>
          </Animated.View>

          {nutrition.ingredients && nutrition.ingredients.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ingredients</Text>
              <View style={styles.ingredientsList}>
                {nutrition.ingredients.slice(0, 8).map((ing, i) => (
                  <View
                    key={i}
                    style={[styles.ingredientChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  >
                    <Text style={[styles.ingredientText, { color: colors.foreground }]}>
                      {ing}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <TouchableOpacity
              style={[styles.scanAgainButton, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Feather name="camera" size={18} color={colors.primaryForeground} />
              <Text style={[styles.scanAgainText, { color: colors.primaryForeground }]}>
                Scan Another
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailItem({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.detailItem}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: 280,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
    marginTop: -16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  foodName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  servingSize: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 6,
  },
  calorieCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 28,
    alignItems: "center",
    gap: 4,
  },
  calorieNumber: {
    fontSize: 56,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    lineHeight: 60,
  },
  calorieLabel: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  macroContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  divider: {
    height: 1,
  },
  detailsGrid: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
  },
  vDivider: {
    width: 1,
    marginVertical: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  detailValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  ingredientsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ingredientChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  ingredientText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  scanAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  scanAgainText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 100,
  },
});
