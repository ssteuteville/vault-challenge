import { Suspense } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { appRouter, createTRPCContext } from "@acme/api";
import { Button } from "@acme/ui/button";

import { auth, getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { ItemGrid } from "./_components/item-grid";

function ItemCardSkeleton() {
  return (
    <div className="bg-muted border-border animate-pulse rounded-lg border p-4">
      <div className="bg-muted-foreground/20 mb-3 aspect-square rounded-md" />
      <div className="bg-muted-foreground/20 mb-2 h-5 w-3/4 rounded" />
      <div className="bg-muted-foreground/20 h-4 w-full rounded" />
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
          <header className="flex items-center justify-between px-2 py-4 sm:px-4 sm:py-6">
            <h1 className="text-primary text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              VAULT
            </h1>
            <div className="flex items-center gap-2">
              {session?.user ? (
                <>
                  <Button asChild size="lg">
                    <Link href="/my-reservations">my reservations</Link>
                  </Button>
                  <Button asChild size="lg">
                    <Link href="/my-stuff">my stuff</Link>
                  </Button>
                  <form>
                    <Button
                      size="lg"
                      variant="outline"
                      formAction={async () => {
                        "use server";
                        await auth.api.signOut({
                          headers: await headers(),
                        });
                        redirect("/");
                      }}
                    >
                      Logout
                    </Button>
                  </form>
                </>
              ) : (
                <form>
                  <Button
                    size="lg"
                    formAction={async () => {
                      "use server";
                      const res = await auth.api.signInSocial({
                        body: {
                          provider: "discord",
                          callbackURL: "/",
                        },
                      });
                      if (!res.url) {
                        throw new Error("No URL returned from signInSocial");
                      }
                      redirect(res.url);
                    }}
                  >
                    Sign in with Discord
                  </Button>
                </form>
              )}
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto px-2 py-4 sm:px-4 sm:py-8">
            {session?.user ? (
              <Suspense
                fallback={
                  <div>
                    <div className="mb-6 flex items-center gap-2">
                      <div className="bg-muted-foreground/20 h-8 w-16 animate-pulse rounded" />
                      <div className="bg-muted-foreground/20 h-8 w-20 animate-pulse rounded" />
                      <div className="bg-muted-foreground/20 h-8 w-24 animate-pulse rounded" />
                      <div className="bg-muted-foreground/20 h-8 w-28 animate-pulse rounded" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4 text-lg">
                    Please sign in to view items
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
