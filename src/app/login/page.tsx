"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Crown, LoaderCircle, Lock, Mail, ShieldCheck, Swords } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiFetch, ApiRequestError } from "@/lib/client-api";
import { loginSchema } from "@/lib/schemas";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Data login tidak valid");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      toast.success("Login berhasil", { description: "Selamat datang kembali!" });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiRequestError
          ? err.message
          : "Tidak dapat terhubung ke server. Coba lagi.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <main className="kingdom-login relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="kingdom-aurora" aria-hidden="true" />
      <div className="kingdom-stars" aria-hidden="true" />
      <svg
        aria-hidden="true"
        className="kingdom-landscape pointer-events-none absolute inset-x-0 bottom-0 h-[43vh] min-h-64 w-full"
        viewBox="0 0 1440 420"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="kingdom-hill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#263b32" />
            <stop offset="1" stopColor="#101b1a" />
          </linearGradient>
          <linearGradient id="kingdom-stone" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#705637" />
            <stop offset="1" stopColor="#30281f" />
          </linearGradient>
        </defs>
        <path d="M0 280 190 198l135 62 185-130 162 103 183-100 174 95 153-68 258 110v150H0Z" fill="#172622" />
        <path d="M0 326 220 245l210 75 180-126 194 118 200-97 177 91 259-53v167H0Z" fill="url(#kingdom-hill)" />
        <path d="M0 355c220-70 359-14 532-23 207-11 326-79 505-24 162 50 265 29 403-5v117H0Z" fill="#0d1716" />
        <g fill="url(#kingdom-stone)" stroke="#b99050" strokeOpacity=".25" strokeWidth="2">
          <path d="M612 258h42v-65h14v-24h26v24h14v65h16v-94h12v-30h30v30h12v94h19v-70h13v-25h28v25h13v70h17v-52h12v-24h25v24h12v52h42v82H612Z" />
          <path d="M607 258h317v24H607z" fill="#8c6c40" />
        </g>
        <g fill="#e7b85b" opacity=".85">
          <path d="M675 220h9v16h-9zM741 191h9v16h-9zM824 220h9v16h-9zM883 239h9v16h-9z" />
        </g>
        <path d="M0 382h1440v38H0z" fill="#0a1110" opacity=".82" />
      </svg>

      <section className="login-content relative z-10 w-full max-w-[450px]">
        <header className="mb-8 text-center">
          <div className="login-crest mx-auto mb-5 flex size-[72px] items-center justify-center rounded-[22px]">
            <Crown className="size-8 text-[#f7d783]" strokeWidth={1.7} aria-hidden="true" />
          </div>
          <p className="mb-2 text-[10px] font-semibold tracking-[0.34em] text-[#d1ac64] uppercase">
            The Kingdom Awaits
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-[0.08em] text-[#fff8e8] sm:text-4xl">
            WELCOME TO <span className="text-[#e4bc68]">JB COC</span>
          </h1>
          <p className="mt-3 text-sm tracking-wide text-[#c3c0b4]">
            Manage Your Clash of Clans Empire.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="login-card relative space-y-5 rounded-2xl p-6 sm:p-8">
          <div className="login-card-rune" aria-hidden="true"><Swords className="size-5" /></div>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-[#d3bc85] uppercase">
            <ShieldCheck className="size-4 text-emerald-400" aria-hidden="true" />
            Secure Admin Access
          </div>

          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#e8dfca]">Email</Label>
            <div className="login-field relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#b99b61]" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="Admin email"
                className="h-12 border-0 bg-transparent pr-3 pl-11 text-sm text-[#fff9ec] placeholder:text-[#a59b88] focus-visible:ring-2 focus-visible:ring-[#c9a450]/55"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#e8dfca]">Password</Label>
            <div className="login-field relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#b99b61]" aria-hidden="true" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-12 border-0 bg-transparent pr-12 pl-11 text-sm text-[#fff9ec] placeholder:text-[#a59b88] focus-visible:ring-2 focus-visible:ring-[#c9a450]/55"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#c7b991] transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4bc68]"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="login-submit mt-2 h-12 w-full text-sm font-bold tracking-[0.08em] text-[#261b0b] uppercase"
            disabled={loading}
          >
            {loading ? (
              <><LoaderCircle className="size-4 animate-spin" />Entering the Kingdom...</>
            ) : (
              <><Crown className="size-4" />Enter The Kingdom</>
            )}
          </Button>
        </form>

        <p className="mt-7 text-center text-[10px] font-medium tracking-[0.16em] text-[#b5ad99] uppercase">
          JB COC — Account Sales Management System
        </p>
      </section>
    </main>
  );
}
