import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LegendList } from "@legendapp/list";
import { useQuery } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { colors } from "~/utils/theme";
import { LoanCard } from "~/components/LoanCard";
import { Header } from "~/components/Header";

type Loan = Parameters<typeof LoanCard>[0]["loan"];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.secondary.light,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground.light,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.mutedForeground.light,
    textAlign: "center",
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.mutedForeground.light,
    fontWeight: "500",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground.light,
    marginRight: 12,
  },
  badge: {
    backgroundColor: "#FCD34D",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400E",
  },
  historyToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.card.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: 12,
  },
  historyToggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground.light,
  },
  signInButton: {
    backgroundColor: colors.primary,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 32,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primaryForeground,
  },
});

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Text style={{ fontSize: 48 }}>📤</Text>
      </View>
      <Text style={styles.emptyTitle}>No Loan Requests Yet</Text>
      <Text style={styles.emptyText}>
        When someone requests to borrow your items, they'll appear here for approval.
      </Text>
    </View>
  );
}

function SignInPrompt() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={{ fontSize: 56, fontWeight: "900", color: colors.primary, marginBottom: 24, letterSpacing: -1 }}>
        VAULT
      </Text>
      <View style={styles.emptyIcon}>
        <Text style={{ fontSize: 48 }}>🔐</Text>
      </View>
      <Text style={styles.emptyTitle}>Sign In Required</Text>
      <Text style={styles.emptyText}>
        Sign in to manage loan requests for your shared items
      </Text>
      <Pressable
        onPress={() =>
          authClient.signIn.social({
            provider: "discord",
            callbackURL: "/",
          })
        }
        style={styles.signInButton}
      >
        <Text style={styles.signInButtonText}>Sign in with Discord</Text>
      </Pressable>
    </View>
  );
}

function LoanSections() {
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: loans = [], isLoading, error, refetch } = useQuery({
    ...trpc.loan.getByOwner.queryOptions(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Separate loans into categories
  const { pending, active, history } = useMemo(() => {
    const pendingLoans: Loan[] = [];
    const activeLoans: Loan[] = [];
    const historyLoans: Loan[] = [];

    loans.forEach((loan) => {
      if (loan.status === "pending") {
        pendingLoans.push(loan);
      } else if (
        ["approved", "reserved", "active"].includes(loan.status)
      ) {
        activeLoans.push(loan);
      } else if (
        ["returned", "cancelled", "rejected"].includes(loan.status)
      ) {
        historyLoans.push(loan);
      }
    });

    return {
      pending: pendingLoans,
      active: activeLoans,
      history: historyLoans,
    };
  }, [loans]);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading loan requests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.emptyContainer}
      >
        <Text style={styles.emptyTitle}>Failed to load loans</Text>
        <Text style={styles.emptyText}>
          {error instanceof Error ? error.message : "An error occurred"}
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={{
            marginTop: 16,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: colors.primary,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.primaryForeground, fontWeight: "600" }}>
            Try Again
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (loans.length === 0) {
    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <EmptyState />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Pending Approval Section - Primary Focus */}
      {pending.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Approval</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pending.length}</Text>
            </View>
          </View>
          {pending.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </View>
      )}

      {/* Active Loans Section */}
      {active.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {pending.length > 0 ? "Active Loans" : "Loans"}
            </Text>
          </View>
          {active.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </View>
      )}

      {/* History Section - Collapsible */}
      {history.length > 0 && (
        <View style={styles.section}>
          <Pressable
            style={styles.historyToggle}
            onPress={() => setHistoryExpanded(!historyExpanded)}
          >
            <Text style={styles.historyToggleText}>
              Loan History ({history.length})
            </Text>
            <Text style={{ fontSize: 18, color: colors.mutedForeground.light }}>
              {historyExpanded ? "▼" : "▶"}
            </Text>
          </Pressable>
          {historyExpanded && (
            <View>
              {history.map((loan) => (
                <LoanCard key={loan.id} loan={loan} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Show message if no loans in any category */}
      {pending.length === 0 && active.length === 0 && history.length === 0 && (
        <EmptyState />
      )}
    </ScrollView>
  );
}

export default function SharingScreen() {
  const { data: session } = authClient.useSession();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header />
      {session?.user ? <LoanSections /> : <SignInPrompt />}
    </SafeAreaView>
  );
}
