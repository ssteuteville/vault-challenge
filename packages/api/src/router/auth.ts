import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";
import { asc, eq, ilike, or } from "@acme/db";

import { user } from "@acme/db";

import { protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = {
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can see this secret message!";
  }),
  searchUsers: publicProcedure
    .input(z.object({ query: z.string().optional().default("") }))
    .query(async ({ ctx, input }) => {
      const query = ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user);

      if (input.query && input.query.length > 0) {
        const searchTerm = `%${input.query}%`;
        return query
          .where(
            or(
              ilike(user.name, searchTerm),
              ilike(user.email, searchTerm)
            )
          )
          .orderBy(asc(user.name))
          .limit(10);
      }

      // When no query, return first 10 users alphabetically by name (or email if name is null)
      return query
        .orderBy(asc(user.name), asc(user.email))
        .limit(10);
    }),
  getUserById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(user)
        .where(eq(user.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),
} satisfies TRPCRouterRecord;
