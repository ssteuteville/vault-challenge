import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import { authClient } from "~/utils/auth";
import { colors } from "~/utils/theme";

interface HeaderProps {
  showLogout?: boolean;
}

export function Header({ showLogout = true }: HeaderProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!session) return;
    
    setIsLoggingOut(true);
    try {
      // better-auth signOut method
      await authClient.signOut();
      // Navigate to home/index screen after logout
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>VAULT</Text>
      </View>
      {showLogout && session && (
        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.logoutText}>Logout</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: -1,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.card.light,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground.light,
  },
});

