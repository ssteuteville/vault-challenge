"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Filter, Grid3x3, ImageIcon, List, Search } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { cn } from "@acme/ui";

import { ItemStatusFilter } from "./item-status-filter";
import { UserSearch } from "./user-search";

type ItemStatus = "all" | "available" | "borrowed" | "unavailable";
type ViewMode = "grid" | "list";

interface Item {
  id: string;
  title: string;
  description: string;
  category: string | null;
  status: string;
  imageUrl: string | null;
  owner?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

interface ItemGridProps {
  items: Item[];
}

function ItemCard(props: {
  item: Item;
  viewMode: ViewMode;
}) {
  const { item, viewMode } = props;

  const categories = item.category
    ? item.category.split(", ").filter(Boolean)
    : [];

  if (viewMode === "list") {
    return (
      <Link href={`/items/${item.id}`}>
        <div className="bg-muted hover:bg-muted/80 hover:shadow-lg transition-all duration-200 rounded-lg border border-border hover:border-primary/50 p-4 cursor-pointer group flex gap-4">
          <div className="relative w-24 h-24 shrink-0 overflow-hidden rounded-md bg-muted-foreground/10 border border-border group-hover:border-primary/50 flex items-center justify-center transition-all duration-200">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-110"
              />
            ) : (
              <ImageIcon className="text-muted-foreground group-hover:text-primary transition-colors duration-200 size-6" />
            )}
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <h3 className="text-primary group-hover:text-primary/80 text-lg font-bold mb-1 line-clamp-1 transition-colors duration-200">
              {item.title}
            </h3>
            <p className="text-muted-foreground group-hover:text-foreground/80 text-sm mb-2 line-clamp-2 transition-colors duration-200">
              {item.description}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className="text-xs font-medium border-primary text-primary"
                >
                  {category}
                </Badge>
              ))}
              <span
                className={`text-xs font-semibold px-2 py-1 rounded transition-all duration-200 ${
                  item.status === "available"
                    ? "bg-green-500/20 text-green-600 dark:text-green-400 group-hover:bg-green-500/30"
                    : item.status === "borrowed"
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 group-hover:bg-yellow-500/30"
                      : "bg-gray-500/20 text-gray-600 dark:text-gray-400 group-hover:bg-gray-500/30"
                }`}
              >
                {item.status}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/items/${item.id}`}>
      <div className="bg-muted hover:bg-muted/80 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 rounded-lg border border-border hover:border-primary/50 p-4 cursor-pointer group h-full flex flex-col">
        <div className="relative aspect-square mb-3 overflow-hidden rounded-md bg-muted-foreground/10 border border-border group-hover:border-primary/50 flex items-center justify-center transition-all duration-200 group-hover:scale-105">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-110"
            />
          ) : (
            <ImageIcon className="text-muted-foreground group-hover:text-primary transition-colors duration-200 size-8" />
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <h3 className="text-primary group-hover:text-primary/80 text-lg font-bold mb-2 line-clamp-2 transition-colors duration-200">
            {item.title}
          </h3>
          <p className="text-muted-foreground group-hover:text-foreground/80 text-sm mb-3 line-clamp-2 flex-1 transition-colors duration-200">
            {item.description}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((category) => (
              <Badge
                key={category}
                variant="outline"
                className="text-xs font-medium border-primary text-primary"
              >
                {category}
              </Badge>
            ))}
            <span
              className={`text-xs font-semibold px-2 py-1 rounded transition-all duration-200 ${
                item.status === "available"
                  ? "bg-green-500/20 text-green-600 dark:text-green-400 group-hover:bg-green-500/30"
                  : item.status === "borrowed"
                    ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 group-hover:bg-yellow-500/30"
                    : "bg-gray-500/20 text-gray-600 dark:text-gray-400 group-hover:bg-gray-500/30"
              }`}
            >
              {item.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ViewToggle(props: {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  const { value, onChange } = props;

  return (
    <div className="flex items-center gap-1 border border-border rounded-md p-1 bg-background">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("grid")}
        className={cn(
          "h-9 w-9 p-0 min-h-9",
          value === "grid" && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        aria-label="Grid view"
      >
        <Grid3x3 className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("list")}
        className={cn(
          "h-9 w-9 p-0 min-h-9",
          value === "list" && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        aria-label="List view"
      >
        <List className="size-4" />
      </Button>
    </div>
  );
}

export function ItemGrid({ items }: ItemGridProps) {
  const [statusFilter, setStatusFilter] = useState<ItemStatus>("available");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by search query (category, description, or title)
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(query);
        const descriptionMatch = item.description.toLowerCase().includes(query);
        const categoryMatch = item.category
          ? item.category.toLowerCase().includes(query)
          : false;
        return titleMatch || descriptionMatch || categoryMatch;
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Filter by selected user
    if (selectedUserId) {
      filtered = filtered.filter((item) => item.owner?.id === selectedUserId);
    }

    return filtered;
  }, [items, searchQuery, statusFilter, selectedUserId]);

  const ControlsContent = () => (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-3">Status</h3>
          <ItemStatusFilter value={statusFilter} onChange={setStatusFilter} />
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">View</h3>
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-3">Filter by Owner</h3>
          <UserSearch value={selectedUserId} onChange={setSelectedUserId} className="w-full" />
        </div>
      </div>
    </>
  );

  if (filteredItems.length === 0) {
    return (
      <div>
        {/* Search - Always Visible */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="mb-6 hidden sm:block space-y-4">
          <div className="flex flex-row gap-3 items-center justify-between">
            <ItemStatusFilter value={statusFilter} onChange={setStatusFilter} />
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
          <UserSearch value={selectedUserId} onChange={setSelectedUserId} className="w-auto" />
        </div>

        {/* Mobile Controls Dialog */}
        <div className="mb-4 sm:hidden">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Filter className="size-4" />
                Filters
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[100vw] w-full h-[100vh] max-h-[100vh] rounded-none border-0 flex flex-col p-0 sm:hidden">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <ControlsContent />
              </div>
              <DialogFooter className="px-6 py-4 border-t border-border">
                <DialogTrigger asChild>
                  <Button className="w-full">Done</Button>
                </DialogTrigger>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground text-lg">
            No {statusFilter === "all" ? "" : statusFilter} items found
            {selectedUserId ? " for selected user" : ""}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search - Always Visible */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full border-2 border-foreground/20 bg-background focus-visible:border-primary focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Desktop Controls */}
      <div className="mb-6 hidden sm:block space-y-4">
        <div className="flex flex-row gap-3 items-center justify-between">
          <ItemStatusFilter value={statusFilter} onChange={setStatusFilter} />
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>
        <UserSearch value={selectedUserId} onChange={setSelectedUserId} className="w-auto" />
      </div>

      {/* Mobile Controls Dialog */}
      <div className="mb-4 sm:hidden">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Filter className="size-4" />
              Filters
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[100vw] w-full h-[100vh] max-h-[100vh] rounded-none border-0 flex flex-col p-0 sm:hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <ControlsContent />
            </div>
            <DialogFooter className="px-6 py-4 border-t border-border">
              <DialogTrigger asChild>
                <Button className="w-full">Done</Button>
              </DialogTrigger>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}

