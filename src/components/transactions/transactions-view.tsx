"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Ellipsis,
  Eye,
  FileSpreadsheet,
  Pencil,
  Plus,
  Search,
  Trash,
  TriangleAlert,
  TrendingUp,
  CircleDollarSign,
  PackageOpen,
  ListFilter,
  Funnel,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NativeSelect } from "@/components/native-select";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { TableSkeleton } from "@/components/loading-skeletons";
import { PageHeader } from "@/components/page-header";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { SellDialog } from "@/components/transactions/sell-dialog";
import { DeleteTransactionDialog } from "@/components/transactions/delete-transaction-dialog";
import { TransactionDetailSheet } from "@/components/transactions/transaction-detail-sheet";
import { useApiData } from "@/hooks/use-api-data";
import { formatRupiah } from "@/lib/format";
import { formatTanggalID, monthKey, formatMonthKey } from "@/lib/date";
import { exportToCsv, exportToXlsx, TRANSACTION_HEADERS, transactionToRow } from "@/lib/export";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "sold" | "unsold";
type SortKey = "tanggalBeli" | "hargaModal" | "keuntungan" | "th";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 10;

const TH_OPTIONS = Array.from({ length: 18 }, (_, index) => ({
  value: String(index + 1),
  label: `TH${index + 1}`,
}));

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

function profitOf(transaction: Transaction): number {
  if (transaction.status !== "sold") return 0;
  return (transaction.hargaJual ?? 0) - (transaction.hargaModal ?? 0);
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3.5 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />;
}

