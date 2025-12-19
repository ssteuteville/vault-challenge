import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { desc, eq, sql, and, inArray } from "@acme/db";
import { CreateItemSchema, UpdateItemSchema, items, loans, favorites } from "@acme/db/schema";

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
  all: publicProcedure
    .input(
      z
        .object({
          favoritesOnly: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      let favoriteItemIds: string[] | undefined;

      // If favoritesOnly is true, get user's favorite item IDs
      if (input?.favoritesOnly) {
        if (!ctx.session?.user) {
          // Return empty array if not authenticated and favoritesOnly is requested
          return [];
        }

        const userFavorites = await ctx.db.query.favorites.findMany({
          where: eq(favorites.userId, ctx.session.user.id),
          columns: {
            itemId: true,
          },
        });

        favoriteItemIds = userFavorites.map((fav) => fav.itemId);

        // If user has no favorites, return empty array
        if (favoriteItemIds.length === 0) {
          return [];
        }
      }

      // Build where clause
      const whereConditions = [eq(items.isListed, true)];
      if (favoriteItemIds && favoriteItemIds.length > 0) {
        whereConditions.push(inArray(items.id, favoriteItemIds));
      }

      const itemsData = await ctx.db.query.items.findMany({
        where: and(...whereConditions),
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
