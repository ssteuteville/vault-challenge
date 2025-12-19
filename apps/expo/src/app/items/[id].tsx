import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useGlobalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { ReservationModal } from "~/components/ReservationModal";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { colors } from "~/utils/theme";

export default function ItemDetail() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const { data: session } = authClient.useSession();
  const [reservationModalVisible, setReservationModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const {
    data: item,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    ...trpc.item.byId.queryOptions({ id: id || "" }),
    enabled: !!id,
  });

  const { data: futureReservations = [] } = useQuery({
    ...trpc.loan.getFutureReservations.queryOptions({ itemId: id || "" }),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Stack.Screen
          options={{
            title: "Item",
            headerStyle: {
              backgroundColor: colors.background.light,
            },
            headerTintColor: colors.foreground.light,
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 18,
            },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading item...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Stack.Screen
          options={{
            title: "Item Not Found",
            headerStyle: {
              backgroundColor: colors.background.light,
            },
            headerTintColor: colors.foreground.light,
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>Item Not Found</Text>
          <Text style={styles.emptyText}>
            The item you're looking for doesn't exist or has been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const effectiveStatus =
    (item as { effectiveStatus?: string }).effectiveStatus ?? item.status;

  const categories = item.category
    ? item.category.split(", ").filter(Boolean)
    : [];

  const statusConfig = {
    available: {
      bg: colors.status.available,
      label: "Available",
    },
    borrowed: {
      bg: colors.status.borrowed,
      label: "Borrowed",
    },
    unavailable: {
      bg: colors.status.unavailable,
      label: "Unavailable",
    },
  };

  const statusStyle =
    effectiveStatus in statusConfig
      ? statusConfig[effectiveStatus as keyof typeof statusConfig]
      : statusConfig.unavailable;

  const canReserve =
    session?.user &&
    session.user.id !== item.ownerId &&
    item.status === "available";

  const formatDate = (date: Date | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: item.title,
          headerStyle: {
            backgroundColor: colors.background.light,
          },
          headerTintColor: colors.foreground.light,
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Image */}
        <Pressable
          onPress={() => setImageModalVisible(true)}
          style={styles.imageContainer}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📦</Text>
            </View>
          )}
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={styles.statusBadgeText}>{statusStyle.label}</Text>
          </View>
        </Pressable>

        {/* Content Card */}
        <View
          style={[
            styles.contentCard,
            canReserve && styles.contentCardWithButton,
          ]}
        >
          {/* Title and Categories */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>{item.title}</Text>
            {categories.length > 0 && (
              <View style={styles.categoriesContainer}>
                {categories.slice(0, 3).map((category) => (
                  <View key={category} style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{category}</Text>
                  </View>
                ))}
                {categories.length > 3 && (
                  <View style={[styles.categoryTag, styles.categoryTagMore]}>
                    <Text
                      style={[styles.categoryText, styles.categoryTextMore]}
                    >
                      +{categories.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text
              style={styles.description}
              numberOfLines={descriptionExpanded ? undefined : 2}
            >
              {item.description}
            </Text>
            <Pressable
              onPress={() => setDescriptionExpanded(!descriptionExpanded)}
              style={styles.expandButton}
            >
              <Text style={styles.expandButtonText}>
                {descriptionExpanded ? "Show less" : "Read more"}
              </Text>
            </Pressable>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            {/* Owner */}
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Text style={styles.detailIconText}>👤</Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Owner</Text>
                <Text style={styles.detailValue}>
                  {item.owner.name || item.owner.email || "Unknown"}
                </Text>
              </View>
            </View>

            {/* Approval Required */}
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Text style={styles.detailIconText}>
                  {item.requiresApproval ? "✅" : "❌"}
                </Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Approval Required</Text>
                <Text style={styles.detailValue}>
                  {item.requiresApproval ? "Yes" : "No"}
                </Text>
              </View>
            </View>

            {/* Created Date */}
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Text style={styles.detailIconText}>📅</Text>
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Upcoming Reservations */}
          {futureReservations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Reservations</Text>
              <View style={styles.reservationsList}>
                {futureReservations.map((reservation) => (
                  <View key={reservation.id} style={styles.reservationItem}>
                    <View style={styles.reservationContent}>
                      <Text style={styles.reservationBorrower}>
                        {reservation.borrower.name ||
                          reservation.borrower.email ||
                          "Unknown"}
                      </Text>
                      <Text style={styles.reservationDates}>
                        {formatDate(reservation.reservedStartDate)} -{" "}
                        {formatDate(reservation.reservedEndDate)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.reservationStatusBadge,
                        {
                          backgroundColor:
                            reservation.status === "pending"
                              ? colors.status.borrowed + "40"
                              : colors.status.available + "40",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.reservationStatusText,
                          {
                            color:
                              reservation.status === "pending"
                                ? colors.status.borrowed
                                : colors.status.available,
                          },
                        ]}
                      >
                        {reservation.status === "pending"
                          ? "Pending"
                          : reservation.status === "approved"
                            ? "Approved"
                            : reservation.status === "reserved"
                              ? "Reserved"
                              : reservation.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Reserve Button */}
      {canReserve && (
        <Pressable
          style={styles.reserveButton}
          onPress={() => setReservationModalVisible(true)}
        >
          <Text style={styles.reserveButtonText}>Reserve</Text>
        </Pressable>
      )}

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <Pressable
          style={styles.imageModalBackdrop}
          onPress={() => setImageModalVisible(false)}
        >
          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.imageModalImage}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>

      {/* Reservation Modal */}
      <ReservationModal
        visible={reservationModalVisible}
        onClose={() => setReservationModalVisible(false)}
        itemId={item.id}
        requiresApproval={item.requiresApproval}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.mutedForeground.light,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground.light,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.mutedForeground.light,
    textAlign: "center",
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: colors.muted.light,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.muted.light,
  },
  imagePlaceholderIcon: {
    fontSize: 80,
    opacity: 0.3,
  },
  statusBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  contentCard: {
    flex: 1,
    backgroundColor: colors.card.light,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  contentCardWithButton: {
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.foreground.light,
    marginBottom: 12,
    lineHeight: 36,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryTag: {
    backgroundColor: colors.secondary.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryTagMore: {
    backgroundColor: colors.muted.light,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  categoryTextMore: {
    color: colors.mutedForeground.light,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground.light,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.mutedForeground.light,
    lineHeight: 24,
  },
  expandButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  detailsGrid: {
    gap: 16,
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary.light,
    alignItems: "center",
    justifyContent: "center",
  },
  detailIconText: {
    fontSize: 20,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.mutedForeground.light,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.foreground.light,
  },
  reservationsList: {
    gap: 12,
  },
  reservationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.muted.light,
    borderRadius: 12,
    padding: 16,
  },
  reservationContent: {
    flex: 1,
  },
  reservationBorrower: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground.light,
    marginBottom: 4,
  },
  reservationDates: {
    fontSize: 14,
    color: colors.mutedForeground.light,
  },
  reservationStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reservationStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reserveButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  reserveButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primaryForeground,
  },
  imageModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageModalImage: {
    width: "100%",
    height: "100%",
  },
});
