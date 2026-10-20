"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Crown, LoaderCircle, Lock, Mail, ShieldCheck } from "lucide-react";
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
    <main className="kingdom-login">
      <section className="kingdom-hero" aria-labelledby="hero-title">
        <div className="hero-ambient" aria-hidden="true" />
        <div className="hero-particles" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <svg
          aria-hidden="true"
          className="hero-landscape"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#102126" />
              <stop offset=".58" stopColor="#34433a" />
              <stop offset="1" stopColor="#c18b4d" />
            </linearGradient>
            <radialGradient id="sunset" cx="70%" cy="48%" r="52%">
              <stop offset="0" stopColor="#f1c874" stopOpacity=".8" />
              <stop offset=".33" stopColor="#dfa45c" stopOpacity=".25" />
              <stop offset="1" stopColor="#e5ae61" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="keep" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#90734d" />
              <stop offset=".55" stopColor="#554936" />
              <stop offset="1" stopColor="#282d28" />
            </linearGradient>
            <linearGradient id="mountain" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#39453b" />
              <stop offset="1" stopColor="#1b2926" />
            </linearGradient>
            <filter id="soft-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="24" />
            </filter>
          </defs>
          <path fill="url(#sky)" d="M0 0h1000v1000H0z" />
          <path fill="url(#sunset)" d="M0 0h1000v1000H0z" />
          <circle cx="700" cy="465" r="76" fill="#efc778" opacity=".25" filter="url(#soft-glow)" />
          <circle cx="700" cy="465" r="35" fill="#f2cf88" opacity=".74" />
          <path fill="#24332f" opacity=".64" d="m0 520 145-152 103 90 142-194 122 159 116-112 132 134 111-101 129 153v403H0z" />
          <path fill="url(#mountain)" d="m0 608 170-142 128 91 145-144 119 140 132-117 121 133 123-104 162 115v320H0z" />
          <path fill="#66705c" opacity=".24" d="m170 466-43 36 47-16 29 22zm273-53-47 48 54-24 34 30zm251-12-38 42 44-19 29 27zm224 19-37 35 44-16 30 27z" />
          <path fill="#d9bc87" opacity=".24" d="M0 640c173-35 287 34 451 5s309-82 549-12v99H0z" />
          <g opacity=".45" fill="#f1cc82">
            <circle cx="120" cy="586" r="3" /><circle cx="247" cy="550" r="2" /><circle cx="832" cy="567" r="3" />
            <circle cx="916" cy="608" r="2" /><circle cx="530" cy="586" r="2" /><circle cx="391" cy="554" r="2" />
          </g>
          <path fill="#28302a" d="M0 710c128-78 223-71 340-20 108 47 198 43 303-5 141-66 234-62 357 7v308H0z" />
          <path fill="#1d2824" d="M0 782c151-78 257-36 380 5 112 37 213 14 337-38 130-55 195-42 283 4v247H0z" />
          <g stroke="#ae8a52" strokeOpacity=".48" strokeWidth="3" fill="url(#keep)">
            <path d="M536 710h45V574h26v-35l35-32 35 32v35h26v136h48V587h23v-39l34-31 34 31v39h23v123h58v130H536z" />
            <path d="M509 710h477v31H509z" fill="#95764b" />
            <path d="M625 710V611h91v99m56 0V612h91v98" fill="#202824" />
            <path d="M647 710v-64q23-35 46 0v64m102 0v-64q23-35 46 0v64" fill="#e8b96b" stroke="none" opacity=".83" />
            <path d="M599 574h85m107 13h87" fill="none" stroke="#c29a5c" strokeWidth="5" />
            <path d="M651 486v-58h20v58m132 0v-54h20v54" fill="#806746" />
          </g>
          <g fill="#f1c976" opacity=".9">
            <path d="M671 424h-5v-19h5l8-12 8 12h5v19zM804 429h-5v-19h5l8-12 8 12h5v19z" />
            <circle cx="615" cy="641" r="4" /><circle cx="890" cy="646" r="4" />
          </g>
          <path fill="#111b18" d="M0 858c177-65 276-28 399 11 141 45 244 11 374-29 95-30 153-33 227-13v173H0z" />
          <path fill="#101715" d="M0 924c161-30 262 18 398 29 174 15 270-54 411-50 74 2 127 18 191 32v65H0z" />
          <g fill="#0e1715">
            <path d="m70 802 16-80 16 80h-9v35H79v-35zm808-20 18-92 18 92h-10v45h-16v-45zM180 855l14-66 14 66h-8v32h-12v-32z" />
          </g>
        </svg>
        <div className="hero-shade" aria-hidden="true" />

        <div className="hero-brand">
          <div className="hero-brand-mark"><ShieldCheck aria-hidden="true" /></div>
          <span>JB <b>COC</b><small>THE KINGDOM GATEWAY</small></span>
        </div>

        <div className="hero-copy">
          <p className="hero-eyebrow"><span /> YOUR EMPIRE. YOUR LEGACY.</p>
          <h1 id="hero-title">BUILD YOUR<br /><span>EMPIRE.</span></h1>
          <p>Manage your Clash of Clans account business in one powerful dashboard.</p>
          <div className="hero-rule"><span /><span /><span /></div>
        </div>
        <p className="hero-caption"><span /> A KINGDOM BUILT ON STRATEGY</p>
      </section>

      <section className="kingdom-auth" aria-labelledby="login-title">
        <div className="auth-atmosphere" aria-hidden="true" />
        <div className="login-content">
          <header className="auth-header">
            <div className="login-crest">
              <Crown className="size-7" strokeWidth={1.7} aria-hidden="true" />
            </div>
            <p className="auth-eyebrow">THE KINGDOM AWAITS</p>
            <h2 id="login-title">Welcome Back, Chief.</h2>
            <p className="auth-subtitle">Sign in to manage your JB COC empire.</p>
          </header>

          <form onSubmit={handleSubmit} className="login-card">
            <div className="auth-secure">
              <ShieldCheck className="size-4" aria-hidden="true" />
              <span>SECURE ADMIN ACCESS</span>
            </div>

            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="login-label">Email</Label>
              <div className="login-field">
                <Mail className="login-field-icon" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your email"
                  className="login-input pr-3 pl-11"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="login-label">Password</Label>
              <div className="login-field">
                <Lock className="login-field-icon" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="login-input pr-12 pl-11"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="login-password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="login-submit" disabled={loading}>
              {loading ? (
                <><LoaderCircle className="size-4 animate-spin" />Entering the Kingdom...</>
              ) : (
                <><Crown className="size-4" />ENTER THE KINGDOM</>
              )}
            </Button>
          </form>

          <footer className="auth-footer">
            <span />
            JB COC — Account Sales Management System
          </footer>
        </div>
      </section>
    </main>
  );
}
