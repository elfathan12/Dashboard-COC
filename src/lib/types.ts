export type TransactionStatus = "sold" | "unsold";

export interface Transaction {
  /** 1-based row number in the spreadsheet. Used for updates/deletes. */
  row: number;
  /** Permanent UUID identity (may be null for legacy rows that have not been migrated). */
  id: string | null;
  noPenjualan: string;
  th: string;
  deskripsi: string;
  /** ISO date (yyyy-MM-dd) or null */
  tanggalBeli: string | null;
  /** ISO date (yyyy-MM-dd) or null */
  tanggalJual: string | null;
  bulan: string;
  hargaModal: number | null;
  hargaJual: number | null;
  /** Perkiraan harga jual untuk akun yang belum laku (opsional). */
  estimasiHargaJual: number | null;
  keuntungan: number | null;
  status: TransactionStatus;
}

export interface TransactionInput {
  th: string;
  deskripsi: string;
  tanggalBeli: string | null;
  tanggalJual: string | null;
  hargaModal: number | null;
  hargaJual: number | null;
  estimasiHargaJual: number | null;
}

export interface MonthlyPoint {
  key: string;
  label: string;
  penjualan: number;
  modal: number;
  laba: number;
  terjual: number;
  belumLaku: number;
}

export interface ThPoint {
  th: string;
  terjual: number;
  belumLaku: number;
  modal: number;
  penjualan: number;
  laba: number;
}

export interface DashboardStats {
  totalModal: number;
  totalPenjualan: number;
  /** Total Penjualan - Total Modal (arus kas dari seluruh akun, termasuk yang belum laku). */
  selisihKas: number;
  /** Laba bersih hanya dari akun yang sudah terjual. */
  labaTerealisasi: number;
  jumlahTerjual: number;
  jumlahBelumLaku: number;
  modalTertahan: number;
  /** Sum (Estimasi Harga Jual - Harga Modal) akun belum laku yang punya estimasi, atau null jika belum ada estimasi. */
  potensiProfit: number | null;
  potensiProfitAvailable: boolean;
  /** Jumlah akun belum laku yang sudah diisi estimasi harga jual. */
  estimasiTerisi: number;
  /** Jumlah akun belum laku (denominator cakupan estimasi). */
  estimasiTotal: number;
  /** Laba Terealisasi + Potensi Profit, atau null jika estimasi belum memadai. */
  proyeksiTotalLaba: number | null;
  proyeksiAvailable: boolean;
  totalTransaksi: number;
  rataRataMargin: number;
  monthly: MonthlyPoint[];
  byTh: ThPoint[];
  statusDistribution: { name: string; key: string; value: number }[];
  recent: Transaction[];
  generatedAt: string;
}

export interface SheetStructure {
  spreadsheetId: string;
  sheetTitle: string;
  sheetGid: number;
  headerRow: number;
  headers: string[];
  columns: {
    noPenjualan: number | null;
    th: number | null;
    deskripsi: number | null;
    tanggalBeli: number | null;
    tanggalJual: number | null;
    bulan: number | null;
    hargaModal: number | null;
    hargaJual: number | null;
    keuntungan: number | null;
    estimasiHargaJual: number | null;
    id: number | null;
  };
  idColumnIndex: number;
  estimasiColumnIndex: number;
  lastColumnIndex: number;
  lastRowIndex: number;
  totalRows: number;
}

export interface ApiError {
  error: string;
  detail?: string;
}