export function TransactionsView({ variant = "all" }: { variant?: "all" | "stock" }) {
  const { data, loading, error, reload } = useApiData<TransactionsResponse>("/api/transactions");
  const items = useMemo(() => data?.transactions ?? [], [data]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>(variant === "stock" ? "unsold" : "all");
  const [th, setTh] = useState("all");
  const [bulan, setBulan] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("tanggalBeli");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selling, setSelling] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };
  const updateStatus = (value: StatusFilter) => {
    setStatus(value);
    setPage(1);
  };
  const updateTh = (value: string) => {
    setTh(value);
    setPage(1);
  };
  const updateBulan = (value: string) => {
    setBulan(value);
    setPage(1);
  };

  const bulanOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const item of items) {
      const key = monthKey(item.tanggalJual) || monthKey(item.tanggalBeli);
      if (key) set.set(key, formatMonthKey(key, false));
    }
    return Array.from(set.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([value, label]) => ({ value, label }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (th !== "all") {
        const itemTh = item.th.replace(/\D/g, "");
        if (itemTh !== th) return false;
      }
      if (bulan !== "all") {
        const key = monthKey(item.tanggalJual) || monthKey(item.tanggalBeli);
        if (key !== bulan) return false;
      }
      if (q) {
        const haystack = `${item.deskripsi} ${item.th} ${item.noPenjualan}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      switch (sortKey) {
        case "hargaModal":
          return ((a.hargaModal ?? 0) - (b.hargaModal ?? 0)) * dir;
        case "keuntungan":
          return (profitOf(a) - profitOf(b)) * dir;
        case "th": {
          const aNum = Number(a.th.replace(/\D/g, "")) || 0;
          const bNum = Number(b.th.replace(/\D/g, "")) || 0;
          return (aNum - bNum) * dir;
        }
        case "tanggalBeli":
        default: {
          const aDate = a.tanggalBeli ?? "";
          const bDate = b.tanggalBeli ?? "";
          return aDate.localeCompare(bDate) * dir || a.row - b.row;
        }
      }
    });
    return result;
  }, [items, query, status, th, bulan, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const summary = useMemo(() => {
    const source = variant === "stock" ? items.filter((item) => item.status === "unsold") : items;
    const terjual = source.filter((item) => item.status === "sold");
    const belumLaku = source.filter((item) => item.status === "unsold");
    return {
      total: source.length,
      terjual: terjual.length,
      belumLaku: belumLaku.length,
      modalTertahan: belumLaku.reduce((acc, item) => acc + (item.hargaModal ?? 0), 0),
      keuntungan: terjual.reduce((acc, item) => acc + profitOf(item), 0),
    };
  }, [items, variant]);

  const upsertLocal = () => {
    void reload();
  };

  const removeLocal = () => {
    void reload();
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const filenameBase = () =>
    `JB-COC-${variant === "stock" ? "stok-belum-laku" : "transaksi"}-${new Date()
      .toISOString()
      .slice(0, 10)}`;

  const handleExportCsv = () => {
    exportToCsv(filenameBase(), TRANSACTION_HEADERS, filtered.map(transactionToRow));
    toast.success("Export CSV berhasil", { description: `${filtered.length} transaksi` });
  };

  const handleExportXlsx = async () => {
    try {
      await exportToXlsx(filenameBase(), TRANSACTION_HEADERS, filtered.map(transactionToRow));
      toast.success("Export Excel berhasil", { description: `${filtered.length} transaksi` });
    } catch {
      toast.error("Gagal membuat file Excel");
    }
  };

  const isStock = variant === "stock";

  return (
    <div className="space-y-6">
      <PageHeader
        title={isStock ? "Stok Belum Laku" : "Semua Transaksi"}
        description={
          isStock
            ? "Daftar akun Clash of Clans yang masih tersedia dan belum terjual."
            : "Kelola seluruh data pembelian dan penjualan akun Clash of Clans Anda."
        }
        actions={
          <>
            <Button variant="outline" onClick={handleExportCsv} disabled={filtered.length === 0}>
              <Download className="size-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={handleExportXlsx} disabled={filtered.length === 0}>
              <FileSpreadsheet className="size-4" />
              Excel
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Tambah Akun
            </Button>
          </>
        }
      />

      {!isStock && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Transaksi" value={String(summary.total)} icon={ListFilter} tone="violet" />
          <StatCard label="Akun Terjual" value={String(summary.terjual)} icon={TrendingUp} tone="emerald" />
          <StatCard label="Belum Laku" value={String(summary.belumLaku)} icon={PackageOpen} tone="amber" />
          <StatCard
            label="Total Keuntungan"
            value={formatRupiah(summary.keuntungan)}
            icon={CircleDollarSign}
            tone="cyan"
          />
        </div>
      )}

      {isStock && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Akun Tersedia" value={String(summary.belumLaku)} icon={PackageOpen} tone="amber" />
          <StatCard
            label="Modal Tertahan"
            value={formatRupiah(summary.modalTertahan)}
            icon={CircleDollarSign}
            tone="violet"
          />
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-white/5 bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari deskripsi, TH, atau no penjualan..."
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              className="h-10 pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isStock && (
              <NativeSelect
                value={status}
                onChange={(value) => updateStatus(value as StatusFilter)}
                className="w-40"
                options={[
                  { value: "all", label: "Semua Status" },
                  { value: "sold", label: "Terjual" },
                  { value: "unsold", label: "Belum Laku" },
                ]}
              />
            )}
            <NativeSelect
              value={th}
              onChange={updateTh}
              className="w-32"
              options={[{ value: "all", label: "Semua TH" }, ...TH_OPTIONS]}
            />
            <NativeSelect
              value={bulan}
              onChange={updateBulan}
              className="w-40"
              options={[{ value: "all", label: "Semua Bulan" }, ...bulanOptions]}
            />
          </div>
        </div>

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
            icon={Funnel}
            title={items.length === 0 ? "Belum ada transaksi" : "Tidak ada hasil yang cocok"}
            description={
              items.length === 0
                ? "Mulai catat pembelian akun pertama Anda untuk melihat data di sini."
                : "Coba ubah kata kunci atau filter untuk menemukan transaksi yang dicari."
            }
            action={
              items.length === 0 ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" />
                  Tambah Akun
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>
                    <button
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                      onClick={() => toggleSort("th")}
                    >
                      TH <SortIndicator active={sortKey === "th"} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>
                    <button
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                      onClick={() => toggleSort("tanggalBeli")}
                    >
                      Tgl Beli <SortIndicator active={sortKey === "tanggalBeli"} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead>Tgl Jual</TableHead>
                  <TableHead className="text-right">
                    <button
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                      onClick={() => toggleSort("hargaModal")}
                    >
                      Modal <SortIndicator active={sortKey === "hargaModal"} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">
                    <button
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                      onClick={() => toggleSort("keuntungan")}
                    >
                      Untung <SortIndicator active={sortKey === "keuntungan"} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((transaction) => {
                  const sold = transaction.status === "sold";
                  const profit = profitOf(transaction);
                  return (
                    <TableRow key={transaction.row} className="group">
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {transaction.noPenjualan || transaction.row}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-violet-500/20 bg-violet-500/10 text-violet-300"
                        >
                          {transaction.th}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <button
                          className="truncate text-left transition-colors hover:text-violet-300"
                          onClick={() => {
                            setDetail(transaction);
                            setDetailOpen(true);
                          }}
                        >
                          {transaction.deskripsi || "-"}
                        </button>
                      </TableCell>
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
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                            aria-label="Aksi transaksi"
                          >
                            <Ellipsis className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => {
                                setDetail(transaction);
                                setDetailOpen(true);
                              }}
                            >
                              <Eye className="size-4" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditing(transaction)}>
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            {!sold && (
                              <DropdownMenuItem onClick={() => setSelling(transaction)}>
                                <TrendingUp className="size-4" />
                                Tandai Terjual
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleting(transaction)}
                            >
                              <Trash className="size-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-4 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Menampilkan{" "}
                <span className="text-foreground">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                dari <span className="text-foreground">{filtered.length}</span> transaksi
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage <= 1}
                >
                  Sebelumnya
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <TransactionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={upsertLocal}
      />
      <TransactionDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        transaction={editing}
        onSaved={() => {
          upsertLocal();
          setEditing(null);
        }}
      />
      <SellDialog
        open={Boolean(selling)}
        onOpenChange={(open) => !open && setSelling(null)}
        transaction={selling}
        onSold={() => {
          upsertLocal();
          setSelling(null);
        }}
      />
      <DeleteTransactionDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        transaction={deleting}
        onDeleted={() => {
          removeLocal();
          setDeleting(null);
        }}
      />
      <TransactionDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetail(null);
        }}
        transaction={detail}
        onEdit={(transaction) => {
          setDetailOpen(false);
          setEditing(transaction);
        }}
        onSell={(transaction) => {
          setDetailOpen(false);
          setSelling(transaction);
        }}
        onDelete={(transaction) => {
          setDetailOpen(false);
          setDeleting(transaction);
        }}
      />
    </div>
  );
}
