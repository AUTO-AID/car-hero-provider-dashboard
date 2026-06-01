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
      <Card className="glass-v2 border-border/30 rounded-lg overflow-hidden">
        <CardHeader className="border-b border-border/20 bg-secondary/10">
          <CardTitle className="text-base flex items-center gap-2"><UploadCloud className="w-4 h-4 text-primary" /> وثائق التوثيق</CardTitle>
          <CardDescription className="text-xs">ارفع الهوية أو الترخيص أو السجل التجاري بصيغة PDF أو JPG أو PNG.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <button type="button" disabled={isSaving} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); void upload(event.dataTransfer.files[0]); }} className={`w-full min-h-36 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-60 ${isDragging ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/60 hover:bg-secondary/10"}`}>
            {isSaving ? <Loader2 className="w-7 h-7 text-primary animate-spin" /> : <UploadCloud className="w-7 h-7 text-primary" />}
            <span className="text-xs font-bold">اسحب الملف هنا أو انقر لاختياره</span>
            <span className="text-[10px] text-muted-foreground">الحد الأقصى 5 ميغابايت لكل ملف، وحتى 10 ملفات</span>
            {progress !== null && <span className="text-[11px] text-primary font-bold">تم رفع {progress}%</span>}
          </button>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => void upload(event.target.files?.[0])} className="hidden" />

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-muted-foreground">المستندات المرفوعة ({documents.length})</h3>
            {!documents.length ? <p className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/30 rounded-lg">لم ترفع أي وثيقة بعد.</p> : documents.map((document) => (
              <div key={document} className="flex items-center justify-between gap-3 p-3 border border-border/25 rounded-lg bg-secondary/10">
                <a href={resolveDocumentUrl(document)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold hover:text-primary min-w-0">
                  <FileText className="w-4 h-4 shrink-0 text-primary" />
                  <span className="truncate">{document.split("/").pop()}</span>
                </a>
                <Button type="button" size="icon" variant="ghost" disabled={isSaving} title="حذف المستند" onClick={() => void remove(document)} className="shrink-0 text-muted-foreground hover:text-rose-400"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Status({ status, rejectionReason }: { status: string; rejectionReason: string }) {
  if (status === "approved") return <p className="flex gap-2 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400"><CheckCircle2 className="w-4 h-4 shrink-0" /> حسابك موثق ويمكنك تحديث الوثائق عند الحاجة.</p>;
  if (status === "rejected") return <p className="flex gap-2 p-4 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs text-rose-400"><AlertTriangle className="w-4 h-4 shrink-0" /> تعذر اعتماد الوثائق: {rejectionReason || "يرجى مراجعة الملفات وإعادة رفعها."}</p>;
  return <p className="flex gap-2 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400"><AlertTriangle className="w-4 h-4 shrink-0" /> وثائقك قيد المراجعة.</p>;
}

function resolveDocumentUrl(document: string) {
  if (/^https?:\/\//i.test(document)) return document;
  const configured = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  try { return `${new URL(configured).origin}${document}`; } catch { return document; }
}
