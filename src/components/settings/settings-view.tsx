"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  Database,
  ExternalLink,
  Gamepad2,
  Hash,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Server,
  ShieldCheck,
  TriangleAlert,
  Users,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { useApiData } from "@/hooks/use-api-data";
import { useSession } from "@/hooks/use-session";
import { apiFetch, ApiRequestError } from "@/lib/client-api";
import { formatNumber } from "@/lib/format";

interface ConnectionInfo {
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

export function SettingsView() {
  const { data, loading, error, reload } = useApiData<ConnectionInfo>("/api/sheets/test");
  const { session } = useSession();
  const router = useRouter();
  const [migrating, setMigrating] = useState(false);

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const result = await apiFetch<{ migrated: number; total: number }>("/api/sheets/test", {
        method: "POST",
      });
      toast.success("Sinkronisasi ID selesai", {
        description: `${result.migrated} dari ${result.total} transaksi diberi ID baru`,
      });
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Gagal menyinkronkan ID");
    } finally {
      setMigrating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Gagal keluar");
    }
  };

  const mode = data?.mode;
  const connected = Boolean(data) && !data?.error;
  const canWrite = mode === "service-account";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Pantau koneksi Google Sheets, kelola akun admin, dan perawatan data."
      />

      <Tabs defaultValue="connection" className="gap-6">
        <TabsList variant="line">
          <TabsTrigger value="connection">
            <Database className="size-4" />
            Koneksi
          </TabsTrigger>
          <TabsTrigger value="account">
            <Users className="size-4" />
            Akun
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Server className="size-4" />
            Perawatan Data
          </TabsTrigger>
          <TabsTrigger value="about">
            <Gamepad2 className="size-4" />
            Tentang
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-4 outline-none">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Status Koneksi Google Sheets
                    {loading ? (
                      <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                    ) : connected && mode === "service-account" ? (
                      <Badge className="border-transparent bg-emerald-500/15 text-emerald-400">
                        <CircleCheck className="size-3" />
                        Terhubung (Baca &amp; Tulis)
                      </Badge>
                    ) : connected && mode === "public" ? (
                      <Badge className="border-transparent bg-cyan-500/15 text-cyan-400">
                        <ShieldCheck className="size-3" />
                        Baca Publik (Read-only)
                      </Badge>
                    ) : (
                      <Badge className="border-transparent bg-rose-500/15 text-rose-400">
                        <TriangleAlert className="size-3" />
                        Belum Tersambung
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {mode === "public"
                      ? "Data dibaca langsung dari spreadsheet publik. Tambah, ubah, dan hapus memerlukan kredensial service account."
                      : "Data aplikasi dibaca dan ditulis langsung ke spreadsheet Anda."}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
                  <RefreshCw className="size-4" />
                  Tes Ulang
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <TriangleAlert />
                  <AlertTitle>Tidak dapat mengakses API</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : data?.error ? (
                <Alert variant="destructive">
                  <KeyRound />
                  <AlertTitle>Koneksi Google Sheets gagal</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{data.error}</p>
                    <p className="text-xs">
                      Bagikan spreadsheet ke <span className="text-foreground">“Anyone with the link”</span>{" "}
                      agar bisa dibaca, atau isi{" "}
                      <code className="text-foreground">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> dan{" "}
                      <code className="text-foreground">GOOGLE_PRIVATE_KEY</code> pada{" "}
                      <code className="text-foreground">.env.local</code> untuk akses baca-tulis.
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {data?.warning && (
                    <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-200">
                      <TriangleAlert />
                      <AlertTitle>Perhatian</AlertTitle>
                      <AlertDescription className="text-amber-200/80">
                        {data.warning}
                      </AlertDescription>
                    </Alert>
                  )}
                  {mode === "public" && (
                    <Alert className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                      <KeyRound />
                      <AlertTitle>Mode baca publik aktif</AlertTitle>
                      <AlertDescription className="text-cyan-200/80">
                        Dashboard, statistik, dan laporan dapat menampilkan data. Untuk menambah,
                        mengubah, atau menghapus data, isi kredensial service account pada{" "}
                        <code className="text-foreground">.env.local</code> lalu jalankan ulang server.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-px overflow-hidden rounded-xl border border-white/5 bg-white/5 sm:grid-cols-2">
                    <InfoCell label="Spreadsheet" value={data?.spreadsheetTitle ?? "-"} />
                    <InfoCell label="Nama Sheet" value={data?.sheetTitle ?? "-"} />
                    <InfoCell label="Spreadsheet ID" value={data?.spreadsheetId ?? "-"} mono />
                    <InfoCell label="Sheet GID" value={data?.sheetGid?.toString() ?? "-"} mono />
                    <InfoCell
                      label="Jumlah Data"
                      value={data?.totalRows !== null && data?.totalRows !== undefined ? `${formatNumber(data.totalRows)} baris` : "-"}
                    />
                    <InfoCell label="Service Account" value={data?.serviceAccountEmail || "-"} mono />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {data?.headers && data.headers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Struktur Kolom Terdeteksi</CardTitle>
                <CardDescription>
                  Kolom berikut dibaca dari baris header spreadsheet Anda.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {data.headers.map((header, index) => (
                  <Badge key={`${header}-${index}`} variant="outline" className="font-normal">
                    {header}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="account" className="space-y-4 outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Akun Admin</CardTitle>
              <CardDescription>Sesi login yang sedang aktif pada perangkat ini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Administrator</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session?.email ?? "Tidak ada sesi aktif"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="ml-auto text-destructive hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  Keluar
                </Button>
              </div>
              <Alert>
                <KeyRound />
                <AlertTitle>Keamanan kredensial</AlertTitle>
                <AlertDescription>
                  Email dan password admin diatur melalui file{" "}
                  <code className="text-foreground">.env.local</code> (
                  <code className="text-foreground">ADMIN_EMAIL</code> &amp;{" "}
                  <code className="text-foreground">ADMIN_PASSWORD_HASH</code>). Ubah password dengan
                  membuat hash bcrypt baru, lalu ganti nilainya dan restart server.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4 outline-none">
          <Card>
            <CardHeader>
              <CardTitle>Sinkronisasi ID Transaksi</CardTitle>
              <CardDescription>
                Beri ID unik (UUID) pada transaksi lama yang belum memiliki ID. Berguna jika
                spreadsheet sudah berisi data sebelum aplikasi ini digunakan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <Hash className="mt-0.5 size-5 text-violet-400" />
                <div className="text-xs text-muted-foreground">
                  Proses ini hanya menambahkan ID pada baris yang masih kosong dan tidak mengubah
                data transaksi lainnya. Kolom <span className="text-foreground">ID Transaksi</span>{" "}
                dan <span className="text-foreground">Estimasi Harga Jual</span> akan dibuat
                otomatis bila belum ada (tanpa menggeser ringkasan yang sudah ada).
                </div>
              </div>
              <Button onClick={handleMigrate} disabled={migrating || !canWrite}>
                {migrating ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Menyinkronkan...
                  </>
                ) : (
                  <>
                    <Hash className="size-4" />
                    Sinkronkan ID Sekarang
                  </>
                )}
              </Button>
              {!canWrite && (
                <p className="text-xs text-amber-400">
                  {mode === "public"
                    ? "Mode baca publik bersifat read-only. Isi kredensial service account untuk menulis ke spreadsheet."
                    : "Koneksi Google Sheets belum siap. Lengkapi kredensial terlebih dahulu."}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4 outline-none">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="size-4 text-violet-400" />
                JB COC — Sales Management Dashboard
              </CardTitle>
              <CardDescription>
                Aplikasi manajemen penjualan akun Clash of Clans berbasis Google Sheets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <AboutRow label="Versi Aplikasi" value="1.0.0" />
              <Separator className="opacity-50" />
              <AboutRow label="Penyimpanan Data" value="Google Sheets API v4" />
              <Separator className="opacity-50" />
              <AboutRow label="Framework" value="Next.js 16 · React 19 · Tailwind v4" />
              <Separator className="opacity-50" />
              <AboutRow label="Autentikasi" value="Cookie httpOnly + HMAC-SHA256" />
              <div className="pt-2">
                <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
                  <ExternalLink className="size-4" />
                  Kembali ke Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
