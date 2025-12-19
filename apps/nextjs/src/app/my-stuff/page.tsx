import { redirect } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ImageIcon } from "lucide-react";

import { Button } from "@acme/ui/button";
import { appRouter, createTRPCContext } from "@acme/api";

import { auth, getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";

function ItemCardSkeleton() {
  return (
    <div className="bg-muted animate-pulse rounded-lg border border-border p-6">
      <div className="mb-2 h-6 w-3/4 rounded bg-muted-foreground/20" />
      <div className="mb-4 h-4 w-full rounded bg-muted-foreground/20" />
      <div className="flex items-center gap-2">
        <div className="h-5 w-20 rounded bg-muted-foreground/20" />
        <div className="h-5 w-24 rounded bg-muted-foreground/20" />
      </div>
    </div>
  );
}

function ItemCard(props: {
  item: {
    id: string;
    title: string;
    description: string;
    category: string | null;
    status: string;
    imageUrl: string | null;
  };
}) {
  return (
    <Link href={`/items/${props.item.id}`}>
      <div className="bg-muted hover:bg-muted/80 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 rounded-lg border border-border hover:border-primary/50 p-6 cursor-pointer group">
        <div className="flex gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted-foreground/10 border border-border group-hover:border-primary/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105">
            {props.item.imageUrl ? (
              <Image
                src={props.item.imageUrl}
                alt={props.item.title}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-110"
              />
            ) : (
              <ImageIcon className="text-muted-foreground group-hover:text-primary transition-colors duration-200 size-8" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-primary group-hover:text-primary/80 text-xl font-bold mb-2 truncate transition-colors duration-200">
              {props.item.title}
            </h3>
            <p className="text-muted-foreground group-hover:text-foreground/80 text-sm mb-4 line-clamp-2 transition-colors duration-200">
              {props.item.description}
            </p>
            <div className="flex items-center gap-3">
              {props.item.category && (
                <span className="text-muted-foreground group-hover:text-foreground/70 text-xs font-medium uppercase transition-colors duration-200">
                  {props.item.category}
                </span>
              )}
              <span
                className={`text-xs font-semibold px-2 py-1 rounded transition-all duration-200 ${
                  props.item.status === "available"
                    ? "bg-green-500/20 text-green-600 dark:text-green-400 group-hover:bg-green-500/30"
                    : props.item.status === "borrowed"
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 group-hover:bg-yellow-500/30"
                      : "bg-gray-500/20 text-gray-600 dark:text-gray-400 group-hover:bg-gray-500/30"
                }`}
              >
                {props.item.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

async function ItemList() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/");
  }

  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");
  const ctx = await createTRPCContext({
    headers: heads,
    auth,
  });
  const caller = appRouter.createCaller(ctx);
  const items = await caller.item.byOwner({
    ownerId: session.user.id,
  });

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground text-lg mb-4">
          You don't have any items yet.
        </p>
        <Button asChild>
          <Link href="/items/new">Add your first item</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default async function MyStuffPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  prefetch(
    trpc.item.byOwner.queryOptions({
      ownerId: session.user.id,
    }),
  );

  return (
    <HydrateClient>
      <main className="container min-h-screen">
        <div className="mx-auto max-w-4xl py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Stuff</h1>
            <Button asChild>
              <Link href="/items/new">Add Item</Link>
            </Button>
          </div>

          <Suspense
            fallback={
              <div className="flex flex-col gap-4">
                <ItemCardSkeleton />
                <ItemCardSkeleton />
                <ItemCardSkeleton />
              </div>
            }
          >
            <ItemList />
          </Suspense>
        </div>
      </main>
    </HydrateClient>
  );
}

