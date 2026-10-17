import { google, type sheets_v4 } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import {
  parseNumber,
} from "./format";
import { bulanIndonesia, parseSheetDate } from "./date";
import type { SheetStructure, Transaction, TransactionInput } from "./types";

const DEFAULT_SHEET_ID = "12vUoE2-WTInp6WLJKGEr0hKA2eS4P-FF";
const DEFAULT_GID = 286858408;

export class SheetsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetsConfigError";
  }
}

function getSpreadsheetId(): string {
  return process.env.GOOGLE_SHEET_ID?.trim() || DEFAULT_SHEET_ID;
}

function getConfiguredGid(): number {
  const raw = process.env.GOOGLE_SHEET_GID?.trim();
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_GID;
}

function getPrivateKey(): string {
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) return "";
  return key.replace(/\\n/g, "\n");
}

export function isSheetsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && getPrivateKey());
}

export function assertSheetsConfigured(): void {
  if (!isSheetsConfigured()) {
    throw new SheetsConfigError(
      "Mode baca publik (read-only) sedang aktif. Untuk menambah, mengubah, atau menghapus data, isi GOOGLE_SERVICE_ACCOUNT_EMAIL dan GOOGLE_PRIVATE_KEY pada file .env.local.",
    );
  }
}

let cachedClient: sheets_v4.Sheets | null = null;

function getClient(): sheets_v4.Sheets {
  assertSheetsConfigured();
  if (cachedClient) return cachedClient;

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: getPrivateKey(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\s._-]+/g, "");
}

const HEADER_ALIASES: Record<string, string[]> = {
  noPenjualan: ["nopenjualan", "no", "nomor", "nopenjualanakun"],
  th: ["th", "townhall", "townhalllevel"],
  deskripsi: ["deskripsi", "keterangan", "akun", "deskripsiakun"],
  tanggalBeli: ["tanggalbeli", "tglbeli", "pembelian", "tanggalpembelian"],
  tanggalJual: ["tanggaljual", "tgljual", "penjualan", "tanggalpenjualan"],
  bulan: ["bulan", "month"],
  hargaModal: ["hargamodal", "modal", "hargabeli", "hargapembelian"],
  hargaJual: ["hargajual", "jual", "hargapenjualan"],
  estimasiHargaJual: [
    "estimasihargajual",
    "estimasijual",
    "estimasipenjualan",
    "estimasi",
    "hargajualestimasi",
    "perkiraanhargajual",
    "targetjual",
    "targetpenjualan",
  ],
  keuntungan: ["keuntungan", "laba", "profit", "selisih"],
  id: ["id", "uuid", "idtransaksi", "transactionid"],
};

function findColumn(headers: string[], key: keyof typeof HEADER_ALIASES): number | null {
  const aliases = HEADER_ALIASES[key];
  for (let i = 0; i < headers.length; i += 1) {
    if (aliases.includes(normalizeHeader(headers[i]))) return i;
  }
  return null;
}

function columnLetter(index: number): string {
  let letters = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function isBlankRow(row: unknown[]): boolean {
  return !row || row.every((cell) => cell === null || cell === undefined || String(cell).trim() === "");
}

function looksLikeSummary(value: unknown): boolean {
  const str = String(value ?? "").toLowerCase();
  return /^(total|jumlah|sub\s?total|grand total|rekap|summary)\b/.test(str.trim());
}

async function resolveSheetTitle(sheets: sheets_v4.Sheets): Promise<{ title: string; gid: number }> {
  const spreadsheetId = getSpreadsheetId();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });

  const configuredGid = getConfiguredGid();
  const allSheets = meta.data.sheets ?? [];

  const byGid = allSheets.find((s) => s.properties?.sheetId === configuredGid);
  const chosen = byGid ?? allSheets[0];
  const title = chosen?.properties?.title;
  const gid = chosen?.properties?.sheetId ?? configuredGid;

  if (!title) {
    throw new Error("Sheet tidak ditemukan pada spreadsheet tersebut.");
  }
  return { title, gid };
}

interface RawSheet {
  sheetTitle: string;
  sheetGid: number;
  values: unknown[][];
}

interface GvizCell {
  v?: unknown;
  f?: string;
}

interface GvizColumn {
  label?: string;
  type?: string;
}

