"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { apiFetch, ApiRequestError } from "@/lib/client-api";
import { transactionKey } from "@/lib/transaction-utils";
import type { Transaction } from "@/lib/types";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onSaved?: (transaction: Transaction) => void;
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSaved,
}: TransactionDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(transaction);

  const handleOpenChange = (next: boolean) => {
    if (!next) setSubmitting(false);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <Pencil className="size-4 text-violet-400" />
            ) : (
              <Plus className="size-4 text-violet-400" />
            )}
            {isEdit ? "Edit Transaksi" : "Tambah Akun Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui data transaksi akun Clash of Clans ini."
              : "Catat pembelian akun baru. Kosongkan harga jual jika akun belum terjual."}
          </DialogDescription>
        </DialogHeader>

        <TransactionForm
          defaultValues={
            transaction
              ? {
                  th: transaction.th,
                  deskripsi: transaction.deskripsi,
                  tanggalBeli: transaction.tanggalBeli ?? "",
                  tanggalJual: transaction.tanggalJual ?? "",
                  hargaModal: transaction.hargaModal,
                  hargaJual: transaction.hargaJual,
                  estimasiHargaJual: transaction.estimasiHargaJual,
                }
              : undefined
          }
          submitting={submitting}
          submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Transaksi"}
          onSubmit={async (values) => {
            setSubmitting(true);
            try {
              const url = isEdit
                ? `/api/transactions/${encodeURIComponent(transactionKey(transaction!))}`
                : "/api/transactions";
              const result = await apiFetch<{ transaction: Transaction }>(url, {
                method: isEdit ? "PUT" : "POST",
                body: JSON.stringify(values),
              });
              toast.success(isEdit ? "Transaksi diperbarui" : "Akun baru dicatat", {
                description: result.transaction.deskripsi,
              });
              onSaved?.(result.transaction);
              handleOpenChange(false);
            } catch (error) {
              const message =
                error instanceof ApiRequestError ? error.message : "Gagal menyimpan transaksi";
              toast.error(message);
              setSubmitting(false);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
