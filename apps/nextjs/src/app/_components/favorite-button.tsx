"use client";

import { Heart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

interface FavoriteButtonProps {
  itemId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FavoriteButton({
  itemId,
  className,
  size = "md",
}: FavoriteButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch current favorite status
  const { data: isFavorited, isLoading, error } = useQuery({
    ...trpc.favorite.isFavorited.queryOptions({ itemId }),
    retry: false,
    // Don't show error toast for auth errors - just don't show favorite state
    throwOnError: false,
  });

  // Don't render if there's an auth error (user not logged in)
  if (error && error.data?.code === "UNAUTHORIZED") {
    return null;
  }

  // Toggle favorite mutation
  const toggleFavorite = useMutation(
    trpc.favorite.toggle.mutationOptions({
      onSuccess: async (data) => {
        // Optimistically update the UI
        await queryClient.setQueryData(
          trpc.favorite.isFavorited.queryKey({ itemId }),
          data.isFavorited,
        );
        // Invalidate favorite queries to refresh lists
        await queryClient.invalidateQueries(trpc.favorite.pathFilter());
        // Invalidate item queries in case favorites are shown in item lists
        await queryClient.invalidateQueries(trpc.item.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to favorite items"
            : "Failed to update favorite",
        );
      },
    }),
  );

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate({ itemId });
  };

  const sizeClasses = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  };

  const buttonSizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isLoading || toggleFavorite.isPending}
      className={cn(
        "shrink-0 p-0 rounded-full",
        buttonSizeClasses[size],
        className,
        // Background for visibility on images
        // Light mode: light background with dark icon
        "bg-white/90 backdrop-blur-sm border border-gray-200/50",
        // Dark mode: dark background with white icon
        "dark:bg-black/90 dark:border-gray-800/50",
        // Text color based on favorite state
        isFavorited
          ? "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
          : "text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white",
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          "transition-all",
          isFavorited ? "fill-current" : "fill-none",
        )}
      />
    </Button>
  );
}