interface GvizResponse {
  status?: string;
  errors?: Array<{ detailed_message?: string; message?: string }>;
  table?: {
    cols?: GvizColumn[];
    rows?: Array<{ c?: Array<GvizCell | null> }>;
  };
}

function parseGvizDate(value: string): string | null {
  const match = value.match(/^Date\((\d+),(\d+),(\d+)/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) + 1;
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseGvizCell(cell: GvizCell | null | undefined, type: string | undefined): unknown {
  if (!cell) return null;
  const raw = cell.v;
  if (raw === null || raw === undefined || raw === "") return null;

  if (type === "date" || type === "datetime") {
    return typeof raw === "string" ? parseGvizDate(raw) : null;
  }
  if (type === "number") {
    const num = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(num) ? num : null;
  }
  return raw;
}

/**
 * Read the sheet without any credentials via the public gviz JSON endpoint.
 * Only works when the spreadsheet is shared publicly ("Anyone with the link").
 */
async function readRawSheetPublic(): Promise<RawSheet> {
  const spreadsheetId = getSpreadsheetId();
  const gid = getConfiguredGid();
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
    spreadsheetId,
  )}/gviz/tq?tqx=out:json&gid=${gid}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new SheetsConfigError(
      "Spreadsheet tidak dapat diakses. Bagikan sheet ke \"Anyone with the link\" atau isi kredensial service account pada .env.local.",
    );
  }

  const text = await res.text();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Format respons spreadsheet tidak dikenali.");
  }

  let parsed: GvizResponse;
  try {
    parsed = JSON.parse(text.slice(start, end + 1)) as GvizResponse;
  } catch {
    throw new Error("Gagal mengurai data spreadsheet.");
  }

  if (parsed.status && parsed.status !== "ok") {
    throw new Error(
      parsed.errors?.[0]?.detailed_message ??
        parsed.errors?.[0]?.message ??
        "Spreadsheet menolak permintaan.",
    );
  }

  const cols = parsed.table?.cols ?? [];
  const headers = cols.map((col) => String(col.label ?? ""));
  const values: unknown[][] = [headers];

  for (const row of parsed.table?.rows ?? []) {
    const cells = row.c ?? [];
    values.push(cols.map((col, index) => parseGvizCell(cells[index], col.type)));
  }

  return { sheetTitle: "Sheet (akses publik)", sheetGid: gid, values };
}

async function readRawSheet(): Promise<RawSheet> {
  if (isSheetsConfigured()) {
    try {
      const sheets = getClient();
      const { title, gid } = await resolveSheetTitle(sheets);
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: getSpreadsheetId(),
        range: `'${title}'!A1:ZZ5000`,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });
      const values = (res.data.values ?? []) as unknown[][];
      return { sheetTitle: title, sheetGid: gid, values };
    } catch (error) {
      // Kredensial ada tetapi gagal (mis. private key tidak valid).
      // Untuk operasi baca, coba fallback ke endpoint publik sebelum menyerah.
      try {
        return await readRawSheetPublic();
      } catch {
        throw error;
      }
    }
  }

  return readRawSheetPublic();
}

