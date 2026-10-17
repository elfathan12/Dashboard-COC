"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  TriangleAlert,
  Wallet,
  TrendingUp,
  CircleDollarSign,
  ListFilter,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NativeSelect } from "@/components/native-select";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { TableSkeleton } from "@/components/loading-skeletons";
import { EmptyState } from "@/components/empty-state";
import { useApiData } from "@/hooks/use-api-data";
import { formatRupiah } from "@/lib/format";
import { formatTanggalID, formatMonthKey, monthKey, yearOf } from "@/lib/date";
import { exportToCsv, exportToXlsx, TRANSACTION_HEADERS, transactionToRow } from "@/lib/export";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TransactionsResponse {
  transactions: Transaction[];
}

const PREVIEW_LIMIT = 100;

export function ReportsView() {
  const { data, loading, error, reload } = useApiData<TransactionsResponse>("/api/transactions");
  const items = useMemo(() => data?.transactions ?? [], [data]);

  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [status, setStatus] = useState("all");

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const y = yearOf(item.tanggalJual) || yearOf(item.tanggalBeli);
      if (y) set.add(y);
    }
    return Array.from(set)
      .sort((a, b) => b.localeCompare(a))
      .map((value) => ({ value, label: value }));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const itemYear = yearOf(item.tanggalJual) || yearOf(item.tanggalBeli);
      if (year !== "all" && itemYear !== year) return false;
      if (month !== "all") {
        const key = monthKey(item.tanggalJual) || monthKey(item.tanggalBeli);
        if (key.slice(5) !== month) return false;
      }
      if (status !== "all" && item.status !== status) return false;
      return true;
    });
  }, [items, year, month, status]);

  const summary = useMemo(() => {
    const modal = filtered.reduce((acc, item) => acc + (item.hargaModal ?? 0), 0);
    const penjualan = filtered.reduce((acc, item) => acc + (item.hargaJual ?? 0), 0);
    const sold = filtered.filter((item) => item.status === "sold");
    const laba = sold.reduce(
      (acc, item) => acc + ((item.hargaJual ?? 0) - (item.hargaModal ?? 0)),
      0,
    );
    return {
      modal,
      penjualan,
      laba,
      sold: sold.length,
      unsold: filtered.length - sold.length,
      margin: modal > 0 ? laba / modal : 0,
    };
  }, [filtered]);

  const periodLabel = useMemo(() => {
    const parts: string[] = [];
    if (month !== "all" && year !== "all") parts.push(formatMonthKey(`${year}-${month}`, false));
    else if (year !== "all") parts.push(`Tahun ${year}`);
    else parts.push("Semua Periode");
    if (status === "sold") parts.push("Terjual");
    if (status === "unsold") parts.push("Belum Laku");
    return parts.join(" · ");
  }, [month, year, status]);

  const filenameBase = `Laporan-JB-COC-${year === "all" ? "semua" : year}${
    month === "all" ? "" : `-${month}`
  }`;

  const handleExportCsv = () => {
    exportToCsv(filenameBase, TRANSACTION_HEADERS, filtered.map(transactionToRow));
    toast.success("Laporan CSV berhasil diunduh", { description: periodLabel });
  };

  const handleExportXlsx = async () => {
    try {
      await exportToXlsx(filenameBase, TRANSACTION_HEADERS, filtered.map(transactionToRow), "Laporan");
      toast.success("Laporan Excel berhasil diunduh", { description: periodLabel });
    } catch {
      toast.error("Gagal membuat file Excel");
    }
  };

  const monthOptions = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Penjualan"
        description="Rekap transaksi berdasarkan periode, lengkap dengan export CSV/Excel untuk pembukuan."
        actions={
          <>
            <Button variant="outline" onClick={() => void reload()} disabled={loading}>
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Muat Ulang
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" />
              Cetak
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
          <CardDescription>Tentukan rentang laporan yang ingin ditampilkan.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <NativeSelect
            value={month}
            onChange={setMonth}
            className="w-40"
            options={[{ value: "all", label: "Semua Bulan" }, ...monthOptions]}
          />
          <NativeSelect
            value={year}
            onChange={setYear}
            className="w-32"
            options={[{ value: "all", label: "Semua Tahun" }, ...yearOptions]}
          />
          <NativeSelect
            value={status}
            onChange={setStatus}
            className="w-40"
            options={[
              { value: "all", label: "Semua Status" },
              { value: "sold", label: "Terjual" },
              { value: "unsold", label: "Belum Laku" },
            ]}
          />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCsv} disabled={filtered.length === 0}>
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportXlsx} disabled={filtered.length === 0}>
              <FileSpreadsheet className="size-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jumlah Transaksi" value={String(filtered.length)} icon={ListFilter} tone="violet" hint={periodLabel} />
        <StatCard label="Total Modal" value={formatRupiah(summary.modal)} icon={Wallet} tone="cyan" />
        <StatCard label="Total Penjualan" value={formatRupiah(summary.penjualan)} icon={CircleDollarSign} tone="violet" />
        <StatCard
          label="Laba"
          value={formatRupiah(summary.laba)}
          hint={`Margin ${(summary.margin * 100).toFixed(1)}%`}
          icon={TrendingUp}
          tone="emerald"
        />
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader>
          <CardTitle>Detail Laporan</CardTitle>
          <CardDescription>
            {periodLabel} · {summary.sold} terjual · {summary.unsold} belum laku
            {filtered.length > PREVIEW_LIMIT && ` · menampilkan ${PREVIEW_LIMIT} baris pertama`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && items.length === 0 ? (
            <TableSkeleton rows={6} />
          ) : error ? (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertTitle>Gagal memuat data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="Tidak ada transaksi pada periode ini"
              description="Ubah filter periode atau tambahkan transaksi baru terlebih dahulu."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>No</TableHead>
                  <TableHead>TH</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Tgl Beli</TableHead>
                  <TableHead>Tgl Jual</TableHead>
                  <TableHead className="text-right">Modal</TableHead>
                  <TableHead className="text-right">Jual</TableHead>
                  <TableHead className="text-right">Untung</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, PREVIEW_LIMIT).map((transaction) => {
                  const sold = transaction.status === "sold";
                  const profit = (transaction.hargaJual ?? 0) - (transaction.hargaModal ?? 0);
                  return (
                    <TableRow key={transaction.row}>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {transaction.noPenjualan || transaction.row}
                      </TableCell>
                      <TableCell className="font-medium">{transaction.th}</TableCell>
                      <TableCell className="max-w-[240px] truncate">{transaction.deskripsi}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTanggalID(transaction.tanggalBeli, true)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTanggalID(transaction.tanggalJual, true)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRupiah(transaction.hargaModal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {transaction.hargaJual ? formatRupiah(transaction.hargaJual) : "-"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          !sold ? "text-muted-foreground" : profit >= 0 ? "text-emerald-400" : "text-rose-400",
                        )}
                      >
                        {sold ? formatRupiah(profit) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent",
                            sold
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400",
                          )}
                        >
                          {sold ? "Terjual" : "Belum Laku"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
