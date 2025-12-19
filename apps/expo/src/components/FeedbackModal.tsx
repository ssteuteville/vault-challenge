import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Switch,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { colors } from "~/utils/theme";

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  loanId: string;
  itemId: string;
}

export function FeedbackModal({
  visible,
  onClose,
  loanId,
  itemId,
}: FeedbackModalProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFeedbackMutation = useMutation(
    trpc.feedback.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.feedback.pathFilter());
        await queryClient.invalidateQueries(trpc.item.pathFilter());
        setContent("");
        setIsPublic(false);
        setError(null);
        onClose();
      },
      onError: (err: any) => {
        setError(err.message || "Failed to submit feedback");
      },
    }),
  );

  const handleSubmit = () => {
    setError(null);
    if (!content.trim()) {
      setError("Please enter feedback content");
      return;
    }
    createFeedbackMutation.mutate({
      loanId,
      content: content.trim(),
      isPublic,
    });
  };

  const handleClose = () => {
    if (!createFeedbackMutation.isPending) {
      setContent("");
      setIsPublic(false);
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleClose}
            disabled={createFeedbackMutation.isPending}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Skip</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Leave Feedback</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.description}>
            Share your experience with this item. You can mark feedback as
            public (visible to everyone) or private (visible only to the item
            owner).
          </Text>

          {/* Feedback Content */}
          <View style={styles.field}>
            <Text style={styles.label}>Feedback</Text>
            <TextInput
              style={styles.feedbackInput}
              value={content}
              onChangeText={setContent}
              placeholder="How was your experience with this item?"
              placeholderTextColor={colors.mutedForeground.light}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!createFeedbackMutation.isPending}
            />
          </View>

          {/* Public/Private Toggle */}
          <View style={styles.field}>
            <View style={styles.toggleContainer}>
              <View style={styles.toggleLabelContainer}>
                <Text style={styles.toggleLabel}>Make this feedback public</Text>
                <Text style={styles.toggleDescription}>
                  {isPublic
                    ? "Public feedback will be visible to everyone on the item details page."
                    : "Private feedback will only be visible to the item owner."}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                disabled={createFeedbackMutation.isPending}
                trackColor={{
                  false: colors.border.light,
                  true: colors.primary + "80",
                }}
                thumbColor={isPublic ? colors.primary : colors.mutedForeground.light}
              />
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.submitButton,
              (createFeedbackMutation.isPending || !content.trim()) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={createFeedbackMutation.isPending || !content.trim()}
          >
            {createFeedbackMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground.light,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: colors.mutedForeground.light,
    lineHeight: 24,
    marginBottom: 24,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground.light,
    marginBottom: 8,
  },
  feedbackInput: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.foreground.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    minHeight: 120,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.foreground.light,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: colors.mutedForeground.light,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: colors.destructive + "15",
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.destructive,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primaryForeground,
  },
});

