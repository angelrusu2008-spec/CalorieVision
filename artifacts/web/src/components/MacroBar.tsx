import { useEffect, useRef } from "react";
import { useColors } from "../hooks/useColors";

interface MacroBarProps {
  label: string;
  value: number;
  unit?: string;
  color: string;
  maxValue?: number;
}

export function MacroBar({ label, value, unit = "g", color, maxValue = 100 }: MacroBarProps) {
  const colors = useColors();
  const barRef = useRef<HTMLDivElement>(null);
  const pct = Math.min(value / maxValue, 1);

  useEffect(() => {
    if (!barRef.current) return;
    barRef.current.style.transition = "width 0.8s ease";
    barRef.current.style.width = `${pct * 100}%`;
  }, [pct]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: colors.foreground }}>{label}</span>
        <span style={{ fontSize: 14, color: colors.foreground }}>
          <span style={{ color, fontWeight: 700 }}>
            {value % 1 === 0 ? value : value.toFixed(1)}
          </span>
          <span style={{ color: colors.mutedForeground }}> {unit}</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: colors.border, overflow: "hidden" }}>
        <div
          ref={barRef}
          style={{ height: "100%", borderRadius: 3, background: color, width: 0 }}
        />
      </div>
    </div>
  );
}
