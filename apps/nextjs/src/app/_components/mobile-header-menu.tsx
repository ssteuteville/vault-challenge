"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@acme/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

interface MobileHeaderMenuProps {
  isAuthenticated: boolean;
  logoutAction: () => Promise<void>;
  signInAction: () => Promise<void>;
}

export function MobileHeaderMenu({
  isAuthenticated,
  logoutAction,
  signInAction,
}: MobileHeaderMenuProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.refresh();
  };

  const handleSignIn = async () => {
    await signInAction();
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="h-8 w-8 p-0 sm:hidden"
          aria-label="Menu"
        >
          <svg
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 6h16M4 12h16M4 18h16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isAuthenticated ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/my-reservations">Borrowing</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/my-stuff">Sharing</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              Logout
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={handleSignIn}>
            Sign in with Discord
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

