"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { User, MessageSquare } from "lucide-react";

import { Badge } from "@acme/ui/badge";

import { useTRPC } from "~/trpc/react";

interface ItemFeedbacksProps {
  itemId: string;
}

export function ItemFeedbacks({ itemId }: ItemFeedbacksProps) {
  const trpc = useTRPC();

  const { data: feedbacks, isLoading } = useQuery({
    ...trpc.feedback.getByItem.queryOptions({ itemId }),
  });

  if (isLoading) {
    return (
      <div className="border-border mb-6 border-t pt-6">
        <h2 className="text-foreground mb-4 text-xl font-semibold">
          Feedback
        </h2>
        <p className="text-muted-foreground">Loading feedback...</p>
      </div>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return null;
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="border-border mb-6 border-t pt-6">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare className="text-muted-foreground size-5" />
        <h2 className="text-foreground text-xl font-semibold">Feedback</h2>
        <Badge variant="outline" className="ml-2">
          {feedbacks.length}
        </Badge>
      </div>
      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className="bg-muted/30 border-border rounded-lg border p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {feedback.borrower?.image ? (
                  <div className="border-border relative size-10 shrink-0 overflow-hidden rounded-full border-2">
                    <Image
                      src={feedback.borrower.image}
                      alt={
                        feedback.borrower.name ||
                        feedback.borrower.email ||
                        "Borrower"
                      }
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="border-border flex size-10 shrink-0 items-center justify-center rounded-full border-2">
                    <User className="text-muted-foreground size-5" />
                  </div>
                )}
                <div>
                  <p className="text-foreground font-medium">
                    {feedback.borrower?.name ||
                      feedback.borrower?.email ||
                      "Anonymous"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(feedback.createdAt)}
                  </p>
                </div>
              </div>
              {!feedback.isPublic && (
                <Badge variant="outline" className="text-xs">
                  Private
                </Badge>
              )}
            </div>
            <p className="text-foreground whitespace-pre-wrap leading-7">
              {feedback.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

