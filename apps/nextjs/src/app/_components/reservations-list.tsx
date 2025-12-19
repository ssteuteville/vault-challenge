"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

import { Button } from "@acme/ui/button";

import { useTRPC } from "~/trpc/react";
import { ReservationCard } from "./reservation-card";

export function ReservationsList() {
  const trpc = useTRPC();

  const { data: reservations, isLoading, error, refetch } = useQuery({
    ...trpc.loan.getByOwner.queryOptions(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-muted border-border animate-pulse rounded-lg border p-6">
          <div className="bg-muted-foreground/20 mb-2 h-6 w-3/4 rounded" />
          <div className="bg-muted-foreground/20 mb-4 h-4 w-full rounded" />
          <div className="flex items-center gap-2">
            <div className="bg-muted-foreground/20 h-5 w-20 rounded" />
            <div className="bg-muted-foreground/20 h-5 w-24 rounded" />
          </div>
        </div>
        <div className="bg-muted border-border animate-pulse rounded-lg border p-6">
          <div className="bg-muted-foreground/20 mb-2 h-6 w-3/4 rounded" />
          <div className="bg-muted-foreground/20 mb-4 h-4 w-full rounded" />
          <div className="flex items-center gap-2">
            <div className="bg-muted-foreground/20 h-5 w-20 rounded" />
            <div className="bg-muted-foreground/20 h-5 w-24 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="text-destructive mb-4 size-12" />
        <p className="text-muted-foreground mb-4 text-lg">
          Failed to load reservations
        </p>
        <Button
          onClick={() => {
            void refetch();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!reservations || reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground mb-4 text-lg">
          You don't have any reservations yet.
        </p>
        <p className="text-muted-foreground text-sm">
          When someone requests to borrow your items, they'll appear here.
        </p>
      </div>
    );
  }

  // Separate pending reservations from others
  const pendingReservations = reservations.filter(
    (r) => r.status === "pending",
  );
  const otherReservations = reservations.filter(
    (r) => r.status !== "pending",
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Pending Reservations Section */}
      {pendingReservations.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-2xl font-bold">Pending Approval</h2>
            <span className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full px-3 py-1 text-sm font-semibold">
              {pendingReservations.length}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {pendingReservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))}
          </div>
        </div>
      )}

      {/* Other Reservations Section */}
      {otherReservations.length > 0 && (
        <div>
          <h2 className="text-2xl mb-4 font-bold">
            {pendingReservations.length > 0 ? "All Reservations" : "Reservations"}
          </h2>
          <div className="flex flex-col gap-4">
            {otherReservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))}
          </div>
        </div>
      )}

      {/* Show message if no reservations at all */}
      {pendingReservations.length === 0 && otherReservations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4 text-lg">
            You don't have any reservations yet.
          </p>
          <p className="text-muted-foreground text-sm">
            When someone requests to borrow your items, they'll appear here.
          </p>
        </div>
      )}
    </div>
  );
}

