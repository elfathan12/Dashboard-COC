import { z } from "zod";

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
  .nullable()
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : null));

const optionalMoney = z
  .union([z.number(), z.string(), z.null()])
  .transform((value) => {
    if (value === null || value === "") return null;
    const num = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(num) ? num : null;
  });

export const transactionInputSchema = z
  .object({
    th: z
      .string()
      .trim()
      .min(1, "Town Hall wajib dipilih")
      .refine((value) => {
        const num = Number(String(value).replace(/\D/g, ""));
        return num >= 1 && num <= 18;
      }, "Town Hall harus antara 1 sampai 18"),
    deskripsi: z.string().trim().min(1, "Deskripsi akun wajib diisi").max(500),
    tanggalBeli: optionalDate,
    tanggalJual: optionalDate,
    hargaModal: optionalMoney.refine(
      (value) => value === null || value >= 0,
      "Harga modal tidak boleh negatif",
    ),
    hargaJual: optionalMoney.refine(
      (value) => value === null || value >= 0,
      "Harga jual tidak boleh negatif",
    ),
    estimasiHargaJual: optionalMoney.refine(
      (value) => value === null || value >= 0,
      "Estimasi harga jual tidak boleh negatif",
    ),
  })
  .refine((data) => data.hargaModal !== null, {
    message: "Harga modal wajib diisi",
    path: ["hargaModal"],
  })
  .refine(
    (data) => {
      if (data.tanggalJual && data.tanggalBeli) {
        return data.tanggalJual >= data.tanggalBeli;
      }
      return true;
    },
    { message: "Tanggal jual tidak boleh lebih awal dari tanggal beli", path: ["tanggalJual"] },
  );

export type TransactionFormValues = z.input<typeof transactionInputSchema>;
export type TransactionParsed = z.output<typeof transactionInputSchema>;

export const sellInputSchema = z.object({
  tanggalJual: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal jual wajib diisi"),
  hargaJual: z
    .union([z.number(), z.string()])
    .transform((value) => {
      const num = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
      return Number.isFinite(num) ? num : NaN;
    })
    .refine((value) => Number.isFinite(value) && value >= 0, "Harga jual wajib diisi"),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});
