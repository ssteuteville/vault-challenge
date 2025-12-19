import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { eq, and } from "@acme/db";
import { favorites } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const favoriteRouter = {
  toggle: protectedProcedure
    .input(z.object({ itemId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if favorite already exists
      const existingFavorite = await ctx.db.query.favorites.findFirst({
        where: and(
          eq(favorites.userId, userId),
          eq(favorites.itemId, input.itemId),
        ),
      });

      if (existingFavorite) {
        // Remove favorite
        await ctx.db
          .delete(favorites)
          .where(
            and(
              eq(favorites.userId, userId),
              eq(favorites.itemId, input.itemId),
            ),
          );
        return { isFavorited: false };
      } else {
        // Add favorite
        await ctx.db.insert(favorites).values({
          userId,
          itemId: input.itemId,
        });
        return { isFavorited: true };
      }
    }),

  getByUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const userFavorites = await ctx.db.query.favorites.findMany({
      where: eq(favorites.userId, userId),
      columns: {
        itemId: true,
      },
    });

    return userFavorites.map((fav) => fav.itemId);
  }),

  isFavorited: protectedProcedure
    .input(z.object({ itemId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const favorite = await ctx.db.query.favorites.findFirst({
        where: and(
          eq(favorites.userId, userId),
          eq(favorites.itemId, input.itemId),
        ),
      });

      return !!favorite;
    }),
} satisfies TRPCRouterRecord;

