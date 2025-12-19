import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "~/utils/theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.secondary.light,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground.light,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: colors.mutedForeground.light,
    textAlign: "center",
    lineHeight: 24,
  },
});

export default function BorrowingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📥</Text>
        </View>
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.description}>
          Manage your borrowed items and reservations. This feature is being built and will be available soon!
        </Text>
      </View>
    </SafeAreaView>
  );
}

