import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface MacroBarProps {
  label: string;
  value: number;
  unit?: string;
  color: string;
  maxValue?: number;
}

export function MacroBar({
  label,
  value,
  unit = "g",
  color,
  maxValue = 100,
}: MacroBarProps) {
  const colors = useColors();
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(Math.min(value / maxValue, 1), {
      duration: 800,
    });
  }, [value, maxValue, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.foreground }]}>
          <Text style={{ color, fontFamily: "Inter_700Bold" }}>
            {value % 1 === 0 ? value : value.toFixed(1)}
          </Text>
          <Text style={{ color: colors.mutedForeground }}> {unit}</Text>
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  value: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
});
