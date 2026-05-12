import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScan, type ScanRecord, MEAL_LABELS } from "@/context/ScanContext";
import { useColors } from "@/hooks/useColors";

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

function ScanCard({ item }: { item: ScanRecord }) {
  const colors = useColors();
  const router = useRouter();

  function onPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/result", params: { id: item.id } });
  }

  const { calories, protein, carbs, fat } = item.nutrition;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.imageUri }} style={styles.thumb} contentFit="cover" />
      <View style={styles.cardContent}>
        <Text style={[styles.foodName, { color: colors.foreground }]} numberOfLines={1}>
          {item.nutrition.foodName}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDate(item.scannedAt)}
          </Text>
          {item.mealType && (
            <View style={[styles.mealBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.mealBadgeText, { color: colors.mutedForeground }]}>
                {MEAL_LABELS[item.mealType]}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.macroRow}>
          <Text style={[styles.macroLabel, { color: colors.primary }]}>
            {Math.round(calories)} kcal
          </Text>
          <Text style={[styles.macroSmall, { color: colors.mutedForeground }]}>
            P {Math.round(protein)}g · C {Math.round(carbs)}g · G {Math.round(fat)}g
          </Text>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history, clearHistory, isLoading } = useScan();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function confirmClear() {
    Alert.alert("Borrar historial", "¿Eliminar todos los escaneos?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: () => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          clearHistory();
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Historial</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={confirmClear} activeOpacity={0.7}>
            <Text style={[styles.clearText, { color: colors.destructive }]}>Borrar</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Feather name="clock" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin escaneos aún</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Escanea un alimento para ver tu historial aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ScanCard item={item} />}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom: Platform.OS === "web" ? 34 + 84 + 16 : insets.bottom + 100,
            },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!history.length}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  clearText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    gap: 12,
    paddingRight: 16,
  },
  thumb: {
    width: 72,
    height: 72,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 12,
    gap: 4,
  },
  foodName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  mealBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mealBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  macroLabel: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  macroSmall: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
