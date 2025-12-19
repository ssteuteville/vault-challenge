"use client";

import Link from "next/link";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

type Reservation = RouterOutputs["loan"]["getByOwner"][number];

interface ReservationCardProps {
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

export function ReservationCard({ reservation }: ReservationCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const approveMutation = useMutation(
    trpc.loan.approve.mutationOptions({
      onSuccess: async () => {
        toast.success("Reservation approved!");
        await queryClient.invalidateQueries(trpc.loan.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "FORBIDDEN"
            ? "You can only approve reservations for your own items"
            : err.message || "Failed to approve reservation",
        );
      },
    }),
  );

  const rejectMutation = useMutation(
    trpc.loan.reject.mutationOptions({
      onSuccess: async () => {
        toast.success("Reservation rejected");
        await queryClient.invalidateQueries(trpc.loan.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "FORBIDDEN"
            ? "You can only reject reservations for your own items"
            : err.message || "Failed to reject reservation",
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

  const isPending = reservation.status === "pending";
  const borrowerName = reservation.borrower.name || reservation.borrower.email || "Unknown";
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

  return (
    <div
      className={`rounded-lg border p-6 transition-all duration-200 ${
        isPending
          ? "bg-yellow-50/50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800"
          : isApprovedNotBorrowed
            ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
            : "bg-muted border-border"
      }`}
    >
      <div className="flex gap-4">
        {/* Item Image */}
        <Link href={`/items/${reservation.item.id}`}>
          <div className="bg-muted-foreground/10 border-border relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border transition-all duration-200 hover:scale-105">
            {reservation.item.imageUrl ? (
              <Image
                src={reservation.item.imageUrl}
                alt={reservation.item.title}
                fill
                className="object-cover transition-transform duration-200 hover:scale-110"
              />
            ) : (
              <ImageIcon className="text-muted-foreground size-8 transition-colors duration-200" />
            )}
          </div>
        </Link>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Link href={`/items/${reservation.item.id}`}>
                <h3 className="text-primary hover:text-primary/80 mb-1 truncate text-xl font-bold transition-colors duration-200">
                  {reservation.item.title}
                </h3>
              </Link>
              <p className="text-muted-foreground text-sm">
                Requested by <span className="font-medium">{borrowerName}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              {isApprovedNotBorrowed && (
                <p className="text-green-600 dark:text-green-400 font-medium text-sm">
                  ✓ Approved - Ready to pick up
                </p>
              )}
              {reservation.requestedAt && (
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
            {canMarkAsBorrowed && (
              <div className="mt-2 inline-flex items-center gap-2">
                <Button
                  onClick={() => rejectMutation.mutate({ loanId: reservation.id })}
                  disabled={rejectMutation.isPending || markAsBorrowedMutation.isPending}
                  variant="destructive"
                  size="sm"
                >
                  {rejectMutation.isPending ? "Cancelling..." : "Cancel"}
                </Button>
                <Button
                  onClick={() => markAsBorrowedMutation.mutate({ loanId: reservation.id })}
                  disabled={markAsBorrowedMutation.isPending || rejectMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  size="sm"
                >
                  {markAsBorrowedMutation.isPending ? "Marking..." : "Mark as Picked Up"}
                </Button>
              </div>
            )}
            {reservation.borrowedAt && (
              <p className="text-muted-foreground mt-1">
                <span className="font-medium">Borrowed on:</span>{" "}
                {new Date(reservation.borrowedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
            {reservation.notes && (
              <p className="text-muted-foreground mt-1">
                <span className="font-medium">Notes:</span> {reservation.notes}
              </p>
            )}
          </div>

          {/* Action Buttons for Pending Reservations */}
          {isPending && (
            <div className="flex gap-2">
              <Button
                onClick={() => approveMutation.mutate({ loanId: reservation.id })}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              >
                {approveMutation.isPending ? "Approving..." : "Approve"}
              </Button>
              <Button
                onClick={() => rejectMutation.mutate({ loanId: reservation.id })}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                variant="destructive"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

