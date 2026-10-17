import { formatMonthKey, monthKey } from "./date";
import type { DashboardStats, MonthlyPoint, ThPoint, Transaction } from "./types";

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

function normalizeTh(value: string): string {
  const num = Number(String(value).replace(/[^0-9]/g, ""));
  if (Number.isFinite(num) && num > 0) return `TH${num}`;
  return value?.trim() || "Tanpa TH";
}

function thSortValue(th: string): number {
  const num = Number(String(th).replace(/[^0-9]/g, ""));
  return Number.isFinite(num) ? num : 999;
}

export function computeDashboardStats(transactions: Transaction[]): DashboardStats {
  const totalModal = sum(transactions.map((t) => t.hargaModal ?? 0));
  const totalPenjualan = sum(transactions.map((t) => t.hargaJual ?? 0));
  /** Selisih kas = Total Penjualan − Total Modal, mencakup semua akun (termasuk yang belum laku). */
  const selisihKas = totalPenjualan - totalModal;

  const sold = transactions.filter((t) => t.status === "sold");
  const unsold = transactions.filter((t) => t.status === "unsold");

  /** Laba terealisasi = hanya akun yang sudah terjual. */
  const labaTerealisasi = sum(
    sold.map((t) => (t.hargaJual ?? 0) - (t.hargaModal ?? 0)),
  );
  /** Modal tertahan = modal pada seluruh akun yang belum laku. */
  const modalTertahan = sum(unsold.map((t) => t.hargaModal ?? 0));

  /** Potensi profit = SUM(Estimasi Harga Jual Efektif − Harga Modal) hanya untuk transaksi belum laku.
   * Estimasi Efektif: jika Estimasi Harga Jual terisi (kolom J) → pakai manual (bisa < modal).
   * Jika kosong → estimasi default = Harga Modal × 1.20 (markup 20% keuntungan).
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

  /** Proyeksi total laba = Laba Terealisasi + Potensi Profit (dengan estimasi default 20% dari modal). */
  const proyeksiAvailable = true;
  const proyeksiTotalLaba = labaTerealisasi + (potensiProfit ?? 0);

  const monthMap = new Map<string, MonthlyPoint>();
  for (const t of transactions) {
    const key = monthKey(t.tanggalJual) || monthKey(t.tanggalBeli);
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
    const th = normalizeTh(t.th);
    const point =
      thMap.get(th) ?? ({ th, terjual: 0, belumLaku: 0, modal: 0, penjualan: 0, laba: 0 } satisfies ThPoint);

    point.modal += t.hargaModal ?? 0;
    if (t.status === "sold") {
      point.terjual += 1;
      point.penjualan += t.hargaJual ?? 0;
      point.laba += (t.hargaJual ?? 0) - (t.hargaModal ?? 0);
    } else {
      point.belumLaku += 1;
    }
    thMap.set(th, point);
  }

  const byTh = Array.from(thMap.values()).sort((a, b) => thSortValue(a.th) - thSortValue(b.th));

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
      const aDate = a.tanggalBeli ?? a.tanggalJual ?? "";
      const bDate = b.tanggalBeli ?? b.tanggalJual ?? "";
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
