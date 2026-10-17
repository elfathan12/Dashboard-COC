"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleCheck, Lightbulb, ListFilter } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { apiFetch, ApiRequestError } from "@/lib/client-api";
import { formatRupiah } from "@/lib/format";
import type { Transaction, TransactionInput } from "@/lib/types";

export function NewTransactionForm() {
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Transaction | null>(null);
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (values: TransactionInput) => {
    setSubmitting(true);
    try {
      const result = await apiFetch<{ transaction: Transaction }>("/api/transactions", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setLastSaved(result.transaction);
      toast.success("Akun berhasil dicatat", { description: result.transaction.deskripsi });
      setFormKey((key) => key + 1);
    } catch (error) {
      const message =
        error instanceof ApiRequestError ? error.message : "Gagal menyimpan transaksi";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Akun Baru"
        description="Catat pembelian akun Clash of Clans. Data akan langsung tersimpan ke Google Sheets."
        actions={
          <Button variant="outline" nativeButton={false} render={<Link href="/transactions" />}>
            <ArrowLeft className="size-4" />
            Kembali ke Daftar
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Detail Transaksi</CardTitle>
            <CardDescription>
              Lengkapi data akun. Kolom bertanda * wajib diisi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionForm
              key={formKey}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitLabel="Simpan Transaksi"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {lastSaved && (
            <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <CircleCheck />
              <AlertTitle>Berhasil disimpan</AlertTitle>
              <AlertDescription className="text-emerald-300/80">
                {lastSaved.th} · {lastSaved.deskripsi} telah ditambahkan (modal{" "}
                {formatRupiah(lastSaved.hargaModal)}).
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lightbulb className="size-4 text-amber-400" />
                Tips Pengisian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <p>
                Isi <span className="text-foreground">Harga Jual</span> hanya jika akun sudah
                terjual. Jika dibiarkan kosong, akun akan tercatat sebagai{" "}
                <span className="text-amber-400">Belum Laku</span>.
              </p>
              <p>
                Keuntungan dihitung otomatis dari{" "}
                <span className="text-foreground">Harga Jual − Harga Modal</span>.
              </p>
              <p>
                Isi <span className="text-foreground">Estimasi Harga Jual</span> untuk akun yang
                masih <span className="text-amber-400">Belum Laku</span>. Nilai ini dipakai untuk
                menghitung <span className="text-violet-300">Potensi Profit</span> dan{" "}
                <span className="text-violet-300">Proyeksi Total Laba</span> di dashboard. Biarkan
                kosong jika belum tahu harga pasarnya.
              </p>
              <p>
                Tanggal jual tidak boleh lebih awal daripada tanggal beli.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ListFilter className="size-4 text-violet-400" />
                Setelah Tersimpan
              </CardTitle>
              <CardDescription className="text-xs">
                Lihat dan kelola data Anda di halaman berikut.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="outline" className="justify-start" nativeButton={false} render={<Link href="/transactions" />}>
                <ListFilter className="size-4" />
                Semua Transaksi
              </Button>
              <Button variant="outline" className="justify-start" nativeButton={false} render={<Link href="/dashboard" />}>
                <CircleCheck className="size-4" />
                Dashboard Statistik
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
