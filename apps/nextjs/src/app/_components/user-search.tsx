"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

import { useTRPC } from "~/trpc/react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface UserSearchProps {
  value: string | null;
  onChange: (userId: string | null) => void;
  className?: string;
}

export function UserSearch({ value, onChange, className }: UserSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const trpc = useTRPC();

  const { data: users = [], isLoading } = useQuery(
    trpc.auth.searchUsers.queryOptions(
      { query: searchQuery || "" },
      {
        enabled: open, // Fetch when popover is open
      }
    )
  );

  const { data: selectedUser } = useQuery(
    trpc.auth.getUserById.queryOptions(
      { id: value ?? "" },
      {
        enabled: !!value,
      }
    )
  );

  const handleSelect = (userId: string) => {
    if (value === userId) {
      onChange(null);
    } else {
      onChange(userId);
    }
    setOpen(false);
    setSearchQuery("");
  };

  const handleRemove = () => {
    onChange(null);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-background border-2 border-border sm:w-64 min-h-10", className)}
        >
          <span className="truncate">
            {selectedUser
              ? selectedUser.name || selectedUser.email || "Unknown"
              : "Search by owner..."}
          </span>
          {selectedUser ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-accent transition-colors p-0.5"
            >
              <X className="size-3" />
              <span className="sr-only">Remove filter</span>
            </button>
          ) : (
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search users..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchQuery.length > 0 ? "Searching..." : "Loading users..."}
              </div>
            ) : users.length === 0 ? (
              <CommandEmpty>
                {searchQuery.length > 0 ? "No users found." : "No users available."}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.name} ${user.email}`}
                    onSelect={() => handleSelect(user.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{user.name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
