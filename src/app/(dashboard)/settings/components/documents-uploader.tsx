"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProviderDocuments } from "@/infrastructure/services/profile.service";
import { providerQueryKeys } from "@/application/services/prefetch";
import { api } from "@/infrastructure/api/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FileText,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface DocumentsUploaderProps {
  registrationStatus: string;
  rejectionReason: string;
  initialDocuments: string[];
}

export function DocumentsUploader({
  registrationStatus,
  rejectionReason,
  initialDocuments,
}: DocumentsUploaderProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; url: string; size: string; type: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (initialDocuments && Array.isArray(initialDocuments)) {
      const docs = initialDocuments.map((url: string, index: number) => {
        const filename = url.split("/").pop() || `مستند_${index + 1}`;
        return {
          name: filename,
          url,
          size: "مستند موثق",
          type: url.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
        };
      });
      setUploadedDocs(docs);
    }
  }, [initialDocuments]);

  const updateDocsMut = useMutation({
    mutationFn: updateProviderDocuments,
    onSuccess: () => {
      toast.success("تم تحديث وثائق التفعيل بنجاح");
      queryClient.invalidateQueries({ queryKey: providerQueryKeys.profile });
    },
    onError: () => toast.error("حدث خطأ أثناء تحديث الوثائق في السيرفر"),
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الملف يجب ألا يتجاوز 5 ميغابايت");
      return;
    }

    const toastId = toast.loading(`جاري معالجة ورفع ${file.name}...`);
    
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await api.post("/chat/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(interval);
      setUploadProgress(100);
      
      const fileUrl = response.data?.fileUrl || response.data?.data?.fileUrl;
      if (!fileUrl) {
        throw new Error("Upload endpoint did not return fileUrl");
      }
      const newDoc = {
        name: file.name,
        url: fileUrl,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type,
      };

      const updatedList = [...uploadedDocs, newDoc];
      setUploadedDocs(updatedList);

      const urlsOnly = updatedList.map(d => d.url);
      await updateDocsMut.mutateAsync(urlsOnly);
      
      toast.success("تم رفع المستند وتحديث الملف بنجاح", { id: toastId });
    } catch (err) {
      console.error("Upload api error:", err);
      clearInterval(interval);
      toast.error("فشل رفع المستند إلى الخادم. لم يتم حفظ أي رابط وهمي.", { id: toastId });
    } finally {
      setTimeout(() => setUploadProgress(null), 800);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDeleteDoc = async (indexToDelete: number) => {
    const toastId = toast.loading("جاري حذف المستند...");
    const updatedList = uploadedDocs.filter((_, i) => i !== indexToDelete);
    setUploadedDocs(updatedList);
    
    try {
      const urlsOnly = updatedList.map(d => d.url);
      await updateDocsMut.mutateAsync(urlsOnly);
      toast.success("تم حذف المستند بنجاح", { id: toastId });
    } catch (err) {
      toast.error("فشل حذف المستند في السيرفر", { id: toastId });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Verification Status Alert */}
      {registrationStatus === "approved" && (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
          <CheckCircle2 className="w-5.5 h-5.5 shrink-0 mt-0.5 text-emerald-400 animate-bounce" />
          <div>
            <h4 className="text-sm font-bold">الحساب موثق ومفعل بالكامل ✓</h4>
            <p className="text-xs text-emerald-400/80 mt-1 leading-relaxed">
              تهانينا، لقد تم التحقق من أوراقك الثبوتية بنجاح. حسابك نشط الآن ويمكنك استقبال وحجز الطلبات بدون قيود.
            </p>
          </div>
        </div>
      )}

      {registrationStatus === "pending" && (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400">
          <AlertTriangle className="w-5.5 h-5.5 shrink-0 mt-0.5 text-amber-400 animate-pulse" />
          <div>
            <h4 className="text-sm font-bold">الوثائق قيد التدقيق والمراجعة</h4>
            <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
              يقوم فريق الجودة والأمان بمراجعة المستندات المرفقة وتفعيل الحساب. يستغرق ذلك عادة من 4 إلى 24 ساعة عمل.
            </p>
          </div>
        </div>
      )}

      {registrationStatus === "rejected" && (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400">
          <AlertTriangle className="w-5.5 h-5.5 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <h4 className="text-sm font-bold">تم رفض الوثائق أو لم تكتمل المراجعة</h4>
            <p className="text-xs text-rose-400/80 mt-1 leading-relaxed">
              سبب الرفض: <span className="font-bold underline">{rejectionReason || "يرجى التأكد من رفع الهوية الشخصية وصورة واضحة لورشة العمل."}</span>. الرجاء تعديل الأوراق وإعادة الرفع.
            </p>
          </div>
        </div>
      )}

      <Card className="glass-v2 border border-border/30 rounded-2xl overflow-hidden shadow-xl">
        <CardHeader className="pb-4 border-b border-border/20 bg-secondary/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <UploadCloud className="w-3.5 h-3.5 text-primary" />
            </span>
            رفع الوثائق الرسمية للتوثيق
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-medium">
            يرجى تزويدنا بصورة السجل التجاري، رخصة القيادة أو الهوية الوطنية لتفعيل حسابك ومكافحة الانتحال.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/10 scale-[0.99] shadow-inner"
                : "border-border/40 hover:border-primary/50 hover:bg-secondary/5 bg-secondary/2"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".jpg,.jpeg,.png,.pdf"
              className="hidden"
            />

            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="text-center">
              <p className="text-xs font-bold text-foreground">
                اسحب وأفلت الملف هنا أو انقر للتصفح
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                الملفات المسموح بها: JPG، PNG، PDF (الحد الأقصى: 5 ميغابايت)
              </p>
            </div>

            {uploadProgress !== null && (
              <div className="w-full max-w-xs space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-primary">
                  <span>جاري الرفع...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Uploaded Documents List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground/80 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary/60" />
              المستندات المرفوعة حالياً ({uploadedDocs.length})
            </h4>

            {uploadedDocs.length === 0 ? (
              <div className="text-center p-8 rounded-xl border border-dashed border-border/10 bg-secondary/2 text-muted-foreground text-xs font-medium">
                لا يوجد مستندات مرفوعة حالياً. يرجى رفع الهوية الوطنية والسجل التجاري لبدء تفعيل حسابك.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {uploadedDocs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/25 bg-secondary/10 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <FileText className="w-4.5 h-4.5" />
                      </span>
                      <div className="overflow-hidden">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold hover:text-primary transition-colors truncate block max-w-[180px]"
                          title={doc.name}
                        >
                          {doc.name}
                        </a>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {doc.size}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteDoc(idx)}
                      className="w-8 h-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 text-muted-foreground/60 transition-colors shrink-0"
                      title="حذف المستند"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
