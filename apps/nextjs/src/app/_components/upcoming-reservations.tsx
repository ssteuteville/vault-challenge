"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import Image from "next/image";
import { User } from "lucide-react";

import { Badge } from "@acme/ui/badge";

import { useTRPC } from "~/trpc/react";

interface UpcomingReservationsProps {
  itemId: string;
}

export function UpcomingReservations({ itemId }: UpcomingReservationsProps) {
  const trpc = useTRPC();

  const { data: reservations, isLoading } = useQuery({
    ...trpc.loan.getFutureReservations.queryOptions({ itemId }),
  });

  if (isLoading) {
    return (
      <div className="border-border border-t pt-6">
        <h2 className="text-foreground mb-3 text-xl font-semibold">
          Upcoming Reservations
        </h2>
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!reservations || reservations.length === 0) {
    return null;
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
      case "reserved":
        return "default";
      case "active":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "reserved":
        return "Reserved";
      case "active":
        return "Active";
      default:
        return status;
    }
  };

  return (
    <div className="border-border border-t pt-6">
      <h2 className="text-foreground mb-4 text-xl font-semibold">
        Upcoming Reservations
      </h2>
      <div className="space-y-3">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className="bg-muted/50 border-border rounded-lg border p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                {/* Borrower Info */}
                <div className="flex items-center gap-3">
                  {reservation.borrower?.image ? (
                    <div className="border-border relative size-8 shrink-0 overflow-hidden rounded-full border">
                      <Image
                        src={reservation.borrower.image}
                        alt={
                          reservation.borrower?.name ||
                          reservation.borrower?.email ||
                          "Borrower"
                        }
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <User className="text-muted-foreground size-8 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-medium">
                      {reservation.borrower?.name ||
                        reservation.borrower?.email ||
                        "Unknown"}
                    </p>
                  </div>
                </div>

                {/* Date Range */}
                {reservation.reservedStartDate && reservation.reservedEndDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="text-muted-foreground size-4" />
                    <span className="text-muted-foreground">
                      {formatDate(reservation.reservedStartDate)} -{" "}
                      {formatDate(reservation.reservedEndDate)}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {reservation.notes && (
                  <p className="text-muted-foreground text-sm">{reservation.notes}</p>
                )}
              </div>

              {/* Status Badge */}
              <Badge variant={getStatusBadgeVariant(reservation.status)}>
                {getStatusLabel(reservation.status)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

