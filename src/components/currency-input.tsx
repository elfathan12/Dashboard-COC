"use client";

import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  id?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaInvalid?: boolean;
}

export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder = "0",
  disabled,
  className,
  ariaInvalid,
}: CurrencyInputProps) {
  const display = value === null || value === undefined ? "" : formatNumber(Math.round(value));

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    onChange(digits === "" ? null : Number(digits));
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
        Rp
      </span>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={display}
        onChange={(event) => handleChange(event.target.value)}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={cn("h-10 pl-9 tabular-nums", className)}
      />
    </div>
  );
}