function buildStructure(raw: RawSheet): SheetStructure {
  const { values, sheetTitle, sheetGid } = raw;

  let headerRow = 1;
  let headers: string[] = [];

  const limit = Math.min(values.length, 15);
  for (let i = 0; i < limit; i += 1) {
    const row = values[i] ?? [];
    const normalized = row.map(normalizeHeader);
    if (
      normalized.includes("nopenjualan") ||
      (normalized.includes("hargamodal") && normalized.includes("hargajual")) ||
      normalized.includes("th")
    ) {
      headerRow = i + 1;
      headers = row.map((cell) => String(cell ?? ""));
      break;
    }
  }

  if (!headers.length) {
    headers = (values[0] ?? []).map((cell) => String(cell ?? ""));
    headerRow = 1;
  }

  let lastColumnIndex = 0;
  let lastRowIndex = 0;
  values.forEach((row, idx) => {
    if (!row) return;
    row.forEach((cell, cIdx) => {
      if (cell !== null && cell !== undefined && String(cell).trim() !== "") {
        if (cIdx > lastColumnIndex) lastColumnIndex = cIdx;
        if (idx + 1 > lastRowIndex) lastRowIndex = idx + 1;
      }
    });
  });

  if (values.length && lastRowIndex === 0) {
    lastRowIndex = headerRow;
  }

  const columns = {
    noPenjualan: findColumn(headers, "noPenjualan"),
    th: findColumn(headers, "th"),
    deskripsi: findColumn(headers, "deskripsi"),
    tanggalBeli: findColumn(headers, "tanggalBeli"),
    tanggalJual: findColumn(headers, "tanggalJual"),
    bulan: findColumn(headers, "bulan"),
    hargaModal: findColumn(headers, "hargaModal"),
    hargaJual: findColumn(headers, "hargaJual"),
    keuntungan: findColumn(headers, "keuntungan"),
    estimasiHargaJual: findColumn(headers, "estimasiHargaJual"),
    id: findColumn(headers, "id"),
  };

  // Kolom tambahan (ID & Estimasi Harga Jual) selalu ditambahkan di sisi paling
  // kanan sheet agar tidak menggeser kolom data lama maupun ringkasan (K/L).
  let cursor = lastColumnIndex;
  let idColumnIndex = columns.id;
  let estimasiColumnIndex = columns.estimasiHargaJual;
  if (idColumnIndex === null) {
    cursor += 1;
    idColumnIndex = cursor;
  }
  if (estimasiColumnIndex === null) {
    cursor += 1;
    estimasiColumnIndex = cursor;
  }

  return {
    spreadsheetId: getSpreadsheetId(),
    sheetTitle,
    sheetGid,
    headerRow,
    headers,
    columns,
    idColumnIndex,
    estimasiColumnIndex,
    lastColumnIndex,
    lastRowIndex,
    totalRows: Math.max(0, lastRowIndex - headerRow),
  };
}

export async function getSheetStructure(): Promise<SheetStructure> {
  const raw = await readRawSheet();
  return buildStructure(raw);
}

function getCell(row: unknown[], index: number | null): unknown {
  if (index === null || index === undefined) return null;
  return row?.[index] ?? null;
}

function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function mapRowToTransaction(row: unknown[], rowNumber: number, structure: SheetStructure): Transaction {
  const { columns } = structure;
  const hargaModal = parseNumber(getCell(row, columns.hargaModal));
  let hargaJual = parseNumber(getCell(row, columns.hargaJual));
  const estimasiHargaJual = parseNumber(getCell(row, columns.estimasiHargaJual));
  const tanggalJualRaw = parseSheetDate(getCell(row, columns.tanggalJual));

  if (hargaJual === null && tanggalJualRaw && !cleanText(getCell(row, columns.tanggalJual))) {
    hargaJual = null;
  }

  const keuntunganRaw = parseNumber(getCell(row, columns.keuntungan));
  const keuntungan =
    keuntunganRaw !== null
      ? keuntunganRaw
      : hargaJual !== null && hargaModal !== null
        ? hargaJual - hargaModal
        : null;

  const status: Transaction["status"] = hargaJual !== null ? "sold" : "unsold";

  return {
    row: rowNumber,
    id: cleanText(getCell(row, columns.id)) || null,
    noPenjualan: cleanText(getCell(row, columns.noPenjualan)),
    th: cleanText(getCell(row, columns.th)),
    deskripsi: cleanText(getCell(row, columns.deskripsi)),
    tanggalBeli: parseSheetDate(getCell(row, columns.tanggalBeli)),
    tanggalJual: tanggalJualRaw,
    bulan: cleanText(getCell(row, columns.bulan)),
    hargaModal,
    hargaJual,
    estimasiHargaJual,
    keuntungan,
    status,
  };
}

export async function getTransactions(): Promise<{ transactions: Transaction[]; structure: SheetStructure }> {
  const raw = await readRawSheet();
  const structure = buildStructure(raw);
  const transactions: Transaction[] = [];

  for (let i = structure.headerRow; i < raw.values.length; i += 1) {
    const row = raw.values[i] ?? [];
    if (isBlankRow(row)) continue;

    const noPenjualanCell = getCell(row, structure.columns.noPenjualan);
    if (looksLikeSummary(noPenjualanCell)) continue;

    const hasData =
      cleanText(getCell(row, structure.columns.deskripsi)) ||
      cleanText(getCell(row, structure.columns.th)) ||
      getCell(row, structure.columns.hargaModal) !== null ||
      getCell(row, structure.columns.hargaJual) !== null ||
      getCell(row, structure.columns.tanggalBeli) !== null;

    if (!hasData) continue;

    transactions.push(mapRowToTransaction(row, i + 1, structure));
  }

  return { transactions, structure };
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const { transactions } = await getTransactions();
  return transactions.find((t) => t.id === id) ?? null;
}

