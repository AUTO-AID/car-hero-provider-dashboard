"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { AlertCircle, Eye, EyeOff, Lock, LogIn, ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/application/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { provider, isLoading, login } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // الخطأ يبقى معروضاً داخل النموذج. الاعتماد على toast وحده كان يعني أن
  // المستخدم الذي يعيد المحاولة بعد ثوانٍ لا يرى سبب الرفض إطلاقاً.
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && provider) {
      router.push("/");
    }
  }, [provider, isLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setFormError(null);

    try {
      await login(normalizeSyrianPhone(phone), password);
      toast.success("تم تسجيل الدخول بنجاح");
      router.push("/");
    } catch (error: unknown) {
      setFormError(getLoginErrorMessage(error));
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen gradient-bg-login flex items-center justify-center overflow-x-hidden px-4 py-10 sm:py-12">
      <div className="absolute inset-0 grid-pattern opacity-[0.035]" />

      {/* Decorative floating orbs */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float pointer-events-none" />
      <div
        className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-primary/3 blur-3xl animate-float pointer-events-none"
        style={{ animationDelay: "1.5s" }}
      />

      <section className="relative w-full max-w-[460px] min-w-0 animate-fade-in-up">
        {/* ── Logo & Brand ── */}
        <div className="mb-7 text-center">
          <Image
            src="/logo_carHero.png"
            alt="Car Hero"
            width={250}
            height={100}
            priority
            style={{ width: "210px", height: "auto" }}
            className="mx-auto mb-4 h-auto w-[210px] object-contain"
          />
          <p className="mt-2.5 text-sm text-muted-foreground">
            لوحة تحكم مزودي الخدمة
          </p>
        </div>

        {/* ── Login Card ── */}
        <div className="w-full max-w-full rounded-2xl border border-border bg-card/80 p-6 shadow-elev-3 backdrop-blur-xl sm:p-9">
          {/* Card Header */}
          <div className="mb-7 flex flex-col items-center gap-4 border-b border-border/60 pb-6 text-center sm:flex-row sm:text-start">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white">
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
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-muted-foreground">
                رقم الهاتف
              </Label>
              <div className="group relative">
                <User
                  className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary"
                  aria-hidden
                />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="09XXXXXXXX"
                  maxLength={10}
                  dir="ltr"
                  aria-invalid={formError ? true : undefined}
                  aria-describedby={formError ? "login-error" : undefined}
                  className="h-12 rounded-xl ps-12 text-base"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mt-5 space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-muted-foreground">
                كلمة المرور
              </Label>
              <div className="group relative">
                <Lock
                  className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary"
                  aria-hidden
                />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  dir="ltr"
                  aria-invalid={formError ? true : undefined}
                  aria-describedby={formError ? "login-error" : undefined}
                  className="h-12 rounded-xl px-12 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute end-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
                </button>
              </div>
            </div>

            {formError && (
              <p
                id="login-error"
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-lg border border-danger/25 bg-danger/10 p-3 text-sm text-danger-soft"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {formError}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="mt-7 h-12 w-full rounded-xl text-base"
            >
              {!loading && <LogIn className="size-5" aria-hidden />}
              {loading ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p
          className="mt-8 text-center text-[11px] text-muted-foreground/40 tracking-wider"
          dir="ltr"
          suppressHydrationWarning
        >
          CarHero Provider Dashboard &copy; {new Date().getFullYear()}
        </p>
      </section>
    </main>
  );
}

// الحقل يجمع الآن رقماً محلياً (09XXXXXXXX) بلا +963 — التطبيع هنا يماثل
// normalizeSyrianPhone في الـ backend (core/utils/phone.util.ts) لأن
// login.dto.ts يشترط الصيغة +963XXXXXXXXX حرفياً بلا أي تحويل من جهته.
function normalizeSyrianPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (/^09\d{8}$/.test(digits)) return `+963${digits.slice(1)}`;
  if (/^9639\d{8}$/.test(digits)) return `+${digits}`;
  return input.trim();
}

// الـ backend يردّ برسائل تسجيل الدخول بالإنجليزية دائماً (error-messages.constant.ts
// و login.dto.ts لا يترجمان). نفس النمط المتّبع في car-hero-app-provider
// (serverMessages.js) — خريطة تعريب محلية، وأي رسالة غير معروفة تمرّ كما هي.
const AUTH_MESSAGE_MAP: Record<string, string> = {
  "Invalid phone number or password": "رقم الهاتف أو كلمة المرور غير صحيحة",
  "Please verify your account first": "حسابك غير مفعّل — تواصل مع الإدارة",
  "Your account has been deactivated. Please contact support":
    "حسابك معطّل حالياً — تواصل مع الإدارة",
  "Unauthorized. Please login": "يرجى تسجيل الدخول",
  "Invalid or expired refresh token": "انتهت الجلسة، يرجى تسجيل الدخول من جديد",
  "Phone number is required": "أدخل رقم الهاتف",
  "Password is required": "أدخل كلمة المرور",
};

function localizeAuthMessage(message: string): string {
  return AUTH_MESSAGE_MAP[message] || message;
}

function getLoginErrorMessage(error: unknown) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string | string[] } } }
    ).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) return localizeAuthMessage(message[0] ?? "بيانات الدخول غير صحيحة");
    if (message) return localizeAuthMessage(message);
  }

  if (error instanceof Error && error.message) {
    return localizeAuthMessage(error.message);
  }

  return "بيانات الدخول غير صحيحة";
}
