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
import { useScan, type ScanRecord } from "@/context/ScanContext";
import { useColors } from "@/hooks/useColors";

function formatDate(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
      <Image
        source={{ uri: item.imageUri }}
        style={styles.thumb}
        contentFit="cover"
      />
      <View style={styles.cardContent}>
        <Text style={[styles.foodName, { color: colors.foreground }]} numberOfLines={1}>
          {item.nutrition.foodName}
        </Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formatDate(item.scannedAt)}
        </Text>
        <View style={styles.macroRow}>
          <View style={styles.macroPill}>
            <Text style={[styles.macroLabel, { color: colors.primary }]}>
              {Math.round(calories)} kcal
            </Text>
          </View>
          <Text style={[styles.macroSmall, { color: colors.mutedForeground }]}>
            P {Math.round(protein)}g · C {Math.round(carbs)}g · F {Math.round(fat)}g
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
    Alert.alert("Clear History", "Delete all scan history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
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
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={confirmClear} activeOpacity={0.7}>
            <Text style={[styles.clearText, { color: colors.destructive }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Feather name="clock" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No scans yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Scan food to see your history here
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
              paddingBottom:
                Platform.OS === "web" ? 34 + 84 + 16 : insets.bottom + 100,
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
  container: {
    flex: 1,
  },
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
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  macroPill: {
    paddingHorizontal: 0,
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
