import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { DailyGoals, DailyTotals, MealType, ScanRecord } from "../types";

const STORAGE_KEY = "calorie_scan_history_v2";
const GOALS_KEY = "calorie_scan_goals_v1";

export const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
};

function todayDateString() {
  return new Date().toISOString().split("T")[0] ?? "";
}

interface ScanContextType {
  history: ScanRecord[];
  addScan: (record: ScanRecord) => void;
  deleteScan: (id: string) => void;
  clearHistory: () => void;
  isLoading: boolean;
  dailyGoals: DailyGoals;
  updateGoals: (goals: DailyGoals) => void;
  pendingMealType: MealType;
  setPendingMealType: (meal: MealType) => void;
  getTodayRecords: () => ScanRecord[];
  getTodayByMeal: (meal: MealType) => ScanRecord[];
  getTodayTotals: () => DailyTotals;
}

const ScanContext = createContext<ScanContextType | null>(null);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMealType, setPendingMealType] = useState<MealType>("breakfast");
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>(DEFAULT_GOALS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw) as ScanRecord[]);
      const rawGoals = localStorage.getItem(GOALS_KEY);
      if (rawGoals) setDailyGoals(JSON.parse(rawGoals) as DailyGoals);
    } catch {}
    setIsLoading(false);
  }, []);

  const addScan = useCallback((record: ScanRecord) => {
    setHistory((prev) => {
      const next = [record, ...prev].slice(0, 200);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteScan = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((r) => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const updateGoals = useCallback((goals: DailyGoals) => {
    setDailyGoals(goals);
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
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
        deleteScan,
        clearHistory,
        isLoading,
        dailyGoals,
        updateGoals,
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
