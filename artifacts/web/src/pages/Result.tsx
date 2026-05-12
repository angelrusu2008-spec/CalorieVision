import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Trash2 } from "lucide-react";
import { MacroBar } from "../components/MacroBar";
import { useScan } from "../context/ScanContext";
import { useColors } from "../hooks/useColors";
import { MEAL_LABELS } from "../types";

const PROTEIN_COLOR = "#4F8EF7";
const CARBS_COLOR = "#F7B24F";
const FAT_COLOR = "#F74F4F";
const FIBER_COLOR = "#4FF7B2";

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const color = confidence === "high" ? "#00D26A" : confidence === "medium" ? "#F7B24F" : "#F74F4F";
  const label = confidence === "high" ? "Alta precisión" : confidence === "medium" ? "Precisión media" : "Baja precisión";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 20, background: color + "20" }}>
      <div style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
      <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

function HealthScoreCard({ score, reason }: { score: number; reason?: string }) {
  const colors = useColors();
  const safe = Math.max(1, Math.min(10, Math.round(score) || 5));
  const color = safe <= 3 ? "#F74F4F" : safe <= 5 ? "#F7B24F" : safe <= 7 ? "#A8D86E" : "#00D26A";
  const label = safe <= 3 ? "Poco saludable" : safe <= 5 ? "Moderado" : safe <= 7 ? "Bastante saludable" : "Muy saludable";

  return (
    <div style={{ borderRadius: 18, border: `1px solid ${color}35`, background: color + "12", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.foreground }}>Índice de salud</div>
          <div style={{ fontSize: 12, fontWeight: 500, color, marginTop: 2 }}>{label}</div>
        </div>
        <div style={{ width: 56, height: 56, borderRadius: 28, border: `2px solid ${color}`, background: color + "18", display: "flex", alignItems: "baseline", justifyContent: "center", gap: 1 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: -0.5 }}>{safe}</span>
          <span style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4 }}>/10</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, height: 8, borderRadius: 4, overflow: "hidden" }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const filled = i < safe;
          const segColor = i < 3 ? "#F74F4F" : i < 5 ? "#F7B24F" : i < 7 ? "#A8D86E" : "#00D26A";
          return (
            <div key={i} style={{ flex: 1, borderRadius: 2, background: filled ? segColor : colors.border, opacity: filled ? 1 : 0.35 }} />
          );
        })}
      </div>
      {!!reason && <div style={{ fontSize: 12, color: colors.mutedForeground, lineHeight: 1.5 }}>{reason}</div>}
    </div>
  );
}

export default function Result() {
  const colors = useColors();
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { history, deleteScan } = useScan();

  const record = history.find((r) => r.id === id);

  useEffect(() => {
    if (!record) navigate("/");
  }, [record, navigate]);

  if (!record) return null;

  const { nutrition, imageUri } = record;
  const totalMacros = nutrition.protein + nutrition.carbs + nutrition.fat;

  function handleDelete() {
    if (confirm("¿Quieres eliminar este registro?")) {
      deleteScan(record!.id);
      navigate("/");
    }
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: colors.background }}>
      {/* Image hero */}
      <div style={{ position: "relative", height: 280 }}>
        <img src={imageUri} alt={nutrition.foodName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: `linear-gradient(to bottom, transparent, ${colors.background})` }} />
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute", top: 56, left: 16, width: 40, height: 40,
            borderRadius: 20, background: "rgba(0,0,0,0.4)", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "0 20px 40px", display: "flex", flexDirection: "column", gap: 20, marginTop: -16 }}>
        {/* Title */}
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: colors.foreground, flex: 1 }}>
              {nutrition.foodName}
            </div>
            <ConfidenceBadge confidence={nutrition.confidence} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.mutedForeground, flex: 1 }}>{nutrition.servingSize}</span>
            <div style={{ padding: "4px 10px", borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.secondary }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: colors.mutedForeground }}>{MEAL_LABELS[record.mealType ?? "snack"]}</span>
            </div>
          </div>
          {nutrition.description && (
            <div style={{ fontSize: 14, color: colors.mutedForeground, lineHeight: 1.5, marginTop: 6 }}>{nutrition.description}</div>
          )}
        </div>

        {/* Calorie card */}
        <div style={{ borderRadius: 20, border: `1px solid ${colors.primary}30`, background: colors.background === "#F7F7F5" ? "#F5FAF7" : "#141414", padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -2, lineHeight: 1, color: colors.primary }}>
            {Math.round(nutrition.calories)}
          </span>
          <span style={{ fontSize: 16, fontWeight: 500, color: colors.mutedForeground }}>kcal</span>
        </div>

        {/* Health score */}
        <HealthScoreCard score={nutrition.healthScore ?? 5} reason={nutrition.healthReason} />

        {/* Macros */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.foreground }}>Macronutrientes</div>
          <div style={{ borderRadius: 16, border: `1px solid ${colors.border}`, background: colors.card, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <MacroBar label="Proteínas" value={nutrition.protein} color={PROTEIN_COLOR} maxValue={Math.max(totalMacros * 0.4, 1)} />
            <div style={{ height: 1, background: colors.border }} />
            <MacroBar label="Carbohidratos" value={nutrition.carbs} color={CARBS_COLOR} maxValue={Math.max(totalMacros * 0.6, 1)} />
            <div style={{ height: 1, background: colors.border }} />
            <MacroBar label="Grasas" value={nutrition.fat} color={FAT_COLOR} maxValue={Math.max(totalMacros * 0.4, 1)} />
            <div style={{ height: 1, background: colors.border }} />
            <MacroBar label="Fibra" value={nutrition.fiber} color={FIBER_COLOR} maxValue={30} />
          </div>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.foreground }}>Detalles</div>
          <div style={{ borderRadius: 16, border: `1px solid ${colors.border}`, background: colors.card, display: "flex" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: 16, gap: 4 }}>
              <span style={{ fontSize: 12, color: colors.mutedForeground }}>Azúcar</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: colors.foreground }}>{nutrition.sugar.toFixed(1)}g</span>
            </div>
            <div style={{ width: 1, background: colors.border, marginBlock: 12 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: 16, gap: 4 }}>
              <span style={{ fontSize: 12, color: colors.mutedForeground }}>Sodio</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: colors.foreground }}>{Math.round(nutrition.sodium)}mg</span>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        {nutrition.ingredients?.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.foreground }}>Ingredientes</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {nutrition.ingredients.slice(0, 8).map((ing, i) => (
                <div key={i} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${colors.border}`, background: colors.secondary }}>
                  <span style={{ fontSize: 13, color: colors.foreground }}>{ing}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => navigate("/scan")}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 16, border: "none", background: colors.primary, cursor: "pointer", fontSize: 16, fontWeight: 600, color: colors.primaryForeground }}
          >
            Escanear otro
          </button>
          <button
            onClick={handleDelete}
            style={{ width: 54, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, border: `1.5px solid ${colors.destructive}50`, background: colors.card, cursor: "pointer" }}
          >
            <Trash2 size={18} color={colors.destructive} />
          </button>
        </div>
      </div>
    </div>
  );
}
