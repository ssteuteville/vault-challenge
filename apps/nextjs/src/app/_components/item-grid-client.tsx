"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { ItemGrid } from "./item-grid";

export function ItemGridClient() {
  const trpc = useTRPC();
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    ...trpc.item.all.queryOptions(
      favoritesOnly ? { favoritesOnly: true } : undefined,
    ),
  });

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-2">
          <div className="bg-muted-foreground/20 h-8 w-16 animate-pulse rounded" />
          <div className="bg-muted-foreground/20 h-8 w-20 animate-pulse rounded" />
          <div className="bg-muted-foreground/20 h-8 w-24 animate-pulse rounded" />
          <div className="bg-muted-foreground/20 h-8 w-28 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted border-border animate-pulse rounded-lg border p-4"
            >
              <div className="bg-muted-foreground/20 mb-3 aspect-square rounded-md" />
              <div className="bg-muted-foreground/20 mb-2 h-5 w-3/4 rounded" />
              <div className="bg-muted-foreground/20 h-4 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Sort alphabetically by title
  const sortedItems = [...items].sort((a, b) => a.title.localeCompare(b.title));

  // Map items to include owner data and effective status
  const itemsWithOwner = sortedItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    status:
      (item as { effectiveStatus?: string }).effectiveStatus ?? item.status,
    imageUrl: item.imageUrl,
    owner: item.owner,
  }));

  return (
    <ItemGrid
      items={itemsWithOwner}
      favoritesOnly={favoritesOnly}
      onFavoritesOnlyChange={setFavoritesOnly}
    />
  );
}

