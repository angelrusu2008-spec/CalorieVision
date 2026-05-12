import { useEffect, useRef } from "react";
import { useColors } from "../hooks/useColors";

interface CalorieRingProps {
  consumed: number;
  goal: number;
  size?: number;
}

export function CalorieRing({ consumed, goal, size = 220 }: CalorieRingProps) {
  const colors = useColors();
  const strokeWidth = 16;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const remaining = Math.max(goal - consumed, 0);
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!circleRef.current) return;
    const target = circumference * (1 - pct);
    circleRef.current.style.transition = "stroke-dashoffset 1s ease";
    circleRef.current.style.strokeDashoffset = String(target);
  }, [pct, circumference]);

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D26A" />
            <stop offset="100%" stopColor="#00FF84" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, zIndex: 1 }}>
        <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, color: colors.foreground }}>
          {Math.round(consumed)}
        </span>
        <span style={{ fontSize: 13, color: colors.mutedForeground }}>kcal consumidas</span>
        <div style={{ width: 32, height: 1, background: colors.border, margin: "6px 0" }} />
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: colors.primary }}>
          {Math.round(remaining)}
        </span>
        <span style={{ fontSize: 12, color: colors.mutedForeground }}>restantes</span>
      </div>
    </div>
  );
}
