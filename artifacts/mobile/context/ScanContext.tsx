import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
  nutrition: NutritionData;
}

interface ScanContextType {
  history: ScanRecord[];
  addScan: (record: ScanRecord) => void;
  clearHistory: () => void;
  isLoading: boolean;
}

const ScanContext = createContext<ScanContextType | null>(null);

const STORAGE_KEY = "calorie_scan_history";

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const next = [record, ...prev].slice(0, 50);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    void AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ScanContext.Provider value={{ history, addScan, clearHistory, isLoading }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used within ScanProvider");
  return ctx;
}
