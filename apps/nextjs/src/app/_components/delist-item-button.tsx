"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

interface DelistItemButtonProps {
  itemId: string;
}

export function DelistItemButton({ itemId }: DelistItemButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch the item data so we can react to query invalidation
  const { data: item, isLoading } = useQuery({
    ...trpc.item.byId.queryOptions({ id: itemId }),
  });

  const isListed = item?.isListed ?? true;

  const updateMutation = useMutation(
    trpc.item.update.mutationOptions({
      onSuccess: async () => {
        toast.success(
          isListed
            ? "Item delisted successfully"
            : "Item relisted successfully",
        );
        // Invalidate item queries to refresh the UI
        await queryClient.invalidateQueries(trpc.item.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "FORBIDDEN"
            ? "You can only delist your own items"
            : err.message || "Failed to update item",
        );
      },
    }),
  );

  const handleClick = () => {
    updateMutation.mutate({
      id: itemId,
      data: {
        isListed: !isListed,
      },
    });
  };

  // Don't show button if item data isn't loaded yet
  if (isLoading || !item) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      disabled={updateMutation.isPending}
      variant={isListed ? "destructive" : "default"}
    >
      {updateMutation.isPending
        ? isListed
          ? "Delisting..."
          : "Relisting..."
        : isListed
          ? "Delist"
          : "Relist"}
    </Button>
  );
}

