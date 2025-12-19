import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";
import { colors } from "~/utils/theme";

type Loan = RouterOutputs["loan"]["getByBorrower"][number];

interface BorrowerLoanCardProps {
  loan: Loan;
}

function formatDateRange(
  startDate: Date | null,
  endDate: Date | null,
): string {
  if (!startDate || !endDate) return "No dates specified";
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} - ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function getStatusDisplay(loan: Loan): {
  label: string;
  bgColor: string;
  textColor: string;
} {
  const status = loan.status;
  const isBorrowed = !!loan.borrowedAt;

  switch (status) {
    case "pending":
      return {
        label: "Pending Approval",
        bgColor: "#FEF3C7",
        textColor: "#D97706",
      };
    case "approved":
      return {
        label: isBorrowed ? "Borrowed" : "Approved",
        bgColor: isBorrowed ? "#DBEAFE" : "#D1FAE5",
        textColor: isBorrowed ? "#1E40AF" : "#065F46",
      };
    case "reserved":
      return {
        label: isBorrowed ? "Borrowed" : "Reserved",
        bgColor: isBorrowed ? "#DBEAFE" : "#D1FAE5",
        textColor: isBorrowed ? "#1E40AF" : "#065F46",
      };
    case "active":
      return {
        label: "Currently Borrowed",
        bgColor: "#DBEAFE",
        textColor: "#1E40AF",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        bgColor: "#FEE2E2",
        textColor: "#991B1B",
      };
    case "rejected":
      return {
        label: "Rejected",
        bgColor: "#FEE2E2",
        textColor: "#991B1B",
      };
    case "returned":
      return {
        label: "Returned",
        bgColor: "#F3F4F6",
        textColor: "#374151",
      };
    default:
      return {
        label: status,
        bgColor: "#F3F4F6",
        textColor: "#374151",
      };
  }
}

