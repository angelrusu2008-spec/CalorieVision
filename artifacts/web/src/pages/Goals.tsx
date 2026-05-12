import { useState } from "react";
import { useLocation } from "wouter";
import { X, Minus, Plus } from "lucide-react";
import { useScan } from "../context/ScanContext";
import { useColors } from "../hooks/useColors";
import type { DailyGoals } from "../types";

function GoalRow({ label, unit, value, color, onChange, hint }: {
  label: string; unit: string; value: string; color: string; onChange: (v: string) => void; hint: string;
}) {
  const colors = useColors();
  const step = unit === "kcal" ? 50 : 5;

  function increment() { onChange(String((parseInt(value, 10) || 0) + step)); }
  function decrement() { onChange(String(Math.max(0, (parseInt(value, 10) || 0) - step))); }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 14, border: `1px solid ${colors.border}`, background: colors.card, padding: 14 }}>
      <div style={{ width: 10, height: 10, borderRadius: 5, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.foreground }}>{label}</div>
        <div style={{ fontSize: 11, color: colors.mutedForeground }}>{hint}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={decrement}
          style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${colors.border}`, background: colors.secondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Minus size={16} color={colors.foreground} />
        </button>
        <div style={{ minWidth: 64, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 2 }}>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ fontSize: 17, fontWeight: 700, color: colors.foreground, background: "none", border: "none", outline: "none", textAlign: "right", width: 52, fontFamily: "inherit", padding: 0 }}
          />
          <span style={{ fontSize: 12, color: colors.mutedForeground }}>{unit}</span>
        </div>
        <button
          onClick={increment}
          style={{ width: 32, height: 32, borderRadius: 10, border: `1.5px solid ${color}40`, background: `${color}20`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Plus size={16} color={color} />
        </button>
      </div>
    </div>
  );
}

export default function Goals() {
  const colors = useColors();
  const [, navigate] = useLocation();
  const { dailyGoals, updateGoals } = useScan();

  const [calories, setCalories] = useState(String(dailyGoals.calories));
  const [protein, setProtein] = useState(String(dailyGoals.protein));
  const [carbs, setCarbs] = useState(String(dailyGoals.carbs));
  const [fat, setFat] = useState(String(dailyGoals.fat));

  function save() {
    const goals: DailyGoals = {
      calories: Math.max(0, parseInt(calories, 10) || 0),
      protein: Math.max(0, parseInt(protein, 10) || 0),
      carbs: Math.max(0, parseInt(carbs, 10) || 0),
      fat: Math.max(0, parseInt(fat, 10) || 0),
    };
    updateGoals(goals);
    navigate(-1);
  }

  const cal = parseInt(calories, 10) || 0;
  const p = parseInt(protein, 10) || 0;
  const c = parseInt(carbs, 10) || 0;
  const f = parseInt(fat, 10) || 0;
  const totalFromMacros = p * 4 + c * 4 + f * 9;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: colors.background, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "56px 20px 16px", borderBottom: `1px solid ${colors.border}` }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: colors.foreground }}
        >
          <X size={22} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: colors.foreground }}>Mis objetivos</span>
        <button
          onClick={save}
          style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: colors.primary, cursor: "pointer", fontSize: 14, fontWeight: 600, color: colors.primaryForeground }}
        >
          Guardar
        </button>
      </div>

      <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 14, color: colors.mutedForeground, lineHeight: 1.5 }}>
          Establece tus objetivos diarios de calorías y macronutrientes.
        </div>

        {/* Calorías */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, color: colors.foreground }}>Calorías</div>
          <GoalRow label="Calorías" unit="kcal" value={calories} color="#00D26A" onChange={setCalories} hint="Objetivo energético diario" />
        </div>

        {/* Macros */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, color: colors.foreground }}>Macronutrientes</div>
          <GoalRow label="Proteínas" unit="g" value={protein} color="#4F8EF7" onChange={setProtein} hint="1g = 4 kcal" />
          <GoalRow label="Carbohidratos" unit="g" value={carbs} color="#F7B24F" onChange={setCarbs} hint="1g = 4 kcal" />
          <GoalRow label="Grasas" unit="g" value={fat} color="#F74F4F" onChange={setFat} hint="1g = 9 kcal" />
        </div>

        {/* Summary */}
        <div style={{ borderRadius: 16, border: `1px solid ${colors.border}`, background: colors.card, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: colors.mutedForeground }}>Calorías objetivo</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: colors.foreground }}>{cal} kcal</span>
          </div>
          <div style={{ height: 1, background: colors.border }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: colors.mutedForeground }}>Total macros</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: totalFromMacros > 0 && Math.abs(totalFromMacros - cal) > 100 ? "#F7B24F" : colors.primary }}>
              {totalFromMacros} kcal
            </span>
          </div>
          {totalFromMacros > 0 && Math.abs(totalFromMacros - cal) > 100 && (
            <div style={{ fontSize: 12, color: "#F7B24F", lineHeight: 1.4 }}>
              ⚠ La suma de macros ({totalFromMacros} kcal) difiere de tu objetivo calórico.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
