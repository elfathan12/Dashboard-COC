"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiFetch, ApiRequestError } from "@/lib/client-api";
import { formatRupiah } from "@/lib/format";
import { transactionKey } from "@/lib/transaction-utils";
import type { Transaction } from "@/lib/types";

interface DeleteTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onDeleted?: (transaction: Transaction) => void;
}

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onDeleted,
}: DeleteTransactionDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) setSubmitting(false);
    onOpenChange(next);
  };

  const handleDelete = async () => {
    if (!transaction) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/transactions/${encodeURIComponent(transactionKey(transaction))}`, {
        method: "DELETE",
      });
      toast.success("Transaksi dihapus", { description: transaction.deskripsi });
      onDeleted?.(transaction);
      handleOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : "Gagal menghapus transaksi";
      toast.error(message);
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus transaksi ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini akan menghapus baris pada Google Sheets dan tidak dapat dibatalkan.
            {transaction && (
              <>
                {" "}
                <span className="text-foreground">
                  {transaction.th} · {transaction.deskripsi}
                </span>{" "}
                ({formatRupiah(transaction.hargaModal)}).
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
            disabled={submitting}
          >
            <Trash className="size-4" />
            {submitting ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
