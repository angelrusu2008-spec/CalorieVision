import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
  const progress = useSharedValue(0);
  const remaining = Math.max(goal - consumed, 0);
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;

  React.useEffect(() => {
    progress.value = withTiming(pct, { duration: 1000 });
  }, [pct, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00D26A" />
            <Stop offset="100%" stopColor="#00FF84" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.consumed, { color: colors.foreground }]}>
          {Math.round(consumed)}
        </Text>
        <Text style={[styles.unit, { color: colors.mutedForeground }]}>kcal eaten</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.remaining, { color: colors.primary }]}>
          {Math.round(remaining)}
        </Text>
        <Text style={[styles.remainingLabel, { color: colors.mutedForeground }]}>
          remaining
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  consumed: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.5,
    lineHeight: 44,
  },
  unit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  dividerLine: {
    width: 32,
    height: 1,
    marginVertical: 6,
  },
  remaining: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  remainingLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