export async function getTransactionByRow(row: number): Promise<Transaction | null> {
  const { transactions } = await getTransactions();
  return transactions.find((t) => t.row === row) ?? null;
}

function nextNoPenjualan(transactions: Transaction[]): string {
  let max = 0;
  for (const t of transactions) {
    const num = Number(String(t.noPenjualan).replace(/[^0-9]/g, ""));
    if (Number.isFinite(num) && num > max) max = num;
  }
  return String(max + 1);
}

interface CellUpdate {
  columnIndex: number;
  value: string | number | null;
}

async function writeCells(updates: Array<{ row: number; cells: CellUpdate[] }>, structure: SheetStructure): Promise<void> {
  const sheets = getClient();
  const data: sheets_v4.Schema$ValueRange[] = [];

  for (const update of updates) {
    for (const cell of update.cells) {
      const letter = columnLetter(cell.columnIndex);
      data.push({
        range: `'${structure.sheetTitle}'!${letter}${update.row}`,
        values: [[cell.value ?? ""]],
      });
    }
  }

  if (!data.length) return;

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: structure.spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data,
    },
  });
}

/**
 * Migrasi aman kolom tambahan: hanya menambahkan header "ID Transaksi" dan
 * "Estimasi Harga Jual" di sisi paling kanan sheet bila belum ada. Tidak
 * menyentuh kolom data lama, tidak menghapus isi apa pun, dan tidak menggeser
 * ringkasan yang sudah ada (formula & kolom Ringkasan/Jumlah tetap utuh).
 */
async function ensureExtraHeaders(structure: SheetStructure): Promise<SheetStructure> {
  let ready = structure;
  const data: sheets_v4.Schema$ValueRange[] = [];

  if (ready.columns.id === null) {
    data.push({
      range: `'${ready.sheetTitle}'!${columnLetter(ready.idColumnIndex)}${ready.headerRow}`,
      values: [["ID Transaksi"]],
    });
    ready = {
      ...ready,
      headers: [...ready.headers, "ID Transaksi"],
      columns: { ...ready.columns, id: ready.idColumnIndex },
    };
  }

  if (ready.columns.estimasiHargaJual === null) {
    data.push({
      range: `'${ready.sheetTitle}'!${columnLetter(ready.estimasiColumnIndex)}${ready.headerRow}`,
      values: [["Estimasi Harga Jual"]],
    });
    ready = {
      ...ready,
      headers: [...ready.headers, "Estimasi Harga Jual"],
      columns: { ...ready.columns, estimasiHargaJual: ready.estimasiColumnIndex },
    };
  }

  if (data.length) {
    await getClient().spreadsheets.values.batchUpdate({
      spreadsheetId: ready.spreadsheetId,
      requestBody: { valueInputOption: "USER_ENTERED", data },
    });
  }

  return ready;
}

