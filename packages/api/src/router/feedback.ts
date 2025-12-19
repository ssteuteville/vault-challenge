import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { desc, eq, and } from "@acme/db";
import { feedbacks, loans, items } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const feedbackRouter = {
  create: protectedProcedure
    .input(
      z.object({
        loanId: z.string().uuid(),
        content: z.string().min(1, "Feedback content is required"),
        isPublic: z.boolean(),
      }),
    )
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
          message: "Loan not found",
        });
      }

      // Verify the user is the borrower
      if (loan.borrowerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only leave feedback for your own loans",
        });
      }

      // Verify the loan has been returned
      if (loan.status !== "returned") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can only leave feedback for returned items",
        });
      }

      // Check if feedback already exists for this loan
      const existingFeedback = await ctx.db.query.feedbacks.findFirst({
        where: eq(feedbacks.loanId, input.loanId),
      });

      if (existingFeedback) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Feedback already exists for this loan",
        });
      }

      // Create the feedback
      const [feedback] = await ctx.db
        .insert(feedbacks)
        .values({
          loanId: input.loanId,
          borrowerId: ctx.session.user.id,
          itemId: loan.itemId,
          content: input.content,
          isPublic: input.isPublic,
        })
        .returning();

      return feedback;
    }),

  getByItem: publicProcedure
    .input(z.object({ itemId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get the item to check ownership
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
      const isOwner = ctx.session?.user?.id === item.ownerId;

      // Build where conditions
      const whereConditions = [eq(feedbacks.itemId, input.itemId)];

      // If not owner, only show public feedbacks
      if (!isOwner) {
        whereConditions.push(eq(feedbacks.isPublic, true));
      }

      // Get feedbacks with borrower information
      const feedbacksData = await ctx.db.query.feedbacks.findMany({
        where: and(...whereConditions),
        with: {
          borrower: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: [desc(feedbacks.createdAt)],
      });

      return feedbacksData;
    }),
} satisfies TRPCRouterRecord;

