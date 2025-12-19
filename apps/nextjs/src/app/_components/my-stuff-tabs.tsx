"use client";

import { useState } from "react";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@acme/ui/badge";
import { cn } from "@acme/ui";

import { useTRPC } from "~/trpc/react";
import { ReservationsList } from "./reservations-list";

type Tab = "items" | "reservations";

function ItemCardSkeleton() {
  return (
    <div className="bg-muted border-border animate-pulse rounded-lg border p-6">
      <div className="bg-muted-foreground/20 mb-2 h-6 w-3/4 rounded" />
      <div className="bg-muted-foreground/20 mb-4 h-4 w-full rounded" />
      <div className="flex items-center gap-2">
        <div className="bg-muted-foreground/20 h-5 w-20 rounded" />
        <div className="bg-muted-foreground/20 h-5 w-24 rounded" />
      </div>
    </div>
  );
}

interface MyStuffTabsProps {
  itemsContent: React.ReactNode;
}

export function MyStuffTabs({ itemsContent }: MyStuffTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("items");
  const trpc = useTRPC();

  // Fetch reservations to get pending count
  const { data: reservations } = useQuery({
    ...trpc.loan.getByOwner.queryOptions(),
  });

  const pendingCount =
    reservations?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-border mb-6 flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("items")}
          className={cn(
            "border-b-2 px-4 py-2 font-medium transition-colors",
            activeTab === "items"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Items
        </button>
        <button
          onClick={() => setActiveTab("reservations")}
          className={cn(
            "border-b-2 px-4 py-2 font-medium transition-colors",
            activeTab === "reservations"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="flex items-center gap-2">
            Reservations
            {pendingCount > 0 && (
              <Badge
                className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50 dark:border-yellow-400/50 border"
              >
                {pendingCount}
              </Badge>
            )}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "items" && (
          <Suspense
            fallback={
              <div className="flex flex-col gap-4">
                <ItemCardSkeleton />
                <ItemCardSkeleton />
                <ItemCardSkeleton />
              </div>
            }
          >
            {itemsContent}
          </Suspense>
        )}
        {activeTab === "reservations" && (
          <Suspense
            fallback={
              <div className="flex flex-col gap-4">
                <ItemCardSkeleton />
                <ItemCardSkeleton />
              </div>
            }
          >
            <ReservationsList />
          </Suspense>
        )}
      </div>
    </div>
  );
}

