"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

import { Button } from "@acme/ui/button";
import { cn } from "@acme/ui";

import { useTRPC } from "~/trpc/react";
import { MyReservationCard } from "./my-reservation-card";

type FilterType = "all" | "current" | "past" | "future";

function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isCurrentReservation(
  startDate: Date | null,
  endDate: Date | null,
): boolean {
  if (!startDate || !endDate) return false;
  const today = getToday();
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return start <= today && today <= end;
}

function isPastReservation(
  startDate: Date | null,
  endDate: Date | null,
): boolean {
  if (!endDate) return false;
  const today = getToday();
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return end < today;
}

function isFutureReservation(
  startDate: Date | null,
  endDate: Date | null,
): boolean {
  if (!startDate) return false;
  const today = getToday();
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return start > today;
}

export function MyReservationsList() {
  const trpc = useTRPC();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: reservations, isLoading, error, refetch } = useQuery({
    ...trpc.loan.getByBorrower.queryOptions(),
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
          Browse items and make a reservation to get started!
        </p>
      </div>
    );
  }

  // Filter reservations based on selected filter
  const filteredReservations = reservations.filter((reservation) => {
    switch (filter) {
      case "current":
        return isCurrentReservation(
          reservation.reservedStartDate,
          reservation.reservedEndDate,
        );
      case "past":
        return isPastReservation(
          reservation.reservedStartDate,
          reservation.reservedEndDate,
        );
      case "future":
        return isFutureReservation(
          reservation.reservedStartDate,
          reservation.reservedEndDate,
        );
      case "all":
      default:
        return true;
    }
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Filter Tabs */}
      <div className="border-border flex gap-2 border-b">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "border-b-2 px-4 py-2 font-medium transition-colors",
            filter === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter("current")}
          className={cn(
            "border-b-2 px-4 py-2 font-medium transition-colors",
            filter === "current"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Current
        </button>
        <button
          onClick={() => setFilter("past")}
          className={cn(
            "border-b-2 px-4 py-2 font-medium transition-colors",
            filter === "past"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Past
        </button>
        <button
          onClick={() => setFilter("future")}
          className={cn(
            "border-b-2 px-4 py-2 font-medium transition-colors",
            filter === "future"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Future
        </button>
      </div>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4 text-lg">
            No {filter} reservations found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredReservations.map((reservation) => (
            <MyReservationCard
              key={reservation.id}
              reservation={reservation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

