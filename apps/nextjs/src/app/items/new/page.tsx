import { redirect } from "next/navigation";

import { AddItemForm } from "~/app/_components/add-item-form";
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
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-8 text-4xl font-bold">Add New Item</h1>
          <p className="text-muted-foreground mb-6">
            Share an item with your community. Fill out the form below to create
            a new listing.
          </p>
          <AddItemForm />
        </div>
      </main>
    </HydrateClient>
  );
}
