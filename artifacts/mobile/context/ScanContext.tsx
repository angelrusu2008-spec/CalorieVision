import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
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

interface ScanContextType {
  history: ScanRecord[];
  addScan: (record: ScanRecord) => void;
  clearHistory: () => void;
  isLoading: boolean;
  dailyGoals: DailyGoals;
  pendingMealType: MealType;
  setPendingMealType: (meal: MealType) => void;
  getTodayRecords: () => ScanRecord[];
  getTodayByMeal: (meal: MealType) => ScanRecord[];
  getTodayTotals: () => DailyTotals;
}

const ScanContext = createContext<ScanContextType | null>(null);

const STORAGE_KEY = "calorie_scan_history_v2";

function todayDateString() {
  return new Date().toISOString().split("T")[0] ?? "";
}

const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMealType, setPendingMealType] = useState<MealType>("breakfast");

  useEffect(() => {
    void loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ScanRecord[];
        setHistory(parsed);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  const addScan = useCallback((record: ScanRecord) => {
    setHistory((prev) => {
      const next = [record, ...prev].slice(0, 200);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    void AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const getTodayRecords = useCallback(() => {
    const today = todayDateString();
    return history.filter((r) => r.date === today);
  }, [history]);

  const getTodayByMeal = useCallback(
    (meal: MealType) => {
      const today = todayDateString();
      return history.filter((r) => r.date === today && r.mealType === meal);
    },
    [history],
  );

  const getTodayTotals = useCallback((): DailyTotals => {
    const today = todayDateString();
    return history
      .filter((r) => r.date === today)
      .reduce(
        (acc, r) => ({
          calories: acc.calories + r.nutrition.calories,
          protein: acc.protein + r.nutrition.protein,
          carbs: acc.carbs + r.nutrition.carbs,
          fat: acc.fat + r.nutrition.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );
  }, [history]);

  return (
    <ScanContext.Provider
      value={{
        history,
        addScan,
        clearHistory,
        isLoading,
        dailyGoals: DEFAULT_GOALS,
        pendingMealType,
        setPendingMealType,
        getTodayRecords,
        getTodayByMeal,
        getTodayTotals,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used within ScanProvider");
  return ctx;
}
