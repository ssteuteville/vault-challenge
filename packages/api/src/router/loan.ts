import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, inArray, isNotNull, sql } from "@acme/db";
import { items, loans } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const loanRouter = {
  create: protectedProcedure
    .input(
      z.object({
        itemId: z.string().uuid(),
        reservedStartDate: z.date(),
        reservedEndDate: z.date(),
        notes: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if item exists
      const item = await ctx.db.query.items.findFirst({
        where: eq(items.id, input.itemId),
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      // Check if user is the owner
      if (item.ownerId === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot reserve your own item",
        });
      }

      // Validate date range
      if (input.reservedEndDate < input.reservedStartDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date must be after start date",
        });
      }

      // Check for overlapping reservations
      // Two date ranges overlap if: start1 <= end2 AND start2 <= end1
      const existingReservations = await ctx.db.query.loans.findMany({
        where: and(
          eq(loans.itemId, input.itemId),
          inArray(loans.status, ["pending", "approved", "reserved", "active"]),
          isNotNull(loans.reservedStartDate),
          isNotNull(loans.reservedEndDate),
        ),
      });

      // Check for overlaps in JavaScript
      const hasOverlap = existingReservations.some((reservation) => {
        if (!reservation.reservedStartDate || !reservation.reservedEndDate) {
          return false;
        }
        const existingStart = new Date(reservation.reservedStartDate);
        const existingEnd = new Date(reservation.reservedEndDate);
        // Ranges overlap if: start1 <= end2 AND start2 <= end1
        return (
          existingStart <= input.reservedEndDate &&
          input.reservedStartDate <= existingEnd
        );
      });

      if (hasOverlap) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This item is already reserved for the selected dates",
        });
      }

      // Determine status and approval
      const status = item.requiresApproval ? "pending" : "reserved";
      const approvedAt = item.requiresApproval ? null : new Date();

      // Create the loan
      const [loan] = await ctx.db
        .insert(loans)
        .values({
          itemId: input.itemId,
          borrowerId: ctx.session.user.id,
          status,
          reservedStartDate: input.reservedStartDate,
          reservedEndDate: input.reservedEndDate,
          approvedAt,
          notes: input.notes ?? null,
        })
        .returning();

      return loan;
    }),

  getFutureReservations: publicProcedure
    .input(z.object({ itemId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allReservations = await ctx.db.query.loans.findMany({
        where: and(
          eq(loans.itemId, input.itemId),
          inArray(loans.status, ["pending", "approved", "reserved", "active"]),
          isNotNull(loans.reservedStartDate),
          isNotNull(loans.reservedEndDate),
        ),
        with: {
          borrower: true,
        },
        orderBy: (loans, { asc }) => [asc(loans.reservedStartDate)],
      });

      // Filter to only future reservations
      return allReservations.filter((reservation) => {
        if (!reservation.reservedStartDate || !reservation.reservedEndDate) {
          return false;
        }
        const startDate = new Date(reservation.reservedStartDate);
        const endDate = new Date(reservation.reservedEndDate);
        // Include if reservation starts or ends in the future
        return startDate >= today || endDate >= today;
      });
    }),

  getCurrentUserReservation: protectedProcedure
    .input(z.object({ itemId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all reservations for this item by the current user
      const userReservations = await ctx.db.query.loans.findMany({
        where: and(
          eq(loans.itemId, input.itemId),
          eq(loans.borrowerId, ctx.session.user.id),
          inArray(loans.status, ["pending", "approved", "reserved", "active"]),
          isNotNull(loans.reservedStartDate),
          isNotNull(loans.reservedEndDate),
        ),
        orderBy: (loans, { asc }) => [asc(loans.reservedStartDate)],
      });

      // Find the reservation that overlaps with today
      const overlappingReservation = userReservations.find((reservation) => {
        if (!reservation.reservedStartDate || !reservation.reservedEndDate) {
          return false;
        }
        const startDate = new Date(reservation.reservedStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(reservation.reservedEndDate);
        endDate.setHours(0, 0, 0, 0);

        // Check if today overlaps with the reservation period
        // Overlap if: startDate <= today <= endDate
        return startDate <= today && today <= endDate;
      });

      return overlappingReservation ?? null;
    }),

  getByOwner: protectedProcedure.query(async ({ ctx }) => {
    // Get all items owned by the user
    const userItems = await ctx.db.query.items.findMany({
      where: eq(items.ownerId, ctx.session.user.id),
      columns: { id: true },
    });

    if (userItems.length === 0) {
      return [];
    }

    const itemIds = userItems.map((item) => item.id);

    // Get all loans for these items
    const allLoans = await ctx.db.query.loans.findMany({
      where: inArray(loans.itemId, itemIds),
      with: {
        borrower: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        item: {
          columns: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [desc(loans.requestedAt)],
    });

    return allLoans;
  }),

  approve: protectedProcedure
    .input(z.object({ loanId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the loan with item information
      const loan = await ctx.db.query.loans.findFirst({
        where: eq(loans.id, input.loanId),
        with: {
          item: true,
        },
      });

      if (!loan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });
      }

      // Verify the user owns the item
      if (loan.item.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only approve reservations for your own items",
        });
      }

      // Verify the loan is pending
      if (loan.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending reservations can be approved",
        });
      }

      // Update the loan status using raw SQL to avoid Drizzle's timestamp mapper issues
      // Drizzle's PgTimestamp.mapToDriverValue expects a Date object but processes sql`now()` incorrectly
      // Using raw SQL bypasses the type mapper entirely
      await ctx.db.execute(
        sql`UPDATE loans SET status = 'approved', approved_at = NOW() WHERE id = ${input.loanId}`,
      );

      // Fetch the updated loan to ensure proper Date serialization
      const updatedLoan = await ctx.db.query.loans.findFirst({
        where: eq(loans.id, input.loanId),
      });

      if (!updatedLoan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found after update",
        });
      }

      return updatedLoan;
    }),

  reject: protectedProcedure
    .input(z.object({ loanId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the loan with item information
      const loan = await ctx.db.query.loans.findFirst({
        where: eq(loans.id, input.loanId),
        with: {
          item: true,
        },
      });

      if (!loan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });
      }

      // Verify the user owns the item
      if (loan.item.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only reject reservations for your own items",
        });
      }

      // Verify the loan can be rejected/cancelled
      if (!["pending", "approved", "reserved"].includes(loan.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Only pending, approved, or reserved reservations can be cancelled",
        });
      }

      // Verify the loan hasn't been borrowed yet
      if (loan.borrowedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel a reservation that has already been borrowed",
        });
      }

      // Update the loan status - use "rejected" for pending, "cancelled" for approved/reserved
      // Using raw SQL to avoid Drizzle's timestamp mapper issues
      // Drizzle's PgTimestamp.mapToDriverValue expects a Date object but processes sql`now()` incorrectly
      // Using raw SQL bypasses the type mapper entirely
      const newStatus = loan.status === "pending" ? "rejected" : "cancelled";
      await ctx.db.execute(
        sql`UPDATE loans SET status = ${newStatus} WHERE id = ${input.loanId}`,
      );

      // Fetch the updated loan to ensure proper Date serialization
      const updatedLoan = await ctx.db.query.loans.findFirst({
        where: eq(loans.id, input.loanId),
      });

      if (!updatedLoan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found after update",
        });
      }

      return updatedLoan;
    }),

  getByBorrower: protectedProcedure.query(async ({ ctx }) => {
    // Get all loans where the current user is the borrower
    const allLoans = await ctx.db.query.loans.findMany({
      where: eq(loans.borrowerId, ctx.session.user.id),
      with: {
        item: {
          columns: {
            id: true,
            title: true,
            imageUrl: true,
          },
          with: {
            owner: {
              columns: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: [desc(loans.requestedAt)],
    });

    return allLoans;
  }),

  cancel: protectedProcedure
    .input(z.object({ loanId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the loan
      const loan = await ctx.db.query.loans.findFirst({
        where: eq(loans.id, input.loanId),
      });

      if (!loan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });
      }

      // Verify the user is the borrower
      if (loan.borrowerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only cancel your own reservations",
        });
      }

      // Verify the loan can be cancelled
      if (!["pending", "approved", "reserved"].includes(loan.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Only pending, approved, or reserved reservations can be cancelled",
        });
      }

      // Update the loan status using raw SQL to avoid Drizzle's timestamp mapper issues
      // Drizzle's PgTimestamp.mapToDriverValue expects a Date object but processes sql`now()` incorrectly
      // Using raw SQL bypasses the type mapper entirely
      await ctx.db.execute(
        sql`UPDATE loans SET status = 'cancelled' WHERE id = ${input.loanId}`,
      );

      // Fetch the updated loan to ensure proper Date serialization
      const updatedLoan = await ctx.db.query.loans.findFirst({
        where: eq(loans.id, input.loanId),
      });

      if (!updatedLoan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found after update",
        });
      }

      return updatedLoan;
    }),

  markAsBorrowed: protectedProcedure
    .input(z.object({ loanId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the loan with item information
      const loan = await ctx.db.query.loans.findFirst({
        where: eq(loans.id, input.loanId),
        with: {
          item: true,
        },
      });

      if (!loan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });
      }

      // Verify the user is either the borrower or the owner
      const isBorrower = loan.borrowerId === ctx.session.user.id;
      const isOwner = loan.item.ownerId === ctx.session.user.id;

      if (!isBorrower && !isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You can only mark reservations as borrowed for your own items or reservations",
        });
      }

      // Verify the loan hasn't been borrowed yet
      if (loan.borrowedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This item has already been marked as borrowed",
        });
      }

      // Verify the loan is approved or reserved
      if (!["approved", "reserved"].includes(loan.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Only approved or reserved reservations can be marked as borrowed",
        });
      }

      // Verify we're within the time window (today is within or after reservedStartDate)
      if (loan.reservedStartDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(loan.reservedStartDate);
        startDate.setHours(0, 0, 0, 0);

        if (today < startDate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot mark as borrowed before the reserved start date",
          });
        }
      }

      // Update the loan status and set borrowedAt using raw SQL to avoid Drizzle's timestamp mapper issues
      // Drizzle's PgTimestamp.mapToDriverValue expects a Date object but processes sql`now()` incorrectly
      // Using raw SQL bypasses the type mapper entirely
      await ctx.db.execute(
        sql`UPDATE loans SET status = 'active', borrowed_at = NOW() WHERE id = ${input.loanId}`,
      );

      // Fetch the updated loan to ensure proper Date serialization
      const updatedLoan = await ctx.db.query.loans.findFirst({
        where: eq(loans.id, input.loanId),
      });

      if (!updatedLoan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found after update",
        });
      }

      return updatedLoan;
    }),

  markAsReturned: protectedProcedure
    .input(z.object({ loanId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the loan with item information
      const loan = await ctx.db.query.loans.findFirst({
        where: eq(loans.id, input.loanId),
        with: {
          item: true,
        },
      });

      if (!loan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found",
        });
      }

      // Verify the user is the borrower
      if (loan.borrowerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only mark your own reservations as returned",
        });
      }

      // Verify the loan is active (currently borrowed)
      if (loan.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Only active (borrowed) reservations can be marked as returned",
        });
      }

      // Verify the loan has been borrowed
      if (!loan.borrowedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot mark as returned if item hasn't been borrowed",
        });
      }

      // If returned early (before reservedEndDate), update reservedEndDate to make item available again
      // Update the loan status and set returnedAt using raw SQL to avoid Drizzle's timestamp mapper issues
      if (loan.reservedEndDate) {
        const now = new Date();
        const reservedEndDate = new Date(loan.reservedEndDate);

        // If returned early, update both returnedAt and reservedEndDate
        if (now < reservedEndDate) {
          await ctx.db.execute(
            sql`UPDATE loans SET status = 'returned', returned_at = NOW(), reserved_end_date = NOW() WHERE id = ${input.loanId}`,
          );
        } else {
          // Returned on time or late - just update returnedAt
          await ctx.db.execute(
            sql`UPDATE loans SET status = 'returned', returned_at = NOW() WHERE id = ${input.loanId}`,
          );
        }
      } else {
        // No reserved end date, just mark as returned
        await ctx.db.execute(
          sql`UPDATE loans SET status = 'returned', returned_at = NOW() WHERE id = ${input.loanId}`,
        );
      }

      // Fetch the updated loan to ensure proper Date serialization
      const updatedLoan = await ctx.db.query.loans.findFirst({
        where: eq(loans.id, input.loanId),
      });

      if (!updatedLoan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reservation not found after update",
        });
      }

      return updatedLoan;
    }),
} satisfies TRPCRouterRecord;
