import { Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { trpc } from "~/utils/api";
import { colors } from "~/utils/theme";

interface FavoriteButtonProps {
  itemId: string;
  size?: "sm" | "md" | "lg";
}

export function FavoriteButton({ itemId, size = "md" }: FavoriteButtonProps) {
  const queryClient = useQueryClient();

  // Fetch current favorite status
  const { data: isFavorited, isLoading, error } = useQuery({
    ...trpc.favorite.isFavorited.queryOptions({ itemId }),
    retry: false,
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
        console.error("Failed to toggle favorite:", err);
      },
    }),
  );

  const handlePress = () => {
    toggleFavorite.mutate({ itemId });
  };

  const sizeStyles = {
    sm: { width: 32, height: 32, iconSize: 16 },
    md: { width: 36, height: 36, iconSize: 18 },
    lg: { width: 40, height: 40, iconSize: 20 },
  };

  const currentSize = sizeStyles[size];

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLoading || toggleFavorite.isPending}
      style={[
        styles.button,
        {
          width: currentSize.width,
          height: currentSize.height,
          backgroundColor: isFavorited ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.9)",
        },
      ]}
    >
      {isLoading || toggleFavorite.isPending ? (
        <ActivityIndicator size="small" color={isFavorited ? colors.destructive : colors.primary} />
      ) : (
        <Ionicons
          name={isFavorited ? "heart" : "heart-outline"}
          size={currentSize.iconSize}
          color={isFavorited ? colors.destructive : colors.mutedForeground.light}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
});

