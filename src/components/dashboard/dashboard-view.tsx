"use client";

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
import { useApiData } from "@/hooks/use-api-data";
import { formatNumber, formatRupiah } from "@/lib/format";
import { formatTanggalID } from "@/lib/date";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const { data, loading, error, reload } = useApiData<{ stats: DashboardStats }>("/api/stats");
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Penjualan"
        description="Ringkasan performa penjualan akun Clash of Clans Anda secara real-time dari Google Sheets."
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
              title="Belum ada data penjualan"
              description="Tambahkan transaksi pertama Anda untuk melihat grafik dan statistik di sini."
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
                    <CardDescription>12 bulan terakhir berdasarkan tanggal transaksi</CardDescription>
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
                    <CardTitle>Distribusi Town Hall</CardTitle>
                    <CardDescription>Jumlah akun terjual dan belum laku per TH</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ThChart data={stats.byTh} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Transaksi Terbaru</CardTitle>
                    <CardDescription>6 aktivitas terakhir</CardDescription>
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
                                {transaction.th} · {transaction.deskripsi}
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
