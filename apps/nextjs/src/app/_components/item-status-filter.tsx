"use client";

import { Button } from "@acme/ui/button";
import { cn } from "@acme/ui";

type ItemStatus = "all" | "available" | "borrowed" | "unavailable";

interface ItemStatusFilterProps {
  value: ItemStatus;
  onChange: (status: ItemStatus) => void;
}

export function ItemStatusFilter({ value, onChange }: ItemStatusFilterProps) {
  const filters: { label: string; value: ItemStatus }[] = [
    { label: "All", value: "all" },
    { label: "Available", value: "available" },
    { label: "Borrowed", value: "borrowed" },
    { label: "Unavailable", value: "unavailable" },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={value === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(filter.value)}
          className={cn(
            "min-h-9 px-3",
            value === filter.value && "bg-primary text-primary-foreground"
          )}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

