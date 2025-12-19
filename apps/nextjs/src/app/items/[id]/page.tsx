import { notFound } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { Calendar, CheckCircle2, User, XCircle } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { appRouter, createTRPCContext } from "@acme/api";

import { auth } from "~/auth/server";
import { Breadcrumbs } from "~/app/_components/breadcrumbs";
import { ItemImageDialog } from "~/app/_components/item-image-dialog";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";

function ItemDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Image skeleton */}
      <div className="bg-muted animate-pulse aspect-video rounded-lg border border-border" />
      
      {/* Content skeleton */}
      <div className="bg-muted/30 rounded-lg border-2 border-border p-6 space-y-4">
        <div className="h-8 w-3/4 rounded bg-muted-foreground/20" />
        <div className="h-4 w-full rounded bg-muted-foreground/20" />
        <div className="h-4 w-5/6 rounded bg-muted-foreground/20" />
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded bg-muted-foreground/20" />
          <div className="h-6 w-24 rounded bg-muted-foreground/20" />
        </div>
      </div>
    </div>
  );
}

async function ItemDetailContent({ itemId }: { itemId: string }) {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");
  const ctx = await createTRPCContext({
    headers: heads,
    auth,
  });
  const caller = appRouter.createCaller(ctx);
  const item = await caller.item.byId({ id: itemId });

  if (!item) {
    notFound();
  }

  const categories = item.category
    ? item.category.split(", ").filter(Boolean)
    : [];

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Image */}
      <ItemImageDialog imageUrl={item.imageUrl} title={item.title} />

      {/* Main Content */}
      <div className="bg-muted/30 rounded-lg border-2 border-border p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-foreground mb-4 text-3xl font-bold sm:text-4xl">
            {item.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((category) => (
              <Badge
                key={category}
                variant="outline"
                className="border-primary text-primary text-sm font-medium"
              >
                {category}
              </Badge>
            ))}
            <span
              className={`rounded px-3 py-1 text-sm font-semibold ${
                item.status === "available"
                  ? "bg-green-500/20 text-green-600 dark:text-green-400"
                  : item.status === "borrowed"
                    ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                    : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
              }`}
            >
              {item.status}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-foreground mb-3 text-xl font-semibold">
            Description
          </h2>
          <p className="text-muted-foreground whitespace-pre-wrap text-base leading-7">
            {item.description}
          </p>
        </div>

        {/* Details Grid */}
        <div className="border-border mb-6 grid gap-4 border-t pt-6 sm:grid-cols-2">
          {/* Owner */}
          <div className="flex items-start gap-3">
            {item.owner?.image ? (
              <div className="relative mt-0.5 size-10 shrink-0 overflow-hidden rounded-full border-2 border-border">
                <Image
                  src={item.owner.image}
                  alt={item.owner?.name || item.owner?.email || "Owner"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <User className="text-muted-foreground mt-0.5 size-10 shrink-0" />
            )}
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Owner
              </p>
              <p className="text-foreground text-base">
                {item.owner?.name || item.owner?.email || "Unknown"}
              </p>
            </div>
          </div>

          {/* Requires Approval */}
          <div className="flex items-start gap-3">
            {item.requiresApproval ? (
              <CheckCircle2 className="text-muted-foreground mt-0.5 size-10 shrink-0" />
            ) : (
              <XCircle className="text-muted-foreground mt-0.5 size-10 shrink-0" />
            )}
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Approval Required
              </p>
              <p className="text-foreground text-base">
                {item.requiresApproval ? "Yes" : "No"}
              </p>
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-start gap-3">
            <Calendar className="text-muted-foreground mt-0.5 size-10 shrink-0" />
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Created
              </p>
              <p className="text-foreground text-base">
                {formatDate(item.createdAt)}
              </p>
            </div>
          </div>

          {/* Updated Date */}
          <div className="flex items-start gap-3">
            <Calendar className="text-muted-foreground mt-0.5 size-10 shrink-0" />
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Last Updated
              </p>
              <p className="text-foreground text-base">
                {formatDate(item.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Loans Info */}
        {item.loans && item.loans.length > 0 && (
          <div className="border-border border-t pt-6">
            <h2 className="text-foreground mb-3 text-xl font-semibold">
              Loan History
            </h2>
            <p className="text-muted-foreground text-sm">
              {item.loans.length} loan{item.loans.length !== 1 ? "s" : ""}{" "}
              recorded
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  prefetch(trpc.item.byId.queryOptions({ id }));

  return (
    <HydrateClient>
      <main className="container min-h-screen">
        {/* Header with Logo and Breadcrumbs */}
        <div className="mb-8 py-8">
          <Link href="/" className="inline-block">
            <h1 className="text-primary mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
              VAULT
            </h1>
          </Link>
          <Suspense
            fallback={
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Loading..." },
                ]}
              />
            }
          >
            <ItemBreadcrumbs itemId={id} />
          </Suspense>
        </div>

        <div className="mx-auto max-w-4xl pb-8">
          <Suspense fallback={<ItemDetailSkeleton />}>
            <ItemDetailContent itemId={id} />
          </Suspense>
        </div>
      </main>
    </HydrateClient>
  );
}

async function ItemBreadcrumbs({ itemId }: { itemId: string }) {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");
  const ctx = await createTRPCContext({
    headers: heads,
    auth,
  });
  const caller = appRouter.createCaller(ctx);
  const item = await caller.item.byId({ id: itemId });

  return (
    <Breadcrumbs
      items={[
        { label: "Home", href: "/" },
        { label: item?.title || "Item" },
      ]}
    />
  );
}

