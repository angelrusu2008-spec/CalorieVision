import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScan, type DailyGoals } from "@/context/ScanContext";
import { useColors } from "@/hooks/useColors";

interface GoalRowProps {
  label: string;
  unit: string;
  value: string;
  color: string;
  onChange: (v: string) => void;
  hint: string;
}

function GoalRow({ label, unit, value, color, onChange, hint }: GoalRowProps) {
  const colors = useColors();

  function increment() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const n = parseInt(value, 10) || 0;
    const step = unit === "kcal" ? 50 : 5;
    onChange(String(n + step));
  }

  function decrement() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const n = parseInt(value, 10) || 0;
    const step = unit === "kcal" ? 50 : 5;
    onChange(String(Math.max(0, n - step)));
  }

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.colorDot, { backgroundColor: color }]} />
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.rowHint, { color: colors.mutedForeground }]}>{hint}</Text>
      </View>
      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.stepBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={decrement}
          activeOpacity={0.7}
        >
          <Feather name="minus" size={16} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            maxLength={5}
            selectTextOnFocus
          />
          <Text style={[styles.unit, { color: colors.mutedForeground }]}>{unit}</Text>
        </View>
        <TouchableOpacity
          style={[styles.stepBtn, { backgroundColor: color + "20", borderColor: color + "40" }]}
          onPress={increment}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={16} color={color} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function GoalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dailyGoals, updateGoals } = useScan();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [calories, setCalories] = useState(String(dailyGoals.calories));
  const [protein, setProtein] = useState(String(dailyGoals.protein));
  const [carbs, setCarbs] = useState(String(dailyGoals.carbs));
  const [fat, setFat] = useState(String(dailyGoals.fat));

  function save() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const goals: DailyGoals = {
      calories: Math.max(0, parseInt(calories, 10) || 0),
      protein: Math.max(0, parseInt(protein, 10) || 0),
      carbs: Math.max(0, parseInt(carbs, 10) || 0),
      fat: Math.max(0, parseInt(fat, 10) || 0),
    };
    updateGoals(goals);
    router.back();
  }

  const cal = parseInt(calories, 10) || 0;
  const p = parseInt(protein, 10) || 0;
  const c = parseInt(carbs, 10) || 0;
  const f = parseInt(fat, 10) || 0;
  const totalFromMacros = p * 4 + c * 4 + f * 9;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: topPad + 16, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Mis objetivos</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={save}
          activeOpacity={0.85}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Establece tus objetivos diarios de calorías y macronutrientes.
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Calorías</Text>
          <GoalRow
            label="Calorías"
            unit="kcal"
            value={calories}
            color="#00D26A"
            onChange={setCalories}
            hint="Objetivo energético diario"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Macronutrientes</Text>
          <GoalRow
            label="Proteínas"
            unit="g"
            value={protein}
            color="#4F8EF7"
            onChange={setProtein}
            hint="1g = 4 kcal"
          />
          <GoalRow
            label="Carbohidratos"
            unit="g"
            value={carbs}
            color="#F7B24F"
            onChange={setCarbs}
            hint="1g = 4 kcal"
          />
          <GoalRow
            label="Grasas"
            unit="g"
            value={fat}
            color="#F74F4F"
            onChange={setFat}
            hint="1g = 9 kcal"
          />
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Calorías objetivo
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {cal} kcal
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Total macros
            </Text>
            <Text
              style={[
                styles.summaryValue,
                { color: totalFromMacros > 0 && Math.abs(totalFromMacros - cal) > 100 ? "#F7B24F" : colors.primary },
              ]}
            >
              {totalFromMacros} kcal
            </Text>
          </View>
          {totalFromMacros > 0 && Math.abs(totalFromMacros - cal) > 100 && (
            <Text style={[styles.mismatchHint, { color: "#F7B24F" }]}>
              ⚠ La suma de macros ({totalFromMacros} kcal) difiere de tu objetivo calórico.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    padding: 20,
    gap: 24,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  rowHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    minWidth: 64,
    justifyContent: "center",
    gap: 2,
  },
  input: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    minWidth: 40,
    padding: 0,
  },
  unit: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  summaryDivider: {
    height: 1,
  },
  mismatchHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
});
