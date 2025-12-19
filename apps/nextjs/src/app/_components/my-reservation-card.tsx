"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ImageIcon, User } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";
import { FeedbackDialog } from "./feedback-dialog";

type Reservation = RouterOutputs["loan"]["getByBorrower"][number];

interface MyReservationCardProps {
  reservation: Reservation;
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

function getStatusDisplay(reservation: Reservation): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
} {
  const status = reservation.status;
  const isBorrowed = !!reservation.borrowedAt;

  switch (status) {
    case "pending":
      return {
        label: "pending",
        variant: "outline",
        color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
      };
    case "approved":
      return {
        label: isBorrowed ? "borrowed" : "approved - ready to pick up",
        variant: isBorrowed ? "secondary" : "default",
        color: isBorrowed
          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
          : "bg-green-500/20 text-green-600 dark:text-green-400",
      };
    case "reserved":
      return {
        label: isBorrowed ? "borrowed" : "reserved",
        variant: isBorrowed ? "secondary" : "default",
        color: isBorrowed
          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
          : "bg-green-500/20 text-green-600 dark:text-green-400",
      };
    case "active":
      return {
        label: "borrowed",
        variant: "secondary",
        color: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
      };
    case "rejected":
    case "cancelled":
      return {
        label: status,
        variant: "destructive",
        color: "bg-red-500/20 text-red-600 dark:text-red-400",
      };
    case "returned":
      return {
        label: "returned",
        variant: "secondary",
        color: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
      };
    default:
      return {
        label: status,
        variant: "outline",
        color: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
      };
  }
}

