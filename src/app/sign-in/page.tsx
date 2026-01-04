"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { signIn, oAuthSignIn } from "@/actions/auth";
import { OAuthProvider } from "@/generated/prisma"; // enum prisma: discord | google

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    startTransition(async () => {
      const res = await signIn(form);
      if (res?.error) setErrorMsg(res.error);
    });
  };

  const oauthButton = (
    provider: OAuthProvider,
    label: string,
    icon: React.ReactNode
  ) => (
    <form action={async () => oAuthSignIn(provider)} className="w-full">
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:bg-muted transition-all duration-200"
      >
        {icon}
        <span className="text-sm font-medium text-foreground">{label}</span>
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-secondary/20 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_theme(colors.primary)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_theme(colors.accent)_0%,_transparent_50%)]" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute -top-2 -right-2 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-accent/10 rounded-full blur-lg" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  R
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Selamat Datang Kembali!
            </h1>
            <p className="text-muted-foreground text-sm">
              Masuk untuk melanjutkan pesanan favorit Anda
            </p>
          </div>

          {/* OAuth */}
          <div className="space-y-3 mb-6">
            {oauthButton(
              OAuthProvider.google,
              "Masuk dengan Google",
              <GoogleIcon />
            )}
            {/* {oauthButton(
              OAuthProvider.discord,
              "Masuk dengan Discord",
              <Discord className="w-5 h-5 text-foreground" />
            )} */}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">
                atau gunakan email
              </span>
            </div>
          </div>

          {/* Card Akun Demo */}
          <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium mb-2">Akun demo (untuk testing):</p>
            <div className="grid gap-2">
              <div>
                <span className="font-semibold">User</span>
                <br />
                <span className="font-mono">budi.santoso@example.com</span>
                <br />
                <span className="font-mono">asdasdasd</span>
              </div>
              <div className="border-t border-border/60 pt-2">
                <span className="font-semibold">Admin</span>
                <br />
                <span className="font-mono">admin@gmail.com</span>
                <br />
                <span className="font-mono">asdasdasd</span>
              </div>
            </div>
            <p className="mt-2 text-muted-foreground">
              Gunakan akun di atas jika tidak ingin membuat akun baru.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Form email/password */}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="nama@contoh.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  placeholder="Masukkan kata sandi"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80"
              >
                Lupa kata sandi?
              </button>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {pending ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                href="/sign-up"
                className="text-primary hover:text-primary/80 font-semibold"
              >
                Daftar
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Dengan melanjutkan, Anda menyetujui{" "}
            <a href="#" className="text-primary hover:text-primary/80">
              Ketentuan Layanan
            </a>{" "}
            dan{" "}
            <a href="#" className="text-primary hover:text-primary/80">
              Kebijakan Privasi
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
