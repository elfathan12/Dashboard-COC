import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/schemas";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Email dan password wajib diisi" },
      { status: 400 },
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();

  if (!adminEmail || !passwordHash) {
    return NextResponse.json(
      {
        error:
          "Konfigurasi admin belum lengkap. Isi ADMIN_EMAIL dan ADMIN_PASSWORD_HASH pada file .env.local.",
        code: "ADMIN_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const { email, password } = parsed.data;

  if (email.toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  let valid = false;
  try {
    valid = await bcrypt.compare(password, passwordHash);
  } catch {
    valid = false;
  }

  if (!valid) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  const token = createSessionToken({ email: adminEmail });
  const response = NextResponse.json({ email: adminEmail });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
