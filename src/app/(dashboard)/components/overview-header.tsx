"use client";

interface OverviewHeaderProps {
  businessName: string;
  ownerName: string;
  isApproved: boolean;
}

export function OverviewHeader({ businessName, ownerName, isApproved }: OverviewHeaderProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 hero-gradient-card border border-border/30 animate-fade-in">
      <span className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" aria-hidden />
      <span className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-blue-500/8 blur-2xl pointer-events-none" aria-hidden />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary/70 mb-2 flex items-center gap-1.5">
            <span className="inline-block w-4 h-px bg-primary/50 rounded" />
            لوحة التحكم الرئيسية
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gradient leading-tight">
            مرحباً، {businessName || ownerName || "مزود الخدمة"} 👋
          </h1>
          <p className="text-muted-foreground font-medium mt-2 text-sm sm:text-base">
            إليك نظرة عامة شاملة على أداء نشاطك التجاري — بيانات حية من قاعدة البيانات.
          </p>
        </div>
        <div className={`self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${
          isApproved
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
        }`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isApproved ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isApproved ? "bg-emerald-400" : "bg-amber-400"}`} />
          </span>
          {isApproved ? "حساب معتمد ومفعل" : "طلب قيد الدراسة"}
        </div>
      </div>
    </div>
  );
}
