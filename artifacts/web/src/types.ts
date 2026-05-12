export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
};

export interface NutritionData {
  foodName: string;
  description: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  confidence: "high" | "medium" | "low";
  ingredients: string[];
  healthScore: number;
  healthReason: string;
}

export interface ScanRecord {
  id: string;
  imageUri: string;
  scannedAt: string;
  date: string;
  mealType: MealType;
  nutrition: NutritionData;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
