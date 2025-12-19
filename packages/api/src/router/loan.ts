import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, eq, inArray, isNotNull } from "@acme/db";
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
} satisfies TRPCRouterRecord;
