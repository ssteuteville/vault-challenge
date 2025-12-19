import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { desc, eq, sql } from "@acme/db";
import { CreateItemSchema, UpdateItemSchema, items, loans } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

/**
 * Check if an item has an active reservation for today
 */
function hasActiveReservationToday(
  itemLoans: Array<{
    status: string;
    reservedStartDate: Date | null;
    reservedEndDate: Date | null;
  }>,
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return itemLoans.some((loan) => {
    if (
      !loan.reservedStartDate ||
      !loan.reservedEndDate ||
      !["pending", "approved", "reserved", "active"].includes(loan.status)
    ) {
      return false;
    }

    const startDate = new Date(loan.reservedStartDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(loan.reservedEndDate);
    endDate.setHours(0, 0, 0, 0);

    return today >= startDate && today <= endDate;
  });
}

/**
 * Compute the effective status of an item considering reservations
 */
function computeEffectiveStatus(
  itemStatus: string,
  itemLoans: Array<{
    status: string;
    reservedStartDate: Date | null;
    reservedEndDate: Date | null;
  }>,
): string {
  // If item is already borrowed or unavailable, keep that status
  if (itemStatus === "borrowed" || itemStatus === "unavailable") {
    return itemStatus;
  }

  // If item is available, check for active reservations today
  if (itemStatus === "available" && hasActiveReservationToday(itemLoans)) {
    return "unavailable";
  }

  return itemStatus;
}

export const itemRouter = {
  all: publicProcedure.query(async ({ ctx }) => {
    const itemsData = await ctx.db.query.items.findMany({
      where: eq(items.isListed, true),
      orderBy: [desc(items.createdAt)],
      with: {
        owner: true,
        loans: {
          orderBy: [desc(items.createdAt)],
        },
      },
    });

    // Compute effective status for each item
    return itemsData.map((item) => ({
      ...item,
      effectiveStatus: computeEffectiveStatus(item.status, item.loans),
    }));
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.query.items.findFirst({
        where: eq(items.id, input.id),
        with: {
          owner: true,
          loans: {
            orderBy: [desc(items.createdAt)],
          },
        },
      });

      if (!item) {
        return null;
      }

      return {
        ...item,
        effectiveStatus: computeEffectiveStatus(item.status, item.loans),
      };
    }),

  byOwner: publicProcedure
    .input(z.object({ ownerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const itemsData = await ctx.db.query.items.findMany({
        where: eq(items.ownerId, input.ownerId),
        orderBy: [desc(items.createdAt)],
        with: {
          owner: true,
          loans: {
            orderBy: [desc(items.createdAt)],
          },
        },
      });

      // Compute effective status for each item
      return itemsData.map((item) => ({
        ...item,
        effectiveStatus: computeEffectiveStatus(item.status, item.loans),
      }));
    }),

  create: protectedProcedure
    .input(CreateItemSchema)
    .mutation(async ({ ctx, input }) => {
      const [item] = await ctx.db
        .insert(items)
        .values({
          ...input,
          ownerId: ctx.session.user.id,
        })
        .returning();
      return item;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: UpdateItemSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the item to verify ownership
      const item = await ctx.db.query.items.findFirst({
        where: eq(items.id, input.id),
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      // Verify the user owns the item
      if (item.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own items",
        });
      }

      // Update the item using raw SQL to avoid Drizzle's timestamp mapper issues
      // Drizzle's PgTimestamp.mapToDriverValue expects a Date object but processes sql`now()` incorrectly
      // Using raw SQL bypasses the type mapper entirely
      // For now, handle the common case (isListed) and extend as needed
      if (input.data.isListed !== undefined) {
        await ctx.db.execute(
          sql`UPDATE items SET is_listed = ${input.data.isListed}, updated_at = NOW() WHERE id = ${input.id}`
        );
      } else {
        // For other fields, use Drizzle's update but without returning to avoid timestamp issues
        // Then fetch separately
        await ctx.db
          .update(items)
          .set(input.data)
          .where(eq(items.id, input.id));
      }

      // Fetch the updated item to ensure proper Date serialization
      const updatedItem = await ctx.db.query.items.findFirst({
        where: eq(items.id, input.id),
      });

      if (!updatedItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found after update",
        });
      }

      return updatedItem;
    }),
} satisfies TRPCRouterRecord;
