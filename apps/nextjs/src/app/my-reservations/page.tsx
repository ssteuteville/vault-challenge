import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { Breadcrumbs } from "~/app/_components/breadcrumbs";
import { MyReservationsList } from "~/app/_components/my-reservations-list";

function ReservationsListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted border-border animate-pulse rounded-lg border p-6">
        <div className="bg-muted-foreground/20 mb-2 h-6 w-3/4 rounded" />
        <div className="bg-muted-foreground/20 mb-4 h-4 w-full rounded" />
        <div className="flex items-center gap-2">
          <div className="bg-muted-foreground/20 h-5 w-20 rounded" />
          <div className="bg-muted-foreground/20 h-5 w-24 rounded" />
        </div>
      </div>
      <div className="bg-muted border-border animate-pulse rounded-lg border p-6">
        <div className="bg-muted-foreground/20 mb-2 h-6 w-3/4 rounded" />
        <div className="bg-muted-foreground/20 mb-4 h-4 w-full rounded" />
        <div className="flex items-center gap-2">
          <div className="bg-muted-foreground/20 h-5 w-20 rounded" />
          <div className="bg-muted-foreground/20 h-5 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}

export default async function MyReservationsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  prefetch(trpc.loan.getByBorrower.queryOptions());

  return (
    <HydrateClient>
      <main className="container min-h-screen">
        {/* Header with Logo */}
        <div className="mb-8 py-8">
          <Link href="/" className="inline-block">
            <h1 className="text-primary mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
              VAULT
            </h1>
          </Link>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "My Reservations" },
            ]}
          />
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">My Reservations</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              View and manage your item reservations
            </p>
          </div>

          <Suspense fallback={<ReservationsListSkeleton />}>
            <MyReservationsList />
          </Suspense>
        </div>
      </main>
    </HydrateClient>
  );
}

