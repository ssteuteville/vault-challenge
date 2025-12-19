import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trpc } from "~/utils/api";
import { colors } from "~/utils/theme";

interface ReservationModalProps {
  visible: boolean;
  onClose: () => void;
  itemId: string;
  requiresApproval: boolean;
}

export function ReservationModal({
  visible,
  onClose,
  itemId,
  requiresApproval,
}: ReservationModalProps) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch future reservations to check for conflicts
  const { data: futureReservations } = useQuery({
    ...trpc.loan.getFutureReservations.queryOptions({ itemId }),
    enabled: visible,
  });

  // Create reservation mutation
  const createReservation = useMutation(
    trpc.loan.create.mutationOptions({
      onSuccess: () => {
        // Invalidate queries to refresh data
        void queryClient.invalidateQueries(trpc.loan.pathFilter());
        void queryClient.invalidateQueries(trpc.item.pathFilter());
        // Reset form and close modal
        setStartDate(new Date());
        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + 1);
        setEndDate(newEndDate);
        setNotes("");
        setError(null);
        onClose();
      },
      onError: (err: any) => {
        if (err.data?.code === "UNAUTHORIZED") {
          setError("You must be logged in to reserve an item");
        } else if (err.data?.code === "CONFLICT") {
          setError(
            err.message || "This item is already reserved for the selected dates",
          );
        } else if (err.data?.code === "FORBIDDEN") {
          setError(err.message || "You cannot reserve your own item");
        } else {
          setError(err.message || "Failed to create reservation");
        }
      },
    }),
  );

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowStartPicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
      // If end date is before new start date, update end date
      if (endDate < selectedDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setDate(newEndDate.getDate() + 1);
        setEndDate(newEndDate);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowEndPicker(false);
    }
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const validateDates = (): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (start < today) {
      setError("Start date cannot be in the past");
      return false;
    }

    if (end < start) {
      setError("End date must be after start date");
      return false;
    }

    // Check for conflicts with existing reservations
    if (futureReservations) {
      const hasConflict = futureReservations.some((reservation) => {
        if (!reservation.reservedStartDate || !reservation.reservedEndDate) {
          return false;
        }
        const existingStart = new Date(reservation.reservedStartDate);
        existingStart.setHours(0, 0, 0, 0);
        const existingEnd = new Date(reservation.reservedEndDate);
        existingEnd.setHours(0, 0, 0, 0);

        // Check if ranges overlap: start1 <= end2 AND start2 <= end1
        return start <= existingEnd && existingStart <= end;
      });

      if (hasConflict) {
        setError("This item is already reserved for the selected dates");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = () => {
    setError(null);
    if (!validateDates()) {
      return;
    }

    createReservation.mutate({
      itemId,
      reservedStartDate: startDate,
      reservedEndDate: endDate,
      notes: notes.trim() || null,
    });
  };

  const handleClose = () => {
    if (!createReservation.isPending) {
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
            disabled={createReservation.isPending}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Reserve Item</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.description}>
            Select the dates you would like to reserve this item.
            {requiresApproval &&
              " Your request will need to be approved by the owner."}
          </Text>

          {/* Start Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Start Date</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
              disabled={createReservation.isPending}
            >
              <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
              <Text style={styles.dateButtonIcon}>📅</Text>
            </Pressable>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleStartDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* End Date */}
          <View style={styles.field}>
            <Text style={styles.label}>End Date</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
              disabled={createReservation.isPending}
            >
              <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
              <Text style={styles.dateButtonIcon}>📅</Text>
            </Pressable>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleEndDateChange}
                minimumDate={startDate}
              />
            )}
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about your reservation..."
              placeholderTextColor={colors.mutedForeground.light}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!createReservation.isPending}
            />
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
              createReservation.isPending && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={createReservation.isPending}
          >
            {createReservation.isPending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={styles.submitButtonText}>
                {requiresApproval ? "Request Reservation" : "Reserve"}
              </Text>
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
  dateButton: {
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
  dateButtonText: {
    fontSize: 16,
    color: colors.foreground.light,
    fontWeight: "500",
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  notesInput: {
    backgroundColor: colors.card.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.foreground.light,
    borderWidth: 1,
    borderColor: colors.border.light,
    minHeight: 100,
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

