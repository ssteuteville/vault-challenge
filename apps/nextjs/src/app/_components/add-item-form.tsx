"use client";

import type { z } from "zod/v4";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { CreateItemSchema } from "@acme/db/schema";
import { Button } from "@acme/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@acme/ui/field";
import { Input } from "@acme/ui/input";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import { uploadImage } from "~/lib/upload-image";
import { useTRPC } from "~/trpc/react";

type FormData = z.infer<typeof CreateItemSchema>;

export function AddItemForm() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const createItem = useMutation(
    trpc.item.create.mutationOptions({
      onSuccess: async (data) => {
        toast.success("Item created successfully!");
        await queryClient.invalidateQueries(trpc.item.pathFilter());
        router.push(`/items/${data.id}`);
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to create an item"
            : "Failed to create item",
        );
      },
    }),
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(CreateItemSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      requiresApproval: true,
      status: "available",
      imageUrl: null,
    },
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      setValue("imageUrl", url, { shouldValidate: true });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image",
      );
      // Reset file input
      e.target.value = "";
    } finally {
      setImageUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    await createItem.mutateAsync({
      ...data,
      imageUrl: imageUrl || data.imageUrl || null,
    });
  };

  return (
    <form className="w-full max-w-2xl" onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field data-invalid={!!errors.title}>
          <FieldContent>
            <FieldLabel htmlFor="title">Title</FieldLabel>
          </FieldContent>
          <Input
            id="title"
            {...register("title")}
            aria-invalid={!!errors.title}
            placeholder="Enter item title"
          />
          {errors.title && (
            <FieldError errors={[{ message: errors.title.message }]} />
          )}
        </Field>

        <Field data-invalid={!!errors.description}>
          <FieldContent>
            <FieldLabel htmlFor="description">Description</FieldLabel>
          </FieldContent>
          <Textarea
            id="description"
            {...register("description")}
            aria-invalid={!!errors.description}
            placeholder="Describe your item"
            rows={4}
          />
          {errors.description && (
            <FieldError errors={[{ message: errors.description.message }]} />
          )}
        </Field>

        <Field data-invalid={!!errors.category}>
          <FieldContent>
            <FieldLabel htmlFor="category">Category (optional)</FieldLabel>
          </FieldContent>
          <Input
            id="category"
            {...register("category")}
            aria-invalid={!!errors.category}
            placeholder="e.g., Tools, Books, Games"
          />
          {errors.category && (
            <FieldError errors={[{ message: errors.category.message }]} />
          )}
        </Field>

        <Field>
          <FieldContent>
            <FieldLabel htmlFor="image">Image (optional)</FieldLabel>
          </FieldContent>
          <Input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            disabled={imageUploading}
          />
          {imageUploading && (
            <p className="text-muted-foreground text-sm">Uploading image...</p>
          )}
          {imageUrl && !imageUploading && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Image uploaded successfully
            </p>
          )}
        </Field>

        <Field data-invalid={!!errors.requiresApproval}>
          <FieldContent>
            <div className="flex items-center gap-2">
              <Input
                id="requiresApproval"
                type="checkbox"
                {...register("requiresApproval")}
                className="h-4 w-4"
              />
              <FieldLabel htmlFor="requiresApproval" className="cursor-pointer">
                Require approval for borrowing
              </FieldLabel>
            </div>
          </FieldContent>
          {errors.requiresApproval && (
            <FieldError
              errors={[{ message: errors.requiresApproval.message }]}
            />
          )}
        </Field>

        <input type="hidden" {...register("status")} value="available" />
        <input type="hidden" {...register("imageUrl")} value={imageUrl || ""} />
      </FieldGroup>

      <div className="mt-6 flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || imageUploading || createItem.isPending}
        >
          {isSubmitting || createItem.isPending ? "Creating..." : "Create Item"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting || imageUploading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
