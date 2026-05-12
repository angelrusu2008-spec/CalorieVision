import { useState, useEffect } from "react";

const light = {
  background: "#F7F7F5",
  foreground: "#1A1A1A",
  card: "#FFFFFF",
  cardForeground: "#1A1A1A",
  border: "#E8E8E4",
  mutedForeground: "#8A8A8A",
  primary: "#00D26A",
  primaryForeground: "#FFFFFF",
  secondary: "#F0F0ED",
  destructive: "#F74F4F",
};

const dark = {
  background: "#0D0D0D",
  foreground: "#FAFAFA",
  card: "#1A1A1A",
  cardForeground: "#FAFAFA",
  border: "#2D2D2D",
  mutedForeground: "#6B6B6B",
  primary: "#00D26A",
  primaryForeground: "#0D0D0D",
  secondary: "#1F1F1F",
  destructive: "#F74F4F",
};

export function useColors() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDark ? dark : light;
}
