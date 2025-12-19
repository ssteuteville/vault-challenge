import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@acme/ui";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-2", className)}>
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
              {isLast || !item.href ? (
                <span className={cn(
                  "text-sm",
                  isLast ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

