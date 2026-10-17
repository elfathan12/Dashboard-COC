import type { Transaction } from "@/lib/types";
import { formatTanggalID } from "@/lib/date";

export const TRANSACTION_HEADERS = [
  "No Penjualan",
  "TH",
  "Deskripsi",
  "Tanggal Beli",
  "Tanggal Jual",
  "Bulan",
  "Harga Modal",
  "Harga Jual",
  "Estimasi Harga Jual",
  "Keuntungan",
  "Status",
  "ID",
];

export function transactionToRow(transaction: Transaction): (string | number)[] {
  return [
    transaction.noPenjualan || "",
    transaction.th || "",
    transaction.deskripsi || "",
    transaction.tanggalBeli ? formatTanggalID(transaction.tanggalBeli) : "",
    transaction.tanggalJual ? formatTanggalID(transaction.tanggalJual) : "",
    transaction.bulan || "",
    transaction.hargaModal ?? "",
    transaction.hargaJual ?? "",
    transaction.estimasiHargaJual ?? "",
    transaction.status === "sold" ? (transaction.hargaJual ?? 0) - (transaction.hargaModal ?? 0) : "",
    transaction.status === "sold" ? "Terjual" : "Belum Laku",
    transaction.id ?? "",
  ];
}

function escapeCsv(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsv).join(","));
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

export async function exportToXlsx(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  sheetName = "Transaksi",
): Promise<void> {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet["!cols"] = headers.map((header, index) => {
    const longest = Math.max(
      header.length,
      ...rows.map((row) => String(row[index] ?? "").length),
    );
    return { wch: Math.min(Math.max(longest + 2, 12), 50) };
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
