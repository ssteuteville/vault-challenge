"use client";

import { useState } from "react";

import { Button } from "@acme/ui/button";

import { ReserveItemDialog } from "./reserve-item-dialog";

interface ReserveItemButtonProps {
  itemId: string;
  requiresApproval: boolean;
}

export function ReserveItemButton({
  itemId,
  requiresApproval,
}: ReserveItemButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg" className="shadow-lg">
        Reserve
      </Button>
      <ReserveItemDialog
        itemId={itemId}
        requiresApproval={requiresApproval}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
