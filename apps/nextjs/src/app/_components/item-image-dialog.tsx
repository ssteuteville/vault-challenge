"use client";

import Image from "next/image";
import { ImageIcon, X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@acme/ui/dialog";

interface ItemImageDialogProps {
  imageUrl: string | null;
  title: string;
}

export function ItemImageDialog({ imageUrl, title }: ItemImageDialogProps) {
  if (!imageUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-border bg-muted-foreground/10">
        <div className="flex h-full items-center justify-center">
          <ImageIcon className="text-muted-foreground size-16" />
        </div>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-border bg-muted-foreground/10 cursor-pointer transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={`View full size image of ${title}`}
        >
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 border-0 bg-black/90 rounded-none sm:max-w-[100vw]"
        showCloseButton={false}
      >
        <DialogClose className="absolute top-4 right-4 z-50 rounded-full bg-white/10 backdrop-blur-sm p-2 text-white opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50">
          <X className="size-6" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <div className="flex h-full w-full items-center justify-center p-4">
          <Image
            src={imageUrl}
            alt={title}
            width={1920}
            height={1080}
            className="max-w-full max-h-[calc(100vh-2rem)] w-auto h-auto object-contain"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

