"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  ctaDisabled?: boolean;
  backHref?: string;
  className?: string;
};

export function AppSectionHeader({
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  ctaDisabled,
  backHref,
  className,
}: Props) {
  const backControl = backHref ? (
    <Link
      href={backHref}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-foreground transition-colors hover:bg-muted"
      aria-label="Go back"
    >
      <ChevronLeft className="h-4 w-4" />
    </Link>
  ) : (
    // Preserve layout alignment even when no back URL exists.
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9"
      disabled
      aria-label="Go back"
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
  );

  return (
    <header
      className={cn("flex items-center justify-between gap-3", className)}
    >
      <div className="flex items-center gap-3">
        {backControl}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {ctaLabel ? (
        <Button onClick={onCtaClick} disabled={ctaDisabled}>
          {ctaLabel}
        </Button>
      ) : null}
    </header>
  );
}
