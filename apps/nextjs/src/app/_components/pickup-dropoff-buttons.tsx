"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";
import { FeedbackDialog } from "./feedback-dialog";

interface PickupDropoffButtonsProps {
  itemId: string;
}

export function PickupDropoffButtons({ itemId }: PickupDropoffButtonsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [returnedLoanId, setReturnedLoanId] = useState<string | null>(null);

  const {
    data: reservation,
    isLoading,
    error,
  } = useQuery({
    ...trpc.loan.getCurrentUserReservation.queryOptions({ itemId }),
    retry: false, // Don't retry on auth errors
  });

  const markAsBorrowedMutation = useMutation(
    trpc.loan.markAsBorrowed.mutationOptions({
      onSuccess: async () => {
        toast.success("Item marked as picked up!");
        await queryClient.invalidateQueries(trpc.loan.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to mark item as picked up");
      },
    }),
  );

  const markAsReturnedMutation = useMutation(
    trpc.loan.markAsReturned.mutationOptions({
      onSuccess: async (data) => {
        toast.success("Item marked as returned!");
        await queryClient.invalidateQueries(trpc.loan.pathFilter());
        // Open feedback dialog
        setReturnedLoanId(data.id);
        setFeedbackDialogOpen(true);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to mark item as returned");
      },
    }),
  );

  // Always render feedback dialog if we have a returned loan ID
  const dialogElement = returnedLoanId ? (
    <FeedbackDialog
      open={feedbackDialogOpen}
      onOpenChange={(open) => {
        setFeedbackDialogOpen(open);
        if (!open) {
          setReturnedLoanId(null);
        }
      }}
      loanId={returnedLoanId}
      itemId={itemId}
    />
  ) : null;

  // Don't show anything if loading, error (e.g., not authenticated), or no reservation
  if (isLoading || error || !reservation) {
    return dialogElement;
  }

  const hasPickedUp = !!reservation.borrowedAt;
  const isActive = reservation.status === "active";

  // Show Pick Up button if approved/reserved but not picked up yet
  if (
    !hasPickedUp &&
    (reservation.status === "approved" || reservation.status === "reserved")
  ) {
    return (
      <>
        <div className="bg-background fixed right-0 bottom-0 left-0 z-50 border-t p-4 shadow-lg">
          <div className="container mx-auto flex max-w-4xl justify-center">
            <Button
              onClick={() => {
                markAsBorrowedMutation.mutate({ loanId: reservation.id });
              }}
              disabled={markAsBorrowedMutation.isPending}
              size="lg"
              className="w-full sm:w-auto"
            >
              {markAsBorrowedMutation.isPending ? "Processing..." : "Pick Up"}
            </Button>
          </div>
        </div>
        {dialogElement}
      </>
    );
  }

  // Show Drop Off button if picked up and active
  if (hasPickedUp && isActive) {
    return (
      <>
        <div className="bg-background fixed right-0 bottom-0 left-0 z-50 border-t p-4 shadow-lg">
          <div className="container mx-auto flex max-w-4xl justify-center">
            <Button
              onClick={() => {
                markAsReturnedMutation.mutate({ loanId: reservation.id });
              }}
              disabled={markAsReturnedMutation.isPending}
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {markAsReturnedMutation.isPending ? "Processing..." : "Drop Off"}
            </Button>
          </div>
        </div>
        {dialogElement}
      </>
    );
  }

  // Render feedback dialog even when not showing buttons (after return)
  return dialogElement;
}
