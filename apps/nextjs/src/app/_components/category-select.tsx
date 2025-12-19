"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@acme/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@acme/ui/popover";
import { cn } from "@acme/ui";

const CATEGORIES = [
  "Tools",
  "Books",
  "Board Games",
  "Electronics",
  "Sports Equipment",
  "Kitchen Appliances",
  "Furniture",
  "Musical Instruments",
  "Art Supplies",
  "Outdoor Gear",
  "Toys",
  "Clothing",
  "Vehicles",
  "Home Improvement",
  "Garden Tools",
  "Exercise Equipment",
  "Camping Gear",
  "Photography",
  "Video Games",
  "Other",
] as const;

interface CategorySelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: boolean;
}

export function CategorySelect({
  value,
  onChange,
  error,
}: CategorySelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (category: string) => {
    if (value.includes(category)) {
      onChange(value.filter((c) => c !== category));
    } else {
      onChange([...value, category]);
    }
  };

  const handleRemove = (category: string) => {
    onChange(value.filter((c) => c !== category));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between min-h-10 h-auto py-2 bg-background",
              error && "border-destructive"
            )}
          >
            <div className="flex flex-wrap gap-1.5 flex-1 items-center">
              {value.length === 0 ? (
                <span className="text-muted-foreground">Select categories...</span>
              ) : (
                value.map((category) => (
                  <Badge
                    key={category}
                    variant="default"
                    className="gap-1 px-2 py-0.5 text-xs font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(category);
                    }}
                  >
                    {category}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(category);
                      }}
                      className="ml-0.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-primary-foreground/20 transition-colors"
                    >
                      <X className="size-2.5" />
                      <span className="sr-only">Remove {category}</span>
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup>
                {CATEGORIES.map((category) => (
                  <CommandItem
                    key={category}
                    value={category}
                    onSelect={() => handleSelect(category)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value.includes(category)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {category}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