function buildRowCells(structure: SheetStructure, values: Record<string, string | number | null>, id: string): CellUpdate[] {
  const cells: CellUpdate[] = [];
  const map: Array<[number | null, string | number | null]> = [
    [structure.columns.noPenjualan, values.noPenjualan ?? null],
    [structure.columns.th, values.th ?? null],
    [structure.columns.deskripsi, values.deskripsi ?? null],
    [structure.columns.tanggalBeli, values.tanggalBeli ?? null],
    [structure.columns.tanggalJual, values.tanggalJual ?? null],
    [structure.columns.bulan, values.bulan ?? null],
    [structure.columns.hargaModal, values.hargaModal ?? null],
    [structure.columns.hargaJual, values.hargaJual ?? null],
    [structure.estimasiColumnIndex, values.estimasiHargaJual ?? null],
    [structure.columns.keuntungan, values.keuntungan ?? null],
    [structure.idColumnIndex, id],
  ];

  const seen = new Set<number>();
  for (const [columnIndex, value] of map) {
    if (columnIndex === null || columnIndex === undefined) continue;
    if (seen.has(columnIndex)) continue;
    seen.add(columnIndex);
    cells.push({ columnIndex, value });
  }
  return cells;
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const { transactions, structure } = await getTransactions();
  const readyStructure = await ensureExtraHeaders(structure);

  const row = readyStructure.lastRowIndex + 1;
  const id = uuidv4();
  const noPenjualan = nextNoPenjualan(transactions);
  const keuntungan =
    input.hargaJual !== null && input.hargaModal !== null ? input.hargaJual - input.hargaModal : null;

  const cells = buildRowCells(readyStructure, {
    noPenjualan,
    th: input.th,
    deskripsi: input.deskripsi,
    tanggalBeli: input.tanggalBeli,
    tanggalJual: input.tanggalJual,
    bulan: bulanIndonesia(input.tanggalBeli ?? input.tanggalJual),
    hargaModal: input.hargaModal,
    hargaJual: input.hargaJual,
    estimasiHargaJual: input.estimasiHargaJual,
    keuntungan,
  }, id);

  await writeCells([{ row, cells }], readyStructure);

  return {
    row,
    id,
    noPenjualan,
    th: input.th,
    deskripsi: input.deskripsi,
    tanggalBeli: input.tanggalBeli,
    tanggalJual: input.tanggalJual,
    bulan: bulanIndonesia(input.tanggalBeli ?? input.tanggalJual),
    hargaModal: input.hargaModal,
    hargaJual: input.hargaJual,
    estimasiHargaJual: input.estimasiHargaJual,
    keuntungan,
    status: input.hargaJual !== null ? "sold" : "unsold",
  };
}

export async function updateTransaction(
  row: number,
  input: TransactionInput,
  existingId: string | null,
): Promise<Transaction> {
  const { transactions, structure } = await getTransactions();
  const target = transactions.find((t) => t.row === row);
  if (!target) {
    throw new Error(`Transaksi pada baris ${row} tidak ditemukan.`);
  }

  const readyStructure = await ensureExtraHeaders(structure);
  const id = existingId ?? target.id ?? uuidv4();
  const keuntungan =
    input.hargaJual !== null && input.hargaModal !== null ? input.hargaJual - input.hargaModal : null;

  const cells = buildRowCells(readyStructure, {
    noPenjualan: target.noPenjualan,
    th: input.th,
    deskripsi: input.deskripsi,
    tanggalBeli: input.tanggalBeli,
    tanggalJual: input.tanggalJual,
    bulan: bulanIndonesia(input.tanggalBeli ?? input.tanggalJual),
    hargaModal: input.hargaModal,
    hargaJual: input.hargaJual,
    estimasiHargaJual: input.estimasiHargaJual,
    keuntungan,
  }, id);

  await writeCells([{ row, cells }], readyStructure);

  return {
    ...target,
    id,
    th: input.th,
    deskripsi: input.deskripsi,
    tanggalBeli: input.tanggalBeli,
    tanggalJual: input.tanggalJual,
    bulan: bulanIndonesia(input.tanggalBeli ?? input.tanggalJual),
    hargaModal: input.hargaModal,
    hargaJual: input.hargaJual,
    estimasiHargaJual: input.estimasiHargaJual,
    keuntungan,
    status: input.hargaJual !== null ? "sold" : "unsold",
  };
}

export async function markAsSold(
  row: number,
  tanggalJual: string,
  hargaJual: number,
  existingId: string | null,
): Promise<Transaction> {
  const { transactions, structure } = await getTransactions();
  const target = transactions.find((t) => t.row === row);
  if (!target) {
    throw new Error(`Transaksi pada baris ${row} tidak ditemukan.`);
  }

  const readyStructure = await ensureExtraHeaders(structure);
  const id = existingId ?? target.id ?? uuidv4();
  const keuntungan = target.hargaModal !== null ? hargaJual - target.hargaModal : null;

  const cells: CellUpdate[] = [
    { columnIndex: readyStructure.idColumnIndex, value: id },
  ];
  if (readyStructure.columns.tanggalJual !== null) {
    cells.push({ columnIndex: readyStructure.columns.tanggalJual, value: tanggalJual });
  }
  if (readyStructure.columns.hargaJual !== null) {
    cells.push({ columnIndex: readyStructure.columns.hargaJual, value: hargaJual });
  }
  if (readyStructure.columns.keuntungan !== null) {
    cells.push({ columnIndex: readyStructure.columns.keuntungan, value: keuntungan });
  }
  if (readyStructure.columns.bulan !== null) {
    cells.push({
      columnIndex: readyStructure.columns.bulan,
      value: bulanIndonesia(tanggalJual) || target.bulan,
    });
  }

  await writeCells([{ row, cells }], readyStructure);

  return {
    ...target,
    id,
    tanggalJual,
    hargaJual,
    keuntungan,
    bulan: bulanIndonesia(tanggalJual) || target.bulan,
    status: "sold",
  };
}

