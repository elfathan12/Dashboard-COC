"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChartBar,
  ChartLine,
  CircleDollarSign,
  Coins,
  ListFilter,
  PackageOpen,
  Plus,
  RefreshCw,
  Scale,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatGridSkeleton, ChartSkeleton } from "@/components/loading-skeletons";
import { EmptyState } from "@/components/empty-state";
import { MonthlyChart } from "@/components/charts/monthly-chart";
import { StatusChart } from "@/components/charts/status-chart";
import { ThChart } from "@/components/charts/th-chart";
import { NativeSelect } from "@/components/native-select";
import { useApiData } from "@/hooks/use-api-data";
import { formatNumber, formatRupiah } from "@/lib/format";
import { formatTanggalID } from "@/lib/date";
import { ACCOUNT_FILTER_OPTIONS, accountDisplayLabel } from "@/lib/account";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatsResponse {
  stats: DashboardStats;
  periods: string[];
}

const MONTH_OPTIONS = [
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

export function DashboardView() {
  const [accountFilter, setAccountFilter] = useState("all");
  const [periodMode, setPeriodMode] = useState<"all" | "month">("all");
  const [periodMonth, setPeriodMonth] = useState("01");
  const [periodYear, setPeriodYear] = useState("");

  const handlePeriodModeChange = (value: "all" | "month") => {
    setPeriodMode(value);
    if (value === "month" && !periodYear) {
      const now = new Date();
      setPeriodMonth(String(now.getMonth() + 1).padStart(2, "0"));
      setPeriodYear(String(now.getFullYear()));
    }
  };

  const statsUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (accountFilter !== "all") params.set("account", accountFilter);
    if (periodMode === "month" && periodYear) {
      params.set("period", `${periodYear}-${periodMonth}`);
    }
    const query = params.toString();
    return query ? `/api/stats?${query}` : "/api/stats";
  }, [accountFilter, periodMode, periodMonth, periodYear]);

  const { data, loading, error, reload } = useApiData<StatsResponse>(statsUrl);
  const stats = data?.stats;

  const yearOptions = useMemo(() => {
    const years = new Set<string>((data?.periods ?? []).map((period) => period.slice(0, 4)));
    years.add(periodYear);
    return Array.from(years)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))
      .map((value) => ({ value, label: value }));
  }, [data?.periods, periodYear]);

  const selectedAccountLabel =
    ACCOUNT_FILTER_OPTIONS.find((option) => option.value === accountFilter)?.label ?? "Semua Game";

  const distributionMeta = useMemo(() => {
    if (accountFilter === "all") {
      return {
        title: "Distribusi Jenis Akun",
        description: "Jumlah akun COC dan Mobile Legends",
      };
    }
    if (accountFilter === "ml") {
      return {
        title: "Distribusi Akun Mobile Legends",
        description: "Berdasarkan rank/spesifikasi pada deskripsi akun",
      };
    }
    return {
      title: "Distribusi Town Hall",
      description: `Jumlah akun ${selectedAccountLabel} yang terjual dan belum laku`,
    };
  }, [accountFilter, selectedAccountLabel]);

  const hasActiveFilter = accountFilter !== "all" || periodMode === "month";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Penjualan"
        description="Ringkasan performa penjualan akun Clash of Clans dan Mobile Legends secara real-time dari Google Sheets."
        actions={
          <>
            <Button variant="outline" onClick={() => void reload()} disabled={loading}>
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Muat Ulang
            </Button>
            <Button nativeButton={false} render={<Link href="/transactions/new" />}>
              <Plus className="size-4" />
              Tambah Akun
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListFilter className="size-4 text-violet-400" />
            Filter Dashboard
          </CardTitle>
          <CardDescription>
            Pilih jenis akun dan periode penjualan. Seluruh kartu, grafik, dan transaksi
            terbaru akan mengikuti filter ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Jenis Akun</p>
            <NativeSelect
              value={accountFilter}
              onChange={setAccountFilter}
              className="w-52"
              options={ACCOUNT_FILTER_OPTIONS}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Periode</p>
            <NativeSelect
              value={periodMode}
              onChange={(value) => handlePeriodModeChange(value as "all" | "month")}
              className="w-44"
              options={[
                { value: "all", label: "Semua Waktu" },
                { value: "month", label: "Bulan Tertentu" },
              ]}
            />
          </div>
          {periodMode === "month" && (
            <>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Bulan</p>
                <NativeSelect
                  value={periodMonth}
                  onChange={setPeriodMonth}
                  className="w-36"
                  options={MONTH_OPTIONS}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Tahun</p>
                <NativeSelect
                  value={periodYear}
                  onChange={setPeriodYear}
                  className="w-28"
                  options={yearOptions}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {loading && !stats ? (
        <>
          <StatGridSkeleton count={8} />
          <div className="grid gap-4 lg:grid-cols-3">
            <ChartSkeleton className="h-72 lg:col-span-2" />
            <ChartSkeleton className="h-72" />
          </div>
        </>
      ) : error && !stats ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Gagal memuat statistik</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => void reload()}>
              Coba lagi
            </Button>
          </AlertDescription>
        </Alert>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Transaksi"
              value={formatNumber(stats.totalTransaksi)}
              hint={`${stats.jumlahTerjual} terjual · ${stats.jumlahBelumLaku} belum laku`}
              icon={ListFilter}
              tone="violet"
              tooltip="Jumlah seluruh baris transaksi akun di Google Sheets."
            />
            <StatCard
              label="Total Modal"
              value={formatRupiah(stats.totalModal)}
              hint="Seluruh harga modal akun"
              icon={Wallet}
              tone="cyan"
              tooltip="Total harga beli semua akun, termasuk yang masih belum terjual."
            />
            <StatCard
              label="Total Penjualan"
              value={formatRupiah(stats.totalPenjualan)}
              hint="Nilai akun terjual"
              icon={CircleDollarSign}
              tone="violet"
              tooltip="Total harga jual dari akun yang sudah terjual."
            />
            <StatCard
              label="Selisih Kas"
              value={formatRupiah(stats.selisihKas)}
              hint="Kas riil penjualan − modal"
              icon={Scale}
              tone="cyan"
              tooltip="Total Penjualan − Total Modal, mencakup semua akun termasuk yang belum laku. Ini selisih kas, bukan laba bersih."
            />
            <StatCard
              label="Laba Terealisasi"
              value={formatRupiah(stats.labaTerealisasi)}
              hint={`Margin rata-rata ${(stats.rataRataMargin * 100).toFixed(1)}%`}
              icon={TrendingUp}
              tone="emerald"
              tooltip="Harga Jual − Harga Modal, dihitung hanya dari akun yang sudah terjual (laba yang benar-benar sudah didapat)."
            />
            <StatCard
              label="Modal Tertahan"
              value={formatRupiah(stats.modalTertahan)}
              hint={`${stats.jumlahBelumLaku} akun belum laku`}
              icon={Coins}
              tone="amber"
              tooltip="Total harga modal pada akun yang masih BELUM LAKU. Uang yang tertahan di stok."
            />
            <StatCard
              label="Potensi Profit"
              value={stats.potensiProfitAvailable && stats.potensiProfit !== null
                ? formatRupiah(stats.potensiProfit)
                : "—"}
              muted={!stats.potensiProfitAvailable || stats.potensiProfit === null}
              hint={`Estimasi terisi ${stats.estimasiTerisi} dari ${stats.estimasiTotal} akun belum laku`}
              icon={ChartBar}
              tone="emerald"
              tooltip="Perkiraan keuntungan dari akun yang belum laku: estimasi harga jual pada spreadsheet dikurangi harga modal. Jika estimasi kosong, perhitungan memakai estimasi default 20% di atas modal."
            />
            <StatCard
              label="Proyeksi Total Laba"
              value={stats.proyeksiAvailable && stats.proyeksiTotalLaba !== null
                ? formatRupiah(stats.proyeksiTotalLaba)
                : "—"}
              muted={!stats.proyeksiAvailable || stats.proyeksiTotalLaba === null}
              hint="Laba terealisasi + potensi profit akun belum laku"
              icon={ChartLine}
              tone="violet"
              tooltip="Proyeksi laba keseluruhan jika seluruh akun yang belum laku terjual sesuai estimasi harga jual."
            />
          </div>

          {stats.totalTransaksi === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title={
                hasActiveFilter
                  ? "Tidak ada transaksi pada filter ini"
                  : "Belum ada data penjualan"
              }
              description={
                hasActiveFilter
                  ? "Coba pilih jenis akun atau periode lain untuk melihat data."
                  : "Tambahkan transaksi pertama Anda untuk melihat grafik dan statistik di sini."
              }
              action={
                <Button nativeButton={false} render={<Link href="/transactions/new" />}>
                  <Plus className="size-4" />
                  Tambah Akun
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Penjualan & Modal per Bulan</CardTitle>
                    <CardDescription>
                      12 bulan terakhir berdasarkan tanggal beli/jual sesuai filter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MonthlyChart data={stats.monthly} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status Akun</CardTitle>
                    <CardDescription>Perbandingan akun terjual & tersedia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StatusChart data={stats.statusDistribution} />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>{distributionMeta.title}</CardTitle>
                    <CardDescription>{distributionMeta.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ThChart data={stats.byTh} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transaksi Terbaru</CardTitle>
                    <CardDescription>6 aktivitas terakhir sesuai filter</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {stats.recent.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        Belum ada transaksi
                      </p>
                    ) : (
                      stats.recent.map((transaction) => {
                        const sold = transaction.status === "sold";
                        const profit = (transaction.hargaJual ?? 0) - (transaction.hargaModal ?? 0);
                        return (
                          <div
                            key={transaction.row}
                            className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.03]"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {accountDisplayLabel(transaction.th)} · {transaction.deskripsi}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTanggalID(
                                  transaction.tanggalJual ?? transaction.tanggalBeli,
                                  true,
                                )}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 border-transparent",
                                sold
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-amber-500/15 text-amber-400",
                              )}
                            >
                              {sold ? formatRupiah(profit) : "Belum Laku"}
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
