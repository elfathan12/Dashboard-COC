"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CircleDollarSign, LoaderCircle, Save, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/currency-input";
import { NativeSelect } from "@/components/native-select";
import { formatRupiah } from "@/lib/format";
import { transactionInputSchema, type TransactionParsed } from "@/lib/schemas";
import type { TransactionInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const TH_OPTIONS = Array.from({ length: 18 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `TH${value}` };
});

export interface TransactionFormProps {
  defaultValues?: Partial<TransactionInput>;
  onSubmit: (values: TransactionParsed) => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
  className?: string;
}

interface FormState {
  th: string;
  deskripsi: string;
  tanggalBeli: string;
  tanggalJual: string;
  hargaModal: number | null;
  hargaJual: number | null;
  estimasiHargaJual: number | null;
}

function toState(values?: Partial<TransactionInput>): FormState {
  return {
    th: values?.th ?? "",
    deskripsi: values?.deskripsi ?? "",
    tanggalBeli: values?.tanggalBeli ?? "",
    tanggalJual: values?.tanggalJual ?? "",
    hargaModal: values?.hargaModal ?? null,
    hargaJual: values?.hargaJual ?? null,
    estimasiHargaJual: values?.estimasiHargaJual ?? null,
  };
}

export function TransactionForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Simpan",
  className,
}: TransactionFormProps) {
  const [form, setForm] = useState<FormState>(() => toState(defaultValues));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const preview = useMemo(() => {
    const modal = form.hargaModal ?? 0;
    const jual = form.hargaJual ?? 0;
    const estimasi = form.estimasiHargaJual ?? 0;
    const sold = form.hargaJual !== null && form.hargaJual > 0;
    const hasEstimasi = !sold && form.estimasiHargaJual !== null && form.estimasiHargaJual > 0;
    const profit = sold ? jual - modal : 0;
    const margin = sold && modal > 0 ? profit / modal : 0;
    const potensi = hasEstimasi ? estimasi - modal : 0;
    return { sold, hasEstimasi, profit, margin, potensi };
  }, [form.hargaModal, form.hargaJual, form.estimasiHargaJual]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = transactionInputSchema.safeParse({
      th: form.th,
      deskripsi: form.deskripsi,
      tanggalBeli: form.tanggalBeli || null,
      tanggalJual: form.tanggalJual || null,
      hargaModal: form.hargaModal,
      hargaJual: form.hargaJual,
      estimasiHargaJual: form.estimasiHargaJual,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    await onSubmit(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="th">Town Hall *</Label>
          <NativeSelect
            id="th"
            value={form.th}
            onChange={(value) => update("th", value)}
            options={TH_OPTIONS}
            placeholder="Pilih TH"
          />
          {errors.th && <p className="text-xs text-destructive">{errors.th}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tanggalBeli">Tanggal Beli</Label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="tanggalBeli"
              type="date"
              value={form.tanggalBeli}
              onChange={(event) => update("tanggalBeli", event.target.value)}
              className="h-10 pl-9"
            />
          </div>
          {errors.tanggalBeli && <p className="text-xs text-destructive">{errors.tanggalBeli}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deskripsi">Deskripsi Akun *</Label>
        <Textarea
          id="deskripsi"
          rows={3}
          placeholder="Contoh: TH13 | Level 200 | Full hero | Skin lengkap"
          value={form.deskripsi}
          onChange={(event) => update("deskripsi", event.target.value)}
          aria-invalid={Boolean(errors.deskripsi)}
        />
        {errors.deskripsi && <p className="text-xs text-destructive">{errors.deskripsi}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hargaModal">Harga Modal *</Label>
          <CurrencyInput
            id="hargaModal"
            value={form.hargaModal}
            onChange={(value) => update("hargaModal", value)}
            ariaInvalid={Boolean(errors.hargaModal)}
          />
          {errors.hargaModal && <p className="text-xs text-destructive">{errors.hargaModal}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hargaJual">
            Harga Jual
            <span className="font-normal text-muted-foreground">(kosongkan jika belum laku)</span>
          </Label>
          <CurrencyInput
            id="hargaJual"
            value={form.hargaJual}
            onChange={(value) => update("hargaJual", value)}
            ariaInvalid={Boolean(errors.hargaJual)}
          />
          {errors.hargaJual && <p className="text-xs text-destructive">{errors.hargaJual}</p>}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="estimasiHargaJual">
            Estimasi Harga Jual
            <span className="font-normal text-muted-foreground">(opsional, akun belum laku)</span>
          </Label>
          <CurrencyInput
            id="estimasiHargaJual"
            value={form.estimasiHargaJual}
            onChange={(value) => update("estimasiHargaJual", value)}
            ariaInvalid={Boolean(errors.estimasiHargaJual)}
          />
          {errors.estimasiHargaJual && (
            <p className="text-xs text-destructive">{errors.estimasiHargaJual}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tanggalJual">Tanggal Jual</Label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="tanggalJual"
              type="date"
              value={form.tanggalJual}
              onChange={(event) => update("tanggalJual", event.target.value)}
              className="h-10 pl-9"
            />
          </div>
          {errors.tanggalJual && <p className="text-xs text-destructive">{errors.tanggalJual}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pratinjau Keuntungan</Label>
        <div className="flex h-10 items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3">
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-muted-foreground" />
            <Badge
              variant="outline"
              className={cn(
                "border-transparent",
                preview.sold
                  ? "bg-emerald-500/15 text-emerald-400"
                  : preview.hasEstimasi
                    ? "bg-violet-500/15 text-violet-400"
                    : "bg-amber-500/15 text-amber-400",
              )}
            >
              {preview.sold ? "Terjual" : preview.hasEstimasi ? "Potensi" : "Belum Laku"}
            </Badge>
          </div>
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              preview.sold
                ? preview.profit >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
                : preview.hasEstimasi
                  ? preview.potensi >= 0
                    ? "text-violet-400"
                    : "text-rose-400"
                  : "text-muted-foreground",
            )}
          >
            {preview.sold
              ? formatRupiah(preview.profit)
              : preview.hasEstimasi
                ? formatRupiah(preview.potensi)
                : "-"}
          </span>
        </div>
        {preview.sold && preview.margin !== 0 && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="size-3" />
            Margin {(preview.margin * 100).toFixed(1)}%
          </p>
        )}
        {!preview.sold && preview.hasEstimasi && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="size-3" />
            Potensi profit bila terjual pada harga estimasi
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-10 w-full" disabled={submitting}>
        {submitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            {submitLabel === "Simpan" ? (
              <Save className="size-4" />
            ) : (
              <CircleDollarSign className="size-4" />
            )}
            {submitLabel}
          </>
        )}
      </Button>
    </form>
  );
}
