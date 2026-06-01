"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Car,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "@/application/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { admin, isLoading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && admin) {
      window.location.href = "/";
    }
  }, [admin, isLoading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);

    try {
      await login(email.trim(), password);
      toast.success("تم تسجيل الدخول بنجاح");
      window.location.href = "/";
    } catch (error: unknown) {
      const message = getLoginErrorMessage(error);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen gradient-bg-login flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 grid-pattern opacity-[0.035]" />

      {/* Decorative floating orbs */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float pointer-events-none" />
      <div
        className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-primary/3 blur-3xl animate-float pointer-events-none"
        style={{ animationDelay: "1.5s" }}
      />

      <section className="relative w-full max-w-[520px] animate-fade-in-up">
        {/* ── Logo & Brand ── */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-xl shadow-primary/15 transition-transform hover:scale-105 duration-300">
            <Car className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Car<span className="text-primary">Hero</span>
          </h1>
          <p className="mt-2.5 text-sm text-muted-foreground">
            لوحة تحكم مزودي الخدمة
          </p>
        </div>

        {/* ── Login Card ── */}
        <div className="glass-strong rounded-2xl p-10 sm:p-14 shadow-2xl shadow-black/25 border-glow-anim">
          {/* Card Header */}
          <div className="mb-10 flex items-center gap-4 border-b border-border/30 pb-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                مرحباً بك في لوحة تحكم المزود
              </h2>
              <p className="text-muted-foreground font-medium text-sm mt-1.5">
                قم بتسجيل الدخول لإدارة خدماتك وطلباتك
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Phone Field */}
            <div className="space-y-3">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-muted-foreground tracking-wide"
              >
                رقم الهاتف
              </Label>
              <div className="relative group">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-200" />
                <Input
                  id="email"
                  type="tel"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="+963991234567"
                  dir="ltr"
                  className="!h-[54px] rounded-xl border-border/50 bg-secondary/50 pr-12 text-base placeholder:text-muted-foreground/35 transition-all duration-200 focus:bg-secondary/70"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3 mt-8">
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-muted-foreground tracking-wide"
              >
                كلمة المرور
              </Label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-200" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  dir="ltr"
                  className="!h-[54px] rounded-xl border-border/50 bg-secondary/50 px-12 text-base transition-all duration-200 focus:bg-secondary/70"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground/50 transition-all duration-200 hover:text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="mt-16 mb-10">
              <div className="h-px w-full bg-gradient-to-l from-transparent via-border/60 to-transparent" />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="!h-[58px] w-full rounded-xl text-base font-bold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-muted-foreground/40 tracking-wider">
          CarHero Provider Dashboard &copy; {new Date().getFullYear()}
        </p>
      </section>
    </main>
  );
}

function getLoginErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string | string[] } } }
    ).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) return message[0] ?? "بيانات الدخول غير صحيحة";
    if (message) return message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "بيانات الدخول غير صحيحة";
}
