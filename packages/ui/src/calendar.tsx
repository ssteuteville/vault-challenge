"use client";

import type React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@acme/ui";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className="rdp-root">
      <DayPicker
        animate
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          ...classNames,
        }}
        {...props}
      />
    </div>
  );
}

export { Calendar };
