"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProviderDocuments, uploadProviderDocument } from "@/infrastructure/services/profile.service";

const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const maxSize = 5 * 1024 * 1024;

export function DocumentsUploader({ registrationStatus, rejectionReason, initialDocuments }: { registrationStatus: string; rejectionReason: string; initialDocuments: string[] }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const persist = async (next: string[]) => {
    await updateProviderDocuments(next);
    setDocuments(next);
    await queryClient.invalidateQueries({ queryKey: providerQueryKeys.profile });
  };

  const upload = async (file?: File) => {
    if (!file) return;
    if (documents.length >= 10) return toast.error("يمكن رفع عشرة مستندات كحد أقصى.");
    if (!allowedTypes.has(file.type)) return toast.error("الملفات المقبولة هي PDF وJPG وPNG فقط.");
    if (file.size > maxSize) return toast.error("حجم الملف يجب ألا يتجاوز 5 ميغابايت.");
    setIsSaving(true);
    setProgress(0);
    const toastId = toast.loading("جاري رفع المستند...");
    try {
      const result = await uploadProviderDocument(file, setProgress);
      await persist([...documents, result.fileUrl]);
      toast.success("تم رفع المستند وحفظه في ملفك.", { id: toastId });
    } catch {
      toast.error("تعذر رفع المستند أو حفظه. لم تتغير قائمة الوثائق.", { id: toastId });
    } finally {
      setIsSaving(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (document: string) => {
    setIsSaving(true);
    const toastId = toast.loading("جاري حذف المستند...");
    try {
      await persist(documents.filter((item) => item !== document));
      toast.success("تم حذف المستند من ملفك.", { id: toastId });
    } catch {
      toast.error("تعذر حذف المستند. بقيت القائمة دون تغيير.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Status status={registrationStatus} rejectionReason={rejectionReason} />
      <Card className="gap-0">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base"><UploadCloud className="size-4 text-primary" aria-hidden /> وثائق التوثيق</CardTitle>
          <CardDescription>ارفع الهوية أو الترخيص أو السجل التجاري بصيغة PDF أو JPG أو PNG.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <button type="button" disabled={isSaving} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); void upload(event.dataTransfer.files[0]); }} className={`w-full min-h-[160px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all duration-300 disabled:opacity-60 overflow-hidden relative group ${isDragging ? "border-primary bg-primary/15 scale-[1.02]" : "border-border/40 hover:border-primary/60 hover:bg-secondary/20"}`}>
            <span className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className={`p-3 rounded-full transition-transform duration-500 ${isDragging ? "bg-primary text-primary-foreground scale-110" : "bg-secondary/40 text-primary group-hover:scale-110"}`}>
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
            </div>
            <div className="text-center relative z-10">
              <span className="block text-sm font-bold text-foreground">اسحب الملف هنا أو انقر لاختياره</span>
              <span className="block text-[11px] text-muted-foreground mt-1">الحد الأقصى 5 ميغابايت لكل ملف، وحتى 10 ملفات</span>
            </div>
            {progress !== null && <span className="absolute bottom-2 text-[11px] text-primary font-bold">تم رفع {progress}%</span>}
          </button>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => void upload(event.target.files?.[0])} className="hidden" />

          <div className="space-y-3">
            <h3 className="text-[13px] font-bold text-muted-foreground">المستندات المرفوعة ({documents.length})</h3>
            {!documents.length ? <p className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border/20 rounded-xl bg-secondary/5">لم ترفع أي وثيقة بعد.</p> : documents.map((document) => (
              <div key={document} className="group flex items-center justify-between gap-4 p-3 border border-border/20 rounded-xl bg-secondary/10 hover:bg-secondary/30 transition-all">
                <a href={resolveDocumentUrl(document)} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-bold hover:text-primary min-w-0 transition-colors">
                  <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-5 h-5 text-primary" />
                  </span>
                  <span className="truncate">{document.split("/").pop()}</span>
                </a>
                <Button type="button" size="icon" variant="ghost" disabled={isSaving} title="حذف المستند" onClick={() => void remove(document)} aria-label={`حذف ${document.split("/").pop()}`} className="shrink-0 text-muted-foreground hover:bg-danger/10 hover:text-danger-soft"><Trash2 aria-hidden /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const STATUS_VIEWS = {
  approved: {
    icon: CheckCircle2,
    tone: "border-success/25 bg-success/5 text-success-soft",
    title: "حساب موثّق",
    body: "يمكنك تحديث الوثائق عند الحاجة، وستخضع للمراجعة من جديد.",
  },
  rejected: {
    icon: AlertTriangle,
    tone: "border-danger/25 bg-danger/5 text-danger-soft",
    title: "مستندات مرفوضة",
    body: "",
  },
  pending: {
    icon: Loader2,
    tone: "border-warning/25 bg-warning/5 text-warning-soft",
    title: "قيد المراجعة",
    body: "مستنداتك قيد الفحص حالياً من قِبَل الإدارة.",
  },
} as const;

function Status({ status, rejectionReason }: { status: string; rejectionReason: string }) {
  const view = STATUS_VIEWS[status as keyof typeof STATUS_VIEWS] ?? STATUS_VIEWS.pending;
  const Icon = view.icon;

  return (
    <div role="status" className={`flex gap-3 rounded-xl border p-4 ${view.tone}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${status === "pending" ? "animate-spin" : ""}`} aria-hidden />
      <div>
        <h4 className="text-sm font-bold">{view.title}</h4>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {status === "rejected" ? rejectionReason || "يرجى مراجعة الملفات وإعادة رفعها." : view.body}
        </p>
      </div>
    </div>
  );
}

function resolveDocumentUrl(document: string) {
  if (/^https?:\/\//i.test(document)) return document;
  const configured = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  try { return `${new URL(configured).origin}${document}`; } catch { return document; }
}
