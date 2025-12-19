"use client";

import Link from "next/link";

import { Button } from "@acme/ui/button";
import { MobileHeaderMenu } from "./mobile-header-menu";

interface HeaderActionsProps {
  isAuthenticated: boolean;
  logoutAction: () => Promise<void>;
  signInAction: () => Promise<void>;
}

export function HeaderActions({
  isAuthenticated,
  logoutAction,
  signInAction,
}: HeaderActionsProps) {
  // Hide header buttons/menu if user is not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Desktop buttons - hidden on mobile */}
      <div className="hidden items-center gap-2 sm:flex">
        <Button asChild size="lg" className="h-8 px-3 sm:h-10 sm:px-6">
          <Link href="/my-reservations">borrowing</Link>
        </Button>
        <Button asChild size="lg" className="h-8 px-3 sm:h-10 sm:px-6">
          <Link href="/my-stuff">sharing</Link>
        </Button>
        <form>
          <Button
            size="lg"
            variant="outline"
            className="h-8 px-3 sm:h-10 sm:px-6"
            formAction={logoutAction}
          >
            Logout
          </Button>
        </form>
      </div>

      {/* Mobile menu - visible only on mobile */}
      <MobileHeaderMenu
        isAuthenticated={isAuthenticated}
        logoutAction={logoutAction}
        signInAction={signInAction}
      />
    </>
  );
}

