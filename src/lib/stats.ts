import { formatMonthKey } from "./date";
import {
  accountDistributionLabel,
  accountSortValue,
  matchesAccountFilter,
  type AccountFilter,
  type DistributionMode,
} from "./account";
import { transactionDate, transactionMonthKey } from "./transaction-utils";
import type { DashboardStats, MonthlyPoint, ThPoint, Transaction } from "./types";

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

export interface DashboardStatsOptions {
  distributionMode?: DistributionMode;
}

export function filterTransactions(
  transactions: Transaction[],
  filter: AccountFilter,
  periodKey: string | null,
): Transaction[] {
  return transactions.filter((transaction) => {
    if (!matchesAccountFilter(transaction.th, filter)) return false;
    if (periodKey && transactionMonthKey(transaction) !== periodKey) return false;
    return true;
  });
}

export function availablePeriodKeys(transactions: Transaction[]): string[] {
  const keys = new Set<string>();
  for (const transaction of transactions) {
    const key = transactionMonthKey(transaction);
    if (key) keys.add(key);
  }
  return Array.from(keys).sort((a, b) => b.localeCompare(a));
}

export function computeDashboardStats(
  transactions: Transaction[],
  options: DashboardStatsOptions = {},
): DashboardStats {
  const distributionMode = options.distributionMode ?? "th";

  const totalModal = sum(transactions.map((t) => t.hargaModal ?? 0));
  const totalPenjualan = sum(transactions.map((t) => t.hargaJual ?? 0));
  /** Selisih kas = Total Penjualan - Total Modal, mencakup semua akun (termasuk yang belum laku). */
  const selisihKas = totalPenjualan - totalModal;

  const sold = transactions.filter((t) => t.status === "sold");
  const unsold = transactions.filter((t) => t.status === "unsold");

  /** Laba terealisasi = hanya akun yang sudah terjual. */
  const labaTerealisasi = sum(
    sold.map((t) => (t.hargaJual ?? 0) - (t.hargaModal ?? 0)),
  );
  /** Modal tertahan = modal pada seluruh akun yang belum laku. */
  const modalTertahan = sum(unsold.map((t) => t.hargaModal ?? 0));

  /**
   * Potensi profit = SUM(Estimasi Harga Jual Efektif - Harga Modal) hanya untuk
   * transaksi belum laku. Jika estimasi kosong, pakai default modal x 1.20.
   */
  const potensiProfit = sum(
    unsold.map((t) => {
      const modal = t.hargaModal ?? 0;
      const estimasiEfektif =
        t.estimasiHargaJual !== null && t.estimasiHargaJual !== undefined
          ? t.estimasiHargaJual
          : modal * 1.2;
      return estimasiEfektif - modal;
    }),
  );

  const estimasiTerisi = unsold.filter((t) => t.estimasiHargaJual !== null).length;
  const estimasiTotal = unsold.length;

  /** Proyeksi total laba = Laba Terealisasi + Potensi Profit. */
  const proyeksiTotalLaba = labaTerealisasi + (potensiProfit ?? 0);

  const monthMap = new Map<string, MonthlyPoint>();
  for (const t of transactions) {
    const key = transactionMonthKey(t);
    if (!key) continue;
    const point =
      monthMap.get(key) ??
      ({
        key,
        label: formatMonthKey(key),
        penjualan: 0,
        modal: 0,
        laba: 0,
        terjual: 0,
        belumLaku: 0,
      } satisfies MonthlyPoint);

    point.modal += t.hargaModal ?? 0;
    if (t.status === "sold") {
      point.penjualan += t.hargaJual ?? 0;
      point.laba += (t.hargaJual ?? 0) - (t.hargaModal ?? 0);
      point.terjual += 1;
    } else {
      point.belumLaku += 1;
    }
    monthMap.set(key, point);
  }

  const monthly = Array.from(monthMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-12);

  const thMap = new Map<string, ThPoint>();
  for (const t of transactions) {
    const label = accountDistributionLabel(t, distributionMode);
    const point =
      thMap.get(label) ??
      ({ th: label, terjual: 0, belumLaku: 0, modal: 0, penjualan: 0, laba: 0 } satisfies ThPoint);

    point.modal += t.hargaModal ?? 0;
    if (t.status === "sold") {
      point.terjual += 1;
      point.penjualan += t.hargaJual ?? 0;
      point.laba += (t.hargaJual ?? 0) - (t.hargaModal ?? 0);
    } else {
      point.belumLaku += 1;
    }
    thMap.set(label, point);
  }

  const byTh = Array.from(thMap.values()).sort((a, b) => {
    if (distributionMode === "ml") {
      const countDiff = b.terjual + b.belumLaku - (a.terjual + a.belumLaku);
      if (countDiff !== 0) return countDiff;
      return a.th.localeCompare(b.th);
    }
    return accountSortValue(a.th) - accountSortValue(b.th) || a.th.localeCompare(b.th);
  });

  const statusDistribution = [
    { name: "Terjual", key: "sold", value: sold.length },
    { name: "Belum Laku", key: "unsold", value: unsold.length },
  ];

  const rataRataMargin =
    sold.length > 0
      ? sum(sold.map((t) => {
          const modal = t.hargaModal ?? 0;
          if (!modal) return 0;
          return ((t.hargaJual ?? 0) - modal) / modal;
        })) / sold.length
      : 0;

  const recent = [...transactions]
    .sort((a, b) => {
      const aDate = transactionDate(a) ?? "";
      const bDate = transactionDate(b) ?? "";
      return bDate.localeCompare(aDate) || b.row - a.row;
    })
    .slice(0, 6);

  return {
    totalModal,
    totalPenjualan,
    selisihKas,
    labaTerealisasi,
    jumlahTerjual: sold.length,
    jumlahBelumLaku: unsold.length,
    modalTertahan,
    potensiProfit,
    potensiProfitAvailable: true,
    estimasiTerisi,
    estimasiTotal,
    proyeksiTotalLaba,
    proyeksiAvailable: true,
    totalTransaksi: transactions.length,
    rataRataMargin,
    monthly,
    byTh,
    statusDistribution,
    recent,
    generatedAt: new Date().toISOString(),
  };
}

export function sortByTanggalBeliAsc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const aDate = a.tanggalBeli ?? "";
    const bDate = b.tanggalBeli ?? "";
    if (!aDate && !bDate) return a.row - b.row;
    if (!aDate) return 1;
    if (!bDate) return -1;
    return aDate.localeCompare(bDate) || a.row - b.row;
  });
}
