import { useLocation } from "wouter";
import { Clock, ChevronRight } from "lucide-react";
import { useScan } from "../context/ScanContext";
import { useColors } from "../hooks/useColors";
import { MEAL_LABELS } from "../types";

function formatDate(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
}

export default function History() {
  const colors = useColors();
  const [, navigate] = useLocation();
  const { history, clearHistory, isLoading } = useScan();

  return (
    <div style={{ flex: 1, overflowY: "auto", background: colors.background, paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "56px 24px 16px" }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: colors.foreground }}>Historial</div>
        {history.length > 0 && (
          <button
            onClick={() => { if (confirm("¿Eliminar todos los escaneos?")) clearHistory(); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, fontWeight: 500, color: colors.destructive }}
          >
            Borrar
          </button>
        )}
      </div>

      {history.length === 0 && !isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 100, paddingInline: 40, textAlign: "center" }}>
          <Clock size={40} color={colors.mutedForeground} />
          <div style={{ fontSize: 18, fontWeight: 600, color: colors.foreground }}>Sin escaneos aún</div>
          <div style={{ fontSize: 14, color: colors.mutedForeground }}>Escanea un alimento para ver tu historial aquí</div>
        </div>
      ) : (
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/result/${item.id}`)}
              style={{
                display: "flex", alignItems: "center", borderRadius: 16, border: `1px solid ${colors.border}`,
                background: colors.card, overflow: "hidden", gap: 12, paddingRight: 16,
                cursor: "pointer", textAlign: "left", width: "100%",
              }}
            >
              <img
                src={item.imageUri}
                alt={item.nutrition.foodName}
                style={{ width: 72, height: 72, objectFit: "cover", flexShrink: 0 }}
              />
              <div style={{ flex: 1, paddingBlock: 12, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.foreground, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.nutrition.foodName}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: colors.mutedForeground }}>{formatDate(item.scannedAt)}</span>
                  {item.mealType && (
                    <span style={{ fontSize: 10, fontWeight: 500, color: colors.mutedForeground, background: colors.secondary, padding: "2px 7px", borderRadius: 6 }}>
                      {MEAL_LABELS[item.mealType]}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>
                    {Math.round(item.nutrition.calories)} kcal
                  </span>
                  <span style={{ fontSize: 11, color: colors.mutedForeground }}>
                    P {Math.round(item.nutrition.protein)}g · C {Math.round(item.nutrition.carbs)}g · G {Math.round(item.nutrition.fat)}g
                  </span>
                </div>
              </div>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
