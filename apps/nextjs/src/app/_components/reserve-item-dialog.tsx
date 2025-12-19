"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Calendar } from "@acme/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Field, FieldContent, FieldError, FieldLabel } from "@acme/ui/field";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

interface ReserveItemDialogProps {
  itemId: string;
  requiresApproval: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReserveItemDialog({
  itemId,
  requiresApproval,
  open,
  onOpenChange,
}: ReserveItemDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [notes, setNotes] = useState("");

  // Fetch future reservations to disable conflicting dates
  const { data: futureReservations } = useQuery({
    ...trpc.loan.getFutureReservations.queryOptions({ itemId }),
    enabled: open,
  });

  // Create reservation mutation
  const createReservation = useMutation(
    trpc.loan.create.mutationOptions({
      onSuccess: () => {
        if (requiresApproval) {
          toast.success(
            "Your reservation request has been submitted. You'll hear back soon.",
          );
        } else {
          toast.success("Your reservation has been approved!");
        }
        // Invalidate queries to refresh data
        void queryClient.invalidateQueries(trpc.loan.pathFilter());
        void queryClient.invalidateQueries(trpc.item.pathFilter());
        // Reset form and close dialog
        setDateRange(undefined);
        setNotes("");
        onOpenChange(false);
      },
      onError: (err) => {
        if (err.data?.code === "UNAUTHORIZED") {
          toast.error("You must be logged in to reserve an item");
        } else if (err.data?.code === "CONFLICT") {
          toast.error(
            err.message ||
              "This item is already reserved for the selected dates",
          );
        } else if (err.data?.code === "FORBIDDEN") {
          toast.error(err.message || "You cannot reserve your own item");
        } else {
          toast.error(err.message || "Failed to create reservation");
        }
      },
    }),
  );

  // Calculate disabled dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disabledDates: Date[] = [];
  if (futureReservations) {
    futureReservations.forEach((reservation) => {
      if (reservation.reservedStartDate && reservation.reservedEndDate) {
        const start = new Date(reservation.reservedStartDate);
        const end = new Date(reservation.reservedEndDate);
        const current = new Date(start);
        while (current <= end) {
          disabledDates.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      }
    });
  }

  const formatDateRange = (range: DateRange | undefined): string => {
    if (!range?.from) return "";
    if (!range.to) {
      return range.from.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return `${range.from.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} - ${range.to.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  const handleSubmit = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select a date range");
      return;
    }

    if (dateRange.to < dateRange.from) {
      toast.error("End date must be after start date");
      return;
    }

    createReservation.mutate({
      itemId,
      reservedStartDate: dateRange.from,
      reservedEndDate: dateRange.to,
      notes: notes.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reserve Item</DialogTitle>
          <DialogDescription>
            Select the dates you would like to reserve this item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Field>
            <FieldContent>
              <FieldLabel>Date Range</FieldLabel>
            </FieldContent>
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                disabled={(date) => {
                  // Disable past dates
                  const dateOnly = new Date(date);
                  dateOnly.setHours(0, 0, 0, 0);
                  if (dateOnly < today) {
                    return true;
                  }
                  // Disable dates that are already reserved
                  return disabledDates.some((disabledDate) => {
                    const disabledDateOnly = new Date(disabledDate);
                    disabledDateOnly.setHours(0, 0, 0, 0);
                    return disabledDateOnly.getTime() === dateOnly.getTime();
                  });
                }}
                numberOfMonths={1}
                className="rounded-md border"
              />
            </div>
            {dateRange?.from && dateRange?.to ? (
              <div className="mt-3 flex items-center justify-center gap-3">
                <Badge variant="outline" className="px-4 py-2 text-base">
                  {dateRange.from.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Badge>
                <span className="text-muted-foreground text-base font-medium">
                  to
                </span>
                <Badge variant="outline" className="px-4 py-2 text-base">
                  {dateRange.to.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Badge>
              </div>
            ) : dateRange?.from ? (
              <div className="mt-3 flex items-center justify-center gap-3">
                <Badge variant="outline" className="px-4 py-2 text-base">
                  {dateRange.from.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Badge>
                <span className="text-muted-foreground text-base">
                  → Select end date
                </span>
              </div>
            ) : (
              <FieldError
                errors={[{ message: "Please select a date range" }]}
              />
            )}
          </Field>

          <Field>
            <FieldContent>
              <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
            </FieldContent>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about your reservation..."
              rows={3}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setDateRange(undefined);
              setNotes("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !dateRange?.from || !dateRange?.to || createReservation.isPending
            }
          >
            {createReservation.isPending ? "Submitting..." : "Reserve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
