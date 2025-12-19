"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { User } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Textarea } from "@acme/ui/textarea";
import { Label } from "@acme/ui/label";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  itemId: string;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  loanId,
  itemId,
}: FeedbackDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const createFeedbackMutation = useMutation(
    trpc.feedback.create.mutationOptions({
      onSuccess: async () => {
        toast.success("Feedback submitted successfully!");
        await queryClient.invalidateQueries(trpc.feedback.pathFilter());
        await queryClient.invalidateQueries(trpc.item.pathFilter());
        setContent("");
        setIsPublic(false);
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to submit feedback");
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter feedback content");
      return;
    }
    createFeedbackMutation.mutate({
      loanId,
      content: content.trim(),
      isPublic,
    });
  };

  const handleCancel = () => {
    setContent("");
    setIsPublic(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Feedback</DialogTitle>
          <DialogDescription>
            Share your experience with this item. You can mark feedback as
            public (visible to everyone) or private (visible only to the item
            owner).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-content">Feedback</Label>
              <Textarea
                id="feedback-content"
                placeholder="How was your experience with this item?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                disabled={createFeedbackMutation.isPending}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={createFeedbackMutation.isPending}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is-public" className="cursor-pointer">
                Make this feedback public
              </Label>
            </div>
            {isPublic && (
              <p className="text-muted-foreground text-sm">
                Public feedback will be visible to everyone on the item details
                page.
              </p>
            )}
            {!isPublic && (
              <p className="text-muted-foreground text-sm">
                Private feedback will only be visible to the item owner.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createFeedbackMutation.isPending}
            >
              Skip
            </Button>
            <Button
              type="submit"
              disabled={createFeedbackMutation.isPending || !content.trim()}
            >
              {createFeedbackMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

