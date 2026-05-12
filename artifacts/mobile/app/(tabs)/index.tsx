import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalorieRing } from "@/components/CalorieRing";
import { useScan, type MealType, type ScanRecord, MEAL_LABELS } from "@/context/ScanContext";
import { useColors } from "@/hooks/useColors";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const MEAL_ICONS: Record<MealType, React.ComponentProps<typeof Feather>["name"]> = {
  breakfast: "sun",
  lunch: "cloud",
  dinner: "moon",
  snack: "coffee",
};

const MACRO_COLORS = {
  protein: "#4F8EF7",
  carbs: "#F7B24F",
  fat: "#F74F4F",
};

function MacroSummaryBar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const colors = useColors();
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;

  return (
    <View style={styles.macroCol}>
      <Text style={[styles.macroValue, { color: colors.foreground }]}>
        {Math.round(value)}
        <Text style={[styles.macroUnit, { color: colors.mutedForeground }]}>g</Text>
      </Text>
      <View style={[styles.macroTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.macroFill, { backgroundColor: color, width: `${pct * 100}%` }]} />
      </View>
      <Text style={[styles.macroLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function MealSection({ meal }: { meal: MealType }) {
  const colors = useColors();
  const router = useRouter();
  const { getTodayByMeal, setPendingMealType } = useScan();
  const entries = getTodayByMeal(meal);
  const totalCal = entries.reduce((s, r) => s + r.nutrition.calories, 0);
  const isDark = useColorScheme() === "dark";

  function onAdd() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPendingMealType(meal);
    router.push("/(tabs)/scan");
  }

  return (
    <View style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleRow}>
          <View style={[styles.mealIconBox, { backgroundColor: colors.secondary }]}>
            <Feather name={MEAL_ICONS[meal]} size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.mealName, { color: colors.foreground }]}>
              {MEAL_LABELS[meal]}
            </Text>
            {entries.length > 0 && (
              <Text style={[styles.mealCalTotal, { color: colors.mutedForeground }]}>
                {Math.round(totalCal)} kcal
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={onAdd}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={16} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {entries.length > 0 && (
        <View style={[styles.entriesList, { borderTopColor: colors.border }]}>
          {entries.map((entry) => (
            <MealEntry key={entry.id} entry={entry} />
          ))}
        </View>
      )}

      {entries.length === 0 && (
        <TouchableOpacity style={styles.emptyRow} onPress={onAdd} activeOpacity={0.7}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tap + to add food
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MealEntry({ entry }: { entry: ScanRecord }) {
  const colors = useColors();
  const router = useRouter();

  function onPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/result", params: { id: entry.id } });
  }

  return (
    <TouchableOpacity style={styles.entryRow} onPress={onPress} activeOpacity={0.75}>
      <Image source={{ uri: entry.imageUri }} style={styles.entryThumb} contentFit="cover" />
      <View style={styles.entryInfo}>
        <Text style={[styles.entryName, { color: colors.foreground }]} numberOfLines={1}>
          {entry.nutrition.foodName}
        </Text>
        <Text style={[styles.entryMacros, { color: colors.mutedForeground }]}>
          P {Math.round(entry.nutrition.protein)}g · C {Math.round(entry.nutrition.carbs)}g · F {Math.round(entry.nutrition.fat)}g
        </Text>
      </View>
      <Text style={[styles.entryCal, { color: colors.foreground }]}>
        {Math.round(entry.nutrition.calories)}
        <Text style={[styles.entryCalUnit, { color: colors.mutedForeground }]}> kcal</Text>
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";
  const { getTodayTotals, dailyGoals } = useScan();
  const totals = getTodayTotals();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const dateLabel = `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 34 + 84 + 16 : insets.bottom + 100,
        }}
      >
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Today</Text>
            <Text style={[styles.dateLabel, { color: colors.foreground }]}>{dateLabel}</Text>
          </View>
          <View style={[styles.goalBadge, { backgroundColor: colors.secondary }]}>
            <Feather name="target" size={14} color={colors.primary} />
            <Text style={[styles.goalText, { color: colors.foreground }]}>
              {dailyGoals.calories} kcal goal
            </Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.ringSection}>
          <LinearGradient
            colors={isDark ? ["rgba(0,210,106,0.06)", "transparent"] : ["rgba(0,210,106,0.04)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
          <CalorieRing consumed={totals.calories} goal={dailyGoals.calories} />

          <View style={styles.macroRow}>
            <MacroSummaryBar
              label="Protein"
              value={totals.protein}
              goal={dailyGoals.protein}
              color={MACRO_COLORS.protein}
            />
            <View style={[styles.macroDivider, { backgroundColor: colors.border }]} />
            <MacroSummaryBar
              label="Carbs"
              value={totals.carbs}
              goal={dailyGoals.carbs}
              color={MACRO_COLORS.carbs}
            />
            <View style={[styles.macroDivider, { backgroundColor: colors.border }]} />
            <MacroSummaryBar
              label="Fat"
              value={totals.fat}
              goal={dailyGoals.fat}
              color={MACRO_COLORS.fat}
            />
          </View>
        </Animated.View>

        <View style={styles.mealsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Meals</Text>
          <View style={styles.mealsList}>
            {MEAL_ORDER.map((meal, i) => (
              <Animated.View key={meal} entering={FadeInDown.delay(150 + i * 60).springify()}>
                <MealSection meal={meal} />
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dateLabel: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  goalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 4,
  },
  goalText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  ringSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 24,
    overflow: "hidden",
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 8,
  },
  macroCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  macroValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  macroUnit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  macroTrack: {
    width: "80%",
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  macroFill: {
    height: "100%",
    borderRadius: 3,
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  macroDivider: {
    width: 1,
    height: 40,
  },
  mealsSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 4,
  },
  mealsList: {
    gap: 10,
  },
  mealCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mealIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  mealName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  mealCalTotal: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  entriesList: {
    borderTopWidth: 1,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  entryThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  entryInfo: {
    flex: 1,
    gap: 3,
  },
  entryName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  entryMacros: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  entryCal: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  entryCalUnit: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  emptyRow: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