export async function deleteTransaction(row: number): Promise<void> {
  const structure = await getSheetStructure();
  const sheets = getClient();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: structure.spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: structure.sheetGid,
              dimension: "ROWS",
              startIndex: row - 1,
              endIndex: row,
            },
          },
        },
      ],
    },
  });
}

export interface SheetConnectionInfo {
  configured: boolean;
  readOnly: boolean;
  mode: "service-account" | "public" | "none";
  spreadsheetId: string;
  spreadsheetTitle: string | null;
  sheetTitle: string | null;
  sheetGid: number | null;
  headerRow: number | null;
  totalRows: number | null;
  headers: string[];
  serviceAccountEmail: string | null;
  warning?: string;
  error?: string;
}

export async function testConnection(): Promise<SheetConnectionInfo> {
  const configured = isSheetsConfigured();
  const base: SheetConnectionInfo = {
    configured,
    readOnly: !configured,
    mode: configured ? "service-account" : "public",
    spreadsheetId: getSpreadsheetId(),
    spreadsheetTitle: null,
    sheetTitle: null,
    sheetGid: null,
    headerRow: null,
    totalRows: null,
    headers: [],
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null,
  };

  let serviceOk = false;
  let spreadsheetTitle: string | null = null;
  let serviceError: string | null = null;

  if (configured) {
    try {
      const meta = await getClient().spreadsheets.get({
        spreadsheetId: base.spreadsheetId,
        fields: "properties.title",
      });
      spreadsheetTitle = meta.data.properties?.title ?? null;
      serviceOk = true;
    } catch (error) {
      serviceError =
        error instanceof Error ? error.message : "Kredensial service account tidak valid.";
    }
  }

  try {
    const raw = await readRawSheet();
    const structure = buildStructure(raw);
    const mode: SheetConnectionInfo["mode"] = serviceOk ? "service-account" : "public";

    return {
      ...base,
      readOnly: mode !== "service-account",
      mode,
      spreadsheetTitle,
      sheetTitle: structure.sheetTitle,
      sheetGid: structure.sheetGid,
      headerRow: structure.headerRow,
      totalRows: structure.totalRows,
      headers: structure.headers.filter((h) => h && h.trim() !== ""),
      ...(serviceError
        ? {
            warning:
              "Kredensial service account tidak dapat dipakai (kemungkinan GOOGLE_PRIVATE_KEY tidak valid). Data sementara ditampilkan read-only dari akses publik — perbaiki kunci untuk mengaktifkan baca-tulis.",
          }
        : {}),
    };
  } catch (error) {
    return {
      ...base,
      mode: "none",
      ...(serviceError ? { warning: serviceError } : {}),
      error: error instanceof Error ? error.message : "Gagal terhubung ke Google Sheets.",
    };
  }
}

/**
 * Backfill UUIDs for legacy rows that don't have an ID yet.
 * Also provisions missing "ID Transaksi" / "Estimasi Harga Jual" header columns.
 */
export async function migrateTransactionIds(): Promise<{ migrated: number; total: number }> {
  const { transactions, structure } = await getTransactions();
  const readyStructure = await ensureExtraHeaders(structure);

  const updates = transactions
    .filter((t) => !t.id)
    .map((t) => ({
      row: t.row,
      cells: [{ columnIndex: readyStructure.idColumnIndex, value: uuidv4() }],
    }));

  await writeCells(updates, readyStructure);

  return { migrated: updates.length, total: transactions.length };
}
