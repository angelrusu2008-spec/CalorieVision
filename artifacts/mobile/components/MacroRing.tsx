import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface MacroRingProps {
  value: number;
  total: number;
  color: string;
  label: string;
  unit?: string;
  size?: number;
}

export function MacroRing({
  value,
  total,
  color,
  label,
  unit = "g",
  size = 72,
}: MacroRingProps) {
  const colors = useColors();
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(value / total, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.value, { color: colors.foreground }]}>
          {Math.round(value)}
        </Text>
        <Text style={[styles.unit, { color: colors.mutedForeground }]}>
          {unit}
        </Text>
      </View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 6,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    lineHeight: 18,
  },
  unit: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    lineHeight: 12,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
