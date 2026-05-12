import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Camera, Image as ImageIcon, Zap, Sun, Cloud, Moon, Coffee, RefreshCcw, X, Loader } from "lucide-react";
import { useScan } from "../context/ScanContext";
import { useColors } from "../hooks/useColors";
import type { MealType, NutritionData, ScanRecord } from "../types";
import { MEAL_LABELS } from "../types";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_ICONS = { breakfast: Sun, lunch: Cloud, dinner: Moon, snack: Coffee };

type ScanState =
  | { phase: "idle" }
  | { phase: "preview"; dataUrl: string }
  | { phase: "analyzing"; dataUrl: string };

export default function Scan() {
  const colors = useColors();
  const [, navigate] = useLocation();
  const { addScan, pendingMealType, setPendingMealType } = useScan();
  const [scanState, setScanState] = useState<ScanState>({ phase: "idle" });
  const [selectedMeal, setSelectedMeal] = useState<MealType>(pendingMealType);
  const [hint, setHint] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | null | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScanState({ phase: "preview", dataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  async function analyzeFood() {
    if (scanState.phase !== "preview") return;
    const { dataUrl } = scanState;
    setScanState({ phase: "analyzing", dataUrl });

    try {
      const base64 = dataUrl.split(",")[1] ?? dataUrl;
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, hint: hint.trim() || undefined }),
      });

      if (!response.ok) throw new Error("Failed");
      const json = (await response.json()) as { success: boolean; data: NutritionData };
      if (!json.success || !json.data) throw new Error("Invalid response");

      const today = new Date().toISOString().split("T")[0] ?? "";
      const record: ScanRecord = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        imageUri: dataUrl,
        scannedAt: new Date().toISOString(),
        date: today,
        mealType: selectedMeal,
        nutrition: json.data,
      };

      addScan(record);
      setPendingMealType(selectedMeal);
      setHint("");
      setScanState({ phase: "idle" });
      navigate(`/result/${record.id}`);
    } catch {
      setScanState({ phase: "idle" });
      alert("No se pudo analizar la imagen. Prueba con una foto más clara del alimento.");
    }
  }

  if (scanState.phase === "analyzing") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: colors.background, flexDirection: "column", gap: 20 }}>
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={scanState.dataUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(12px)", opacity: 0.5 }} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ width: 96, height: 96, borderRadius: 48, border: `3px solid ${colors.primary}`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
              <Loader size={36} color={colors.primary} style={{ animation: "spin 1s linear infinite" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Analizando alimento...</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>Calculando calorías y macros</div>
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (scanState.phase === "preview") {
    return (
      <div style={{ flex: 1, overflowY: "auto", background: colors.background, paddingBottom: 90 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "56px 20px 8px" }}>
          <button
            onClick={() => { setScanState({ phase: "idle" }); setHint(""); }}
            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: colors.foreground }}
          >
            ←
          </button>
          <span style={{ fontSize: 22, fontWeight: 700, color: colors.foreground }}>Revisar imagen</span>
        </div>

        {/* Image preview */}
        <div style={{ padding: "0 20px 0" }}>
          <div style={{ borderRadius: 20, overflow: "hidden", position: "relative", height: 220 }}>
            <img src={scanState.dataUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              onClick={() => { setScanState({ phase: "idle" }); setHint(""); }}
              style={{
                position: "absolute", top: 12, right: 12,
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px", borderRadius: 20, border: "none",
                background: "rgba(0,0,0,0.55)", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 600,
              }}
            >
              <RefreshCcw size={14} /> Cambiar
            </button>
          </div>
        </div>

        {/* Meal selector */}
        <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, color: colors.mutedForeground }}>
            ¿Para qué comida?
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MEAL_ORDER.map((meal) => {
              const active = meal === selectedMeal;
              const Icon = MEAL_ICONS[meal];
              return (
                <button
                  key={meal}
                  onClick={() => setSelectedMeal(meal)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 12px", borderRadius: 22,
                    border: `1.5px solid ${active ? colors.primary : colors.border}`,
                    background: active ? colors.primary : colors.card,
                    color: active ? colors.primaryForeground : colors.foreground,
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                  }}
                >
                  <Icon size={13} />
                  {MEAL_LABELS[meal]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hint input */}
        <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, color: colors.mutedForeground }}>
            Describe el alimento (opcional)
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, borderRadius: 14, border: `1.5px solid ${hint ? colors.primary + "80" : colors.border}`, background: colors.card, padding: "12px 14px" }}>
            <textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="Ej: 100g de pasta, un vaso de leche entera..."
              maxLength={150}
              rows={2}
              style={{ flex: 1, background: "none", border: "none", outline: "none", resize: "none", fontSize: 14, color: colors.foreground, fontFamily: "inherit" }}
            />
            {hint && (
              <button onClick={() => setHint("")} style={{ background: "none", border: "none", cursor: "pointer", color: colors.mutedForeground, padding: 0 }}>
                <X size={16} />
              </button>
            )}
          </div>
          <div style={{ fontSize: 12, color: colors.mutedForeground }}>
            Indica la cantidad o nombre exacto para mayor precisión
          </div>
        </div>

        {/* Analyze button */}
        <div style={{ padding: "20px 20px 0" }}>
          <button
            onClick={analyzeFood}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "16px", borderRadius: 16, border: "none",
              background: colors.primary, cursor: "pointer",
              fontSize: 16, fontWeight: 700, color: colors.primaryForeground, letterSpacing: -0.2,
            }}
          >
            <Zap size={20} /> Analizar con IA
          </button>
        </div>
      </div>
    );
  }

  // Idle state
  return (
    <div style={{ flex: 1, overflowY: "auto", background: colors.background, paddingBottom: 90 }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />

      <div style={{ padding: "56px 20px 8px" }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: colors.foreground }}>Escanear</div>
        <div style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 4 }}>Fotografía tu alimento para analizarlo</div>
      </div>

      {/* Meal selector */}
      <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.7, color: colors.mutedForeground }}>
          ¿Para qué comida?
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MEAL_ORDER.map((meal) => {
            const active = meal === selectedMeal;
            const Icon = MEAL_ICONS[meal];
            return (
              <button
                key={meal}
                onClick={() => setSelectedMeal(meal)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 12px", borderRadius: 22,
                  border: `1.5px solid ${active ? colors.primary : colors.border}`,
                  background: active ? colors.primary : colors.card,
                  color: active ? colors.primaryForeground : colors.foreground,
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}
              >
                <Icon size={13} />
                {MEAL_LABELS[meal]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera frame */}
      <div style={{ padding: "20px 20px 0", height: 210 + 20 }}>
        <button
          onClick={() => cameraRef.current?.click()}
          style={{
            width: "100%", height: 210, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 10, borderRadius: 20, border: `1px solid ${colors.border}`,
            background: colors.card, cursor: "pointer", position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${colors.primary}0a, ${colors.primary}05)` }} />
          {/* Corner marks */}
          {[["top:14px", "left:14px", "borderTop:2.5px", "borderLeft:2.5px"], ["top:14px", "right:14px", "borderTop:2.5px", "borderRight:2.5px"], ["bottom:14px", "left:14px", "borderBottom:2.5px", "borderLeft:2.5px"], ["bottom:14px", "right:14px", "borderBottom:2.5px", "borderRight:2.5px"]].map((corner, i) => {
            const s: Record<string, string> = { position: "absolute", width: "24px", height: "24px", borderRadius: "4px", borderColor: colors.primary, borderStyle: "solid", borderWidth: "0" };
            corner.forEach(c => { const [k, v] = c.split(":"); s[k] = v; });
            return <div key={i} style={s as React.CSSProperties} />;
          })}
          <div style={{ width: 72, height: 72, borderRadius: 36, border: `1.5px solid ${colors.primary}40`, background: `${colors.primary}18`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <Camera size={36} color={colors.primary} />
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.foreground }}>Toca para fotografiar</div>
            <div style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "center" }}>Primero elige la comida, luego saca la foto</div>
          </div>
        </button>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 10, padding: "20px 20px 0" }}>
        <button
          onClick={() => cameraRef.current?.click()}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 15, borderRadius: 16, border: "none", background: colors.primary, cursor: "pointer", fontSize: 15, fontWeight: 600, color: colors.primaryForeground }}
        >
          <Camera size={20} /> Usar cámara
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "15px 20px", borderRadius: 16, border: `1px solid ${colors.border}`, background: colors.card, cursor: "pointer", fontSize: 15, fontWeight: 600, color: colors.foreground }}
        >
          <ImageIcon size={20} /> Galería
        </button>
      </div>
    </div>
  );
}
