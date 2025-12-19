import { useQuery } from "@tanstack/react-query";
import { StyleSheet, Text, View, Image } from "react-native";

import { trpc } from "~/utils/api";
import { colors } from "~/utils/theme";

interface ItemFeedbacksProps {
  itemId: string;
}

export function ItemFeedbacks({ itemId }: ItemFeedbacksProps) {
  const { data: feedbacks, isLoading } = useQuery({
    ...trpc.feedback.getByItem.queryOptions({ itemId }),
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Feedback</Text>
        <Text style={styles.loadingText}>Loading feedback...</Text>
      </View>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return null;
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Feedback</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{feedbacks.length}</Text>
        </View>
      </View>
      <View style={styles.feedbacksList}>
        {feedbacks.map((feedback) => (
          <View key={feedback.id} style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <View style={styles.borrowerInfo}>
                {feedback.borrower?.image ? (
                  <Image
                    source={{ uri: feedback.borrower.image }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>👤</Text>
                  </View>
                )}
                <View style={styles.borrowerDetails}>
                  <Text style={styles.borrowerName}>
                    {feedback.borrower?.name ||
                      feedback.borrower?.email ||
                      "Anonymous"}
                  </Text>
                  <Text style={styles.feedbackDate}>
                    {formatDate(feedback.createdAt)}
                  </Text>
                </View>
              </View>
              {!feedback.isPublic && (
                <View style={styles.privateBadge}>
                  <Text style={styles.privateBadgeText}>Private</Text>
                </View>
              )}
            </View>
            <Text style={styles.feedbackContent}>{feedback.content}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground.light,
  },
  badge: {
    backgroundColor: colors.secondary.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  loadingText: {
    fontSize: 14,
    color: colors.mutedForeground.light,
  },
  feedbacksList: {
    gap: 12,
  },
  feedbackCard: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  borrowerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary.light,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  avatarText: {
    fontSize: 20,
  },
  borrowerDetails: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground.light,
    marginBottom: 2,
  },
  feedbackDate: {
    fontSize: 12,
    color: colors.mutedForeground.light,
  },
  privateBadge: {
    backgroundColor: colors.muted.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  privateBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.mutedForeground.light,
  },
  feedbackContent: {
    fontSize: 15,
    color: colors.foreground.light,
    lineHeight: 22,
  },
});

