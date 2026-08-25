"use client";

import { FileText, ImageIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

export interface ShopPhoto {
  name?: string;
  size?: number;
  type?: string;
}

interface DocumentsSectionProps {
  documents: string[];
  shopPhotos: ShopPhoto[];
}

function fileName(url: string) {
  try {
    return decodeURIComponent(new URL(url, "https://x").pathname.split("/").pop() || url);
  } catch {
    return url;
  }
}

/** كيلوبايت/ميغابايت — الحجم الخام بالبايت لا يقول شيئاً لصاحب ورشة. */
function humanSize(bytes?: number) {
  if (!bytes || !Number.isFinite(bytes)) return null;
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

/**
 * المستندات وصور الورشة — للعرض لا للتعديل.
 *
 * كانت هذه البيانات تُحفظ على وثيقة المزوّد ولا يراها في اللوحة إطلاقاً، فلا
 * يعرف ما الذي وصل الإدارة عنه ولا ما ينقصه.
 *
 * **`shopPhotos` أسماء ملفّات لا صور**: نموذج التسجيل في الموقع يرسل
 * `{name, size, type}` فقط ولا يرفع الملفّ نفسه، فلا يوجد ما يُعرض سوى ما
 * كتبه المزوّد. عرضها كأسماء أصدق من إطارات صور مكسورة.
 */
export function DocumentsSection({ documents, shopPhotos }: DocumentsSectionProps) {
  const hasAny = documents.length > 0 || shopPhotos.length > 0;

  return (
    <Card className="gap-0 p-0">
      <div className="border-b border-border/60 p-5 sm:p-6">
        <h2 className="flex items-center gap-2.5 text-lg font-bold text-foreground">
          <FileText className="size-5 text-primary" aria-hidden />
          مستنداتك وصور ورشتك
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ما وصل الإدارة عنك عند التسجيل. لتغييره راجع الدعم.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        {!hasAny ? (
          <EmptyState
            compact
            icon={FileText}
            title="لا توجد مستندات مرفقة"
            description="لم يصل مع طلب تسجيلك أيّ مستند أو صورة."
          />
        ) : (
          <div className="flex flex-col gap-5">
            {documents.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground">المستندات</h3>
                <ul className="flex flex-col gap-2">
                  {documents.map((url) => (
                    <li
                      key={url}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/25 p-3"
                    >
                      <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                        {fileName(url)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<a href={url} target="_blank" rel="noopener noreferrer" />}
                      >
                        <ExternalLink aria-hidden /> فتح
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {shopPhotos.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground">صور الورشة</h3>
                <ul className="flex flex-col gap-2">
                  {shopPhotos.map((photo, index) => {
                    const size = humanSize(photo.size);
                    return (
                      <li
                        key={`${photo.name ?? "photo"}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/25 p-3"
                      >
                        <ImageIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                          {photo.name || `صورة ${index + 1}`}
                        </span>
                        {size && (
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{size}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
