"use client";

import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TONES = {
  violet: "from-violet-500/20 to-violet-500/0 text-violet-400 ring-violet-500/20",
  emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-400 ring-emerald-500/20",
  amber: "from-amber-500/20 to-amber-500/0 text-amber-400 ring-amber-500/20",
  cyan: "from-cyan-500/20 to-cyan-500/0 text-cyan-400 ring-cyan-500/20",
  rose: "from-rose-500/20 to-rose-500/0 text-rose-400 ring-rose-500/20",
  neutral: "from-white/10 to-white/0 text-muted-foreground ring-white/10",
} as const;

export type StatTone = keyof typeof TONES;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "violet",
  tooltip,
  muted = false,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: StatTone;
  /** Teks penjelasan yang muncul saat ikon info di-hover/disentuh. */
  tooltip?: string;
  /** Tampilkan nilai lebih kecil & redup (untuk "Belum tersedia"). */
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/5 bg-card p-5 transition-colors hover:border-white/10",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
            {tooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    aria-label={`Penjelasan ${label}`}
                    className="ml-1 inline-flex align-middle text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:text-foreground"
                  >
                    <Info className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="max-w-64">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </p>
          <p
            className={cn(
              "tabular-nums",
              muted
                ? "text-base font-medium text-muted-foreground"
                : "text-2xl font-semibold tracking-tight",
            )}
          >
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1",
            TONES[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <div className="pointer-events-none absolute -right-8 -bottom-10 size-24 rounded-full bg-white/[0.02] blur-2xl transition-opacity group-hover:opacity-80" />
    </div>
  );
}
