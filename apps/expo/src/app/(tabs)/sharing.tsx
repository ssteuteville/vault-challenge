import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    backgroundColor: "#F3E8FF",
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
    color: "#18181B",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#71717A",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default function SharingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📤</Text>
        </View>
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.description}>
          Share your items with the community. This feature is being built and will be available soon!
        </Text>
      </View>
    </SafeAreaView>
  );
}

