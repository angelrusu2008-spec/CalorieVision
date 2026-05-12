import { useState } from "react";
import { useLocation } from "wouter";
import { Target, Sun, Cloud, Moon, Coffee, Plus, Trash2, Sliders, ChevronRight } from "lucide-react";
import { CalorieRing } from "../components/CalorieRing";
import { useScan } from "../context/ScanContext";
import { useColors } from "../hooks/useColors";
import type { MealType, ScanRecord } from "../types";
import { MEAL_LABELS } from "../types";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_ICONS = { breakfast: Sun, lunch: Cloud, dinner: Moon, snack: Coffee };
const MACRO_COLORS = { protein: "#4F8EF7", carbs: "#F7B24F", fat: "#F74F4F" };

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function MacroSummaryCol({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const colors = useColors();
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5, color: colors.foreground }}>
        {Math.round(value)}<span style={{ fontSize: 13, fontWeight: 400, color: colors.mutedForeground }}>g</span>
      </span>
      <div style={{ width: "80%", height: 5, borderRadius: 3, background: colors.border, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 3, background: color, width: `${pct * 100}%` }} />
      </div>
      <span style={{ fontSize: 12, color: colors.mutedForeground }}>{label}</span>
    </div>
  );
}

function MealEntry({ entry, onDelete }: { entry: ScanRecord; onDelete: (id: string) => void }) {
  const colors = useColors();
  const [, navigate] = useLocation();
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: colors.card, position: "relative" }}>
      <img
        src={entry.imageUri}
        alt={entry.nutrition.foodName}
        style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0, cursor: "pointer" }}
        onClick={() => navigate(`/result/${entry.id}`)}
      />
      <div style={{ flex: 1, cursor: "pointer", minWidth: 0 }} onClick={() => navigate(`/result/${entry.id}`)}>
        <div style={{ fontSize: 14, fontWeight: 500, color: colors.foreground, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.nutrition.foodName}
        </div>
        <div style={{ fontSize: 11, color: colors.mutedForeground }}>
          P {Math.round(entry.nutrition.protein)}g · C {Math.round(entry.nutrition.carbs)}g · G {Math.round(entry.nutrition.fat)}g
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.foreground }}>
          {Math.round(entry.nutrition.calories)}<span style={{ fontSize: 11, fontWeight: 400, color: colors.mutedForeground }}> kcal</span>
        </span>
        <button
          onClick={() => {
            if (confirm("¿Eliminar este registro?")) onDelete(entry.id);
          }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: colors.mutedForeground, display: "flex" }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function MealSection({ meal }: { meal: MealType }) {
  const colors = useColors();
  const [, navigate] = useLocation();
  const { getTodayByMeal, setPendingMealType, deleteScan } = useScan();
  const MealIcon = MEAL_ICONS[meal];
  const entries = getTodayByMeal(meal);
  const totalCal = entries.reduce((s, r) => s + r.nutrition.calories, 0);

  function onAdd() {
    setPendingMealType(meal);
    navigate("/scan");
  }

  return (
    <div style={{ borderRadius: 18, border: `1px solid ${colors.border}`, background: colors.card, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: colors.secondary, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MealIcon size={16} color={colors.primary} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.foreground }}>{MEAL_LABELS[meal]}</div>
            {entries.length > 0 && (
              <div style={{ fontSize: 12, color: colors.mutedForeground }}>{Math.round(totalCal)} kcal</div>
            )}
          </div>
        </div>
        <button
          onClick={onAdd}
          style={{ width: 32, height: 32, borderRadius: 16, background: colors.primary, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Plus size={16} color={colors.primaryForeground} />
        </button>
      </div>

      {entries.length > 0 && (
        <div style={{ borderTop: `1px solid ${colors.border}` }}>
          {entries.map((entry) => (
            <MealEntry key={entry.id} entry={entry} onDelete={deleteScan} />
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <button
          onClick={onAdd}
          style={{ padding: "0 14px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: colors.mutedForeground }}
        >
          Toca + para añadir un alimento
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const colors = useColors();
  const [, navigate] = useLocation();
  const { getTodayTotals, dailyGoals } = useScan();
  const totals = getTodayTotals();
  const now = new Date();
  const dateLabel = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: colors.background, paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "56px 20px 12px" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, color: colors.mutedForeground }}>Hoy</div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3, marginTop: 2, color: colors.foreground }}>{dateLabel}</div>
        </div>
        <button
          onClick={() => navigate("/goals")}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
            borderRadius: 20, border: `1px solid ${colors.border}`, background: colors.secondary,
            cursor: "pointer", fontSize: 13, fontWeight: 600, color: colors.foreground,
          }}
        >
          <Sliders size={15} color={colors.primary} />
          Objetivos
        </button>
      </div>

      {/* Calorie Ring + Macros */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px", gap: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${colors.primary}08, transparent)`, pointerEvents: "none" }} />
        <CalorieRing consumed={totals.calories} goal={dailyGoals.calories} />
        <div style={{ display: "flex", alignItems: "center", width: "100%", paddingInline: 8, gap: 0 }}>
          <MacroSummaryCol label="Proteínas" value={totals.protein} goal={dailyGoals.protein} color={MACRO_COLORS.protein} />
          <div style={{ width: 1, height: 40, background: colors.border }} />
          <MacroSummaryCol label="Carbos" value={totals.carbs} goal={dailyGoals.carbs} color={MACRO_COLORS.carbs} />
          <div style={{ width: 1, height: 40, background: colors.border }} />
          <MacroSummaryCol label="Grasas" value={totals.fat} goal={dailyGoals.fat} color={MACRO_COLORS.fat} />
        </div>
      </div>

      {/* Meals */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: colors.foreground, paddingInline: 4 }}>Comidas</div>
        {MEAL_ORDER.map((meal) => (
          <MealSection key={meal} meal={meal} />
        ))}
      </div>
    </div>
  );
}
