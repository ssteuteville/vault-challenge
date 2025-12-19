import Link from "next/link";
import { redirect } from "next/navigation";

import { AddItemForm } from "~/app/_components/add-item-form";
import { Breadcrumbs } from "~/app/_components/breadcrumbs";
import { getSession } from "~/auth/server";
import { HydrateClient } from "~/trpc/server";

export default async function NewItemPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <HydrateClient>
      <main className="container mx-auto py-8">
        {/* Header with Logo and Breadcrumbs */}
        <div className="mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl mb-3">
              VAULT
            </h1>
          </Link>
          <Breadcrumbs
            items={[
              { label: "My Stuff", href: "/my-stuff" },
              { label: "Add Item" },
            ]}
          />
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="mb-10">
            <h2 className="text-foreground text-2xl font-bold mb-2">
              Share an item with your community
            </h2>
            <p className="text-muted-foreground text-base leading-7">
              Fill out the form below to create a new listing.
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg border-2 border-border p-6">
            <AddItemForm />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
