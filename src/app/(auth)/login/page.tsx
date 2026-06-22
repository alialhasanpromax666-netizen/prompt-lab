"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn } from "next-auth/react";
import { Eye, EyeSlash, GoogleLogo, Quotes } from "@phosphor-icons/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/dashboard";
  const callbackUrl = rawCallback.startsWith("/") ? rawCallback : "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.error) {
          setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
          return;
        }

        router.push(callbackUrl);
        router.refresh();
      } catch {
        setError("حدث خطأ أثناء تسجيل الدخول");
      } finally {
        setLoading(false);
      }
    },
    [form, callbackUrl, router]
  );

  const handleGoogle = useCallback(async () => {
    await signIn("google", { callbackUrl });
  }, [callbackUrl]);

  return (
    <main className="min-h-screen flex items-center justify-center pt-16 pb-8 px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 size-[600px] rounded-full bg-accent/[0.06] blur-[130px]" />
        <div className="absolute -bottom-20 -left-20 size-[400px] rounded-full bg-accent-secondary/[0.05] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="rounded-2xl border border-border/60 bg-surface/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="size-8 rounded-xl bg-accent/15 flex items-center justify-center">
                <Quotes weight="fill" className="size-4 text-accent" />
              </div>
            </Link>
            <h1 className="text-lg font-bold text-text-primary mb-1">تسجيل الدخول</h1>
            <p className="text-xs text-text-secondary">أهلاً بعودتك! أدخل بياناتك للمتابعة</p>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2 mb-4 text-center"
            >
              {error}
            </motion.p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" dir="rtl">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              label="البريد الإلكتروني"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />

            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                label="كلمة المرور"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-[38px] text-text-muted hover:text-text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlash weight="bold" className="size-4" /> : <Eye weight="bold" className="size-4" />}
              </button>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              تسجيل الدخول
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-surface text-[10px] text-text-muted">أو</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            icon={<GoogleLogo weight="bold" className="size-4" />}
            onClick={handleGoogle}
          >
            الدخول بـ Google
          </Button>

          <p className="text-center text-xs text-text-muted mt-5">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-accent hover:text-accent/80 transition-colors font-medium">
              إنشاء حساب
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="size-6 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
