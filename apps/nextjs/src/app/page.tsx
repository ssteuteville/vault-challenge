import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";

import { Button } from "@acme/ui/button";
import { appRouter, createTRPCContext } from "@acme/api";

import { auth, getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { ItemGrid } from "./_components/item-grid";

function ItemCardSkeleton() {
  return (
    <div className="bg-muted animate-pulse rounded-lg border border-border p-4">
      <div className="aspect-square mb-3 rounded-md bg-muted-foreground/20" />
      <div className="h-5 w-3/4 rounded bg-muted-foreground/20 mb-2" />
      <div className="h-4 w-full rounded bg-muted-foreground/20" />
    </div>
  );
}

async function ItemGridWrapper() {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");
  const ctx = await createTRPCContext({
    headers: heads,
    auth,
  });
  const caller = appRouter.createCaller(ctx);
  const items = await caller.item.all();

  // Sort alphabetically by title
  const sortedItems = [...items].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  // Map items to include owner data
  const itemsWithOwner = sortedItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    status: item.status,
    imageUrl: item.imageUrl,
    owner: item.owner,
  }));

  return <ItemGrid items={itemsWithOwner} />;
}

export default async function HomePage() {
  const session = await getSession();

  prefetch(trpc.item.all.queryOptions());

  return (
    <HydrateClient>
      <main className="container min-h-screen px-0 sm:px-4">
        <div className="flex h-screen flex-col">
          {/* Header */}
          <header className="flex items-center justify-between px-2 sm:px-4 py-4 sm:py-6">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
              VAULT
            </h1>
            <Button asChild size="lg">
              <Link href="/my-stuff">my stuff</Link>
            </Button>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-8">
            <Suspense
              fallback={
                <div>
                  <div className="mb-6 flex items-center gap-2">
                    <div className="h-8 w-16 rounded bg-muted-foreground/20 animate-pulse" />
                    <div className="h-8 w-20 rounded bg-muted-foreground/20 animate-pulse" />
                    <div className="h-8 w-24 rounded bg-muted-foreground/20 animate-pulse" />
                    <div className="h-8 w-28 rounded bg-muted-foreground/20 animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <ItemCardSkeleton />
                    <ItemCardSkeleton />
                    <ItemCardSkeleton />
                    <ItemCardSkeleton />
                    <ItemCardSkeleton />
                    <ItemCardSkeleton />
                    <ItemCardSkeleton />
                    <ItemCardSkeleton />
                  </div>
                </div>
              }
            >
              <ItemGridWrapper />
            </Suspense>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
