import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { desc, eq } from "@acme/db";
import { CreateItemSchema, items } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const itemRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.items.findMany({
      orderBy: [desc(items.createdAt)],
      with: {
        owner: true,
        loans: {
          orderBy: [desc(items.createdAt)],
          limit: 5, // Limit recent loans
        },
      },
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.items.findFirst({
        where: eq(items.id, input.id),
        with: {
          owner: true,
          loans: {
            orderBy: [desc(items.createdAt)],
          },
        },
      });
    }),

  byOwner: publicProcedure
    .input(z.object({ ownerId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.items.findMany({
        where: eq(items.ownerId, input.ownerId),
        orderBy: [desc(items.createdAt)],
        with: {
          owner: true,
          loans: {
            orderBy: [desc(items.createdAt)],
          },
        },
      });
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