export function BorrowerLoanCard({ loan }: BorrowerLoanCardProps) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation(
    trpc.loan.cancel.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.loan.pathFilter());
      },
      onError: (err) => {
        console.error("Failed to cancel loan:", err);
      },
    }),
  );

  const markAsBorrowedMutation = useMutation(
    trpc.loan.markAsBorrowed.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.loan.pathFilter());
      },
      onError: (err) => {
        console.error("Failed to mark as borrowed:", err);
      },
    }),
  );

  const markAsReturnedMutation = useMutation(
    trpc.loan.markAsReturned.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.loan.pathFilter());
      },
      onError: (err) => {
        console.error("Failed to mark as returned:", err);
      },
    }),
  );

  const ownerName = loan.item.owner.name || loan.item.owner.email || "Unknown";
  const isUpcoming =
    (loan.status === "pending" ||
      loan.status === "approved" ||
      loan.status === "reserved") &&
    !loan.borrowedAt;
  const isActive = loan.status === "active";

  // Check if we're within the time window (today is within or after reservedStartDate)
  const canMarkAsBorrowed = (() => {
    if (!isUpcoming) return false;
    if (!loan.reservedStartDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(loan.reservedStartDate);
    startDate.setHours(0, 0, 0, 0);
    return today >= startDate;
  })();

  const canCancel = ["pending", "approved", "reserved"].includes(loan.status);

  const statusDisplay = getStatusDisplay(loan);
  const isLoading =
    cancelMutation.isPending ||
    markAsBorrowedMutation.isPending ||
    markAsReturnedMutation.isPending;

  // Determine card background color based on status
  const cardBgColor =
    loan.status === "pending"
      ? "#FFFBEB"
      : isUpcoming
        ? "#F0FDF4"
        : isActive
          ? "#EFF6FF"
          : "#FFFFFF";

  const cardBorderColor =
    loan.status === "pending"
      ? "#FCD34D"
      : isUpcoming
        ? "#86EFAC"
        : isActive
          ? "#93C5FD"
          : colors.border.light;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBgColor,
          borderColor: cardBorderColor,
        },
      ]}
    >
      <Link
        href={{
          pathname: "/items/[id]",
          params: { id: loan.item.id },
        }}
        asChild
      >
        <Pressable>
          <View style={styles.cardContent}>
            <View style={styles.cardRow}>
              {/* Item Image */}
              <View style={styles.imageContainer}>
                {loan.item.imageUrl ? (
                  <Image
                    source={{ uri: loan.item.imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.imagePlaceholder}>📦</Text>
                )}
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={2}>
                      {loan.item.title}
                    </Text>
                    <Text style={styles.ownerText}>
                      From <Text style={styles.ownerName}>{ownerName}</Text>
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusDisplay.bgColor },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: statusDisplay.textColor }]}
                    >
                      {statusDisplay.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsContainer}>
                  <Text style={styles.detailsText}>
                    <Text style={styles.detailsLabel}>Dates: </Text>
                    {formatDateRange(loan.reservedStartDate, loan.reservedEndDate)}
                  </Text>

                  {loan.requestedAt && (
                    <Text style={styles.detailsText}>
                      <Text style={styles.detailsLabel}>Requested: </Text>
                      {new Date(loan.requestedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  )}

                  {loan.borrowedAt && (
                    <Text style={styles.detailsText}>
                      <Text style={styles.detailsLabel}>Picked Up: </Text>
                      {new Date(loan.borrowedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  )}

                  {loan.returnedAt && (
                    <Text style={styles.detailsText}>
                      <Text style={styles.detailsLabel}>Returned: </Text>
                      {new Date(loan.returnedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  )}

                  {loan.notes && (
                    <Text style={styles.detailsText}>
                      <Text style={styles.detailsLabel}>Notes: </Text>
                      {loan.notes}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      </Link>

      {/* Action Buttons */}
      {canCancel && (
        <View style={styles.actionsContainer}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={() => cancelMutation.mutate({ loanId: loan.id })}
            disabled={isLoading}
          >
            {cancelMutation.isPending ? (
              <ActivityIndicator
                size="small"
                color={colors.primaryForeground}
              />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Reservation</Text>
            )}
          </Pressable>
          {canMarkAsBorrowed && (
            <Pressable
              style={[styles.button, styles.markBorrowedButton]}
              onPress={() => markAsBorrowedMutation.mutate({ loanId: loan.id })}
              disabled={isLoading}
            >
              {markAsBorrowedMutation.isPending ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primaryForeground}
                />
              ) : (
                <Text style={styles.markBorrowedButtonText}>
                  Mark as Picked Up
                </Text>
              )}
            </Pressable>
          )}
        </View>
      )}

      {isActive && (
        <View style={styles.actionsContainer}>
          <Pressable
            style={[styles.button, styles.markReturnedButton]}
            onPress={() => markAsReturnedMutation.mutate({ loanId: loan.id })}
            disabled={isLoading}
          >
            {markAsReturnedMutation.isPending ? (
              <ActivityIndicator
                size="small"
                color={colors.primaryForeground}
              />
            ) : (
              <Text style={styles.markReturnedButtonText}>
                Mark as Returned
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  cardContent: {
    padding: 16,
  },
  cardRow: {
    flexDirection: "row",
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#F4F4F5",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    fontSize: 40,
    opacity: 0.5,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
    minWidth: 0, // Allows text to wrap properly
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground.light,
    marginBottom: 4,
    lineHeight: 24,
  },
  ownerText: {
    fontSize: 14,
    color: colors.mutedForeground.light,
  },
  ownerName: {
    fontWeight: "600",
    color: colors.foreground.light,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0, // Prevents badge from shrinking
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailsText: {
    fontSize: 14,
    color: colors.mutedForeground.light,
    marginBottom: 4,
    lineHeight: 20,
  },
  detailsLabel: {
    fontWeight: "600",
    color: colors.foreground.light,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground.light,
  },
  markBorrowedButton: {
    backgroundColor: "#3B82F6",
  },
  markBorrowedButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  markReturnedButton: {
    backgroundColor: "#10B981",
  },
  markReturnedButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

