import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { desc, eq } from "@acme/db";
import { CreateItemSchema, items, loans } from "@acme/db/schema";

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
} satisfies TRPCRouterRecord;