function isFutureReservation(reservation: Reservation): boolean {
  if (!reservation.reservedStartDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(reservation.reservedStartDate);
  startDate.setHours(0, 0, 0, 0);
  return startDate > today;
}

function canCancel(reservation: Reservation): boolean {
  const cancellableStatuses = ["pending", "approved", "reserved"];
  return (
    cancellableStatuses.includes(reservation.status) &&
    isFutureReservation(reservation)
  );
}

export function MyReservationCard({ reservation }: MyReservationCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [returnedLoanId, setReturnedLoanId] = useState<string | null>(null);

  const cancelMutation = useMutation(
    trpc.loan.cancel.mutationOptions({
      onSuccess: async () => {
        toast.success("Reservation cancelled");
        await queryClient.invalidateQueries(trpc.loan.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "FORBIDDEN"
            ? "You can only cancel your own reservations"
            : err.message || "Failed to cancel reservation",
        );
      },
    }),
  );

  const markAsBorrowedMutation = useMutation(
    trpc.loan.markAsBorrowed.mutationOptions({
      onSuccess: async () => {
        toast.success("Item marked as picked up");
        await queryClient.invalidateQueries(trpc.loan.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.message || "Failed to mark item as picked up",
        );
      },
    }),
  );

  const markAsReturnedMutation = useMutation(
    trpc.loan.markAsReturned.mutationOptions({
      onSuccess: async (data) => {
        toast.success("Item marked as returned");
        await queryClient.invalidateQueries(trpc.loan.pathFilter());
        // Open feedback dialog
        setReturnedLoanId(data.id);
        setFeedbackDialogOpen(true);
      },
      onError: (err) => {
        toast.error(
          err.message || "Failed to mark item as returned",
        );
      },
    }),
  );

  const ownerName =
    reservation.item.owner?.name ||
    reservation.item.owner?.email ||
    "Unknown";

  const isApprovedNotBorrowed =
    (reservation.status === "approved" || reservation.status === "reserved") &&
    !reservation.borrowedAt;

  // Check if we're within the time window (today is within or after reservedStartDate)
  const canMarkAsBorrowed = (() => {
    if (!isApprovedNotBorrowed) return false;
    if (!reservation.reservedStartDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(reservation.reservedStartDate);
    startDate.setHours(0, 0, 0, 0);
    return today >= startDate;
  })();

  // Can cancel if future reservation OR approved/reserved and not yet borrowed
  const showCancelButton = canCancel(reservation) || isApprovedNotBorrowed;

  // Check if loan is active (currently borrowed)
  const isActive = reservation.status === "active" && !!reservation.borrowedAt;

  // Check if item is past due (active and past reservedEndDate)
  const isPastDue = (() => {
    if (!isActive) return false;
    if (!reservation.reservedEndDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(reservation.reservedEndDate);
    endDate.setHours(0, 0, 0, 0);
    return today > endDate;
  })();

  return (
    <>
      <Link href={`/items/${reservation.item.id}`}>
        <div
          className={`hover:bg-muted/80 border-border hover:border-primary/50 group cursor-pointer rounded-lg border p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
            isApprovedNotBorrowed
              ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
              : isPastDue
                ? "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                : "bg-muted"
          }`}
        >
        <div className="flex gap-4">
          {/* Item Image */}
          <div className="bg-muted-foreground/10 border-border group-hover:border-primary/50 relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border transition-all duration-200 group-hover:scale-105">
            {reservation.item.imageUrl ? (
              <Image
                src={reservation.item.imageUrl}
                alt={reservation.item.title}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-110"
              />
            ) : (
              <ImageIcon className="text-muted-foreground group-hover:text-primary size-8 transition-colors duration-200" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-primary group-hover:text-primary/80 mb-1 truncate text-xl font-bold transition-colors duration-200">
                  {reservation.item.title}
                </h3>
                <div className="flex items-center gap-2">
                  {reservation.item.owner?.image ? (
                    <div className="border-border relative mt-0.5 size-6 shrink-0 overflow-hidden rounded-full border">
                      <Image
                        src={reservation.item.owner.image}
                        alt={ownerName}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <User className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  )}
                  <p className="text-muted-foreground text-sm">
                    Owner: <span className="font-medium">{ownerName}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                {isApprovedNotBorrowed && (
                  <p className="text-green-600 dark:text-green-400 font-medium text-sm">
                    ✓ Approved - Ready to pick up
                  </p>
                )}
                {isActive && (
                  <p className={isPastDue ? "text-red-600 dark:text-red-400 font-medium text-sm" : "text-blue-600 dark:text-blue-400 font-medium text-sm"}>
                    {isPastDue ? "⚠ Past due - please return" : "✓ Item picked up - enjoy!"}
                  </p>
                )}
                {reservation.borrowedAt ? (
                  <p className="text-muted-foreground text-xs">
                    Borrowed on: {new Date(reservation.borrowedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                ) : reservation.requestedAt && (
                  <p className="text-muted-foreground text-xs">
                    Requested {new Date(reservation.requestedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="mb-3 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium">Dates:</span>{" "}
                {formatDateRange(
                  reservation.reservedStartDate,
                  reservation.reservedEndDate,
                )}
              </p>
              {(showCancelButton || canMarkAsBorrowed || isActive) && (
                <div className="mt-4 flex items-center gap-4">
                  {showCancelButton && (
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        cancelMutation.mutate({ loanId: reservation.id });
                      }}
                      disabled={cancelMutation.isPending || markAsBorrowedMutation.isPending || markAsReturnedMutation.isPending}
                      variant="destructive"
                      size="sm"
                    >
                      {cancelMutation.isPending ? "Cancelling..." : "Cancel"}
                    </Button>
                  )}
                  {canMarkAsBorrowed && (
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markAsBorrowedMutation.mutate({ loanId: reservation.id });
                      }}
                      disabled={markAsBorrowedMutation.isPending || cancelMutation.isPending || markAsReturnedMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      size="sm"
                    >
                      {markAsBorrowedMutation.isPending ? "Marking..." : "Mark as Picked Up"}
                    </Button>
                  )}
                  {isActive && (
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markAsReturnedMutation.mutate({ loanId: reservation.id });
                      }}
                      disabled={markAsReturnedMutation.isPending || cancelMutation.isPending || markAsBorrowedMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                      size="sm"
                    >
                      {markAsReturnedMutation.isPending ? "Returning..." : "Mark as Returned"}
                    </Button>
                  )}
                </div>
              )}
              {reservation.notes && (
                <p className="text-muted-foreground mt-1">
                  <span className="font-medium">Notes:</span> {reservation.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
    {returnedLoanId && (
      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={(open) => {
          setFeedbackDialogOpen(open);
          if (!open) {
            setReturnedLoanId(null);
          }
        }}
        loanId={returnedLoanId}
        itemId={reservation.item.id}
      />
    )}
    </>
  );
}

