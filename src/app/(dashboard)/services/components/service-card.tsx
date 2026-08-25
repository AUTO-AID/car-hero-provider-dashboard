"use client";

import { useState } from "react";
import { Check, Clock3, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";
import { Switch } from "@/components/ui/switch";
import { ServiceCatalogItem } from "@/domain/entities/provider.types";
import { categoryMetaFor } from "@/domain/entities/service-catalog";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

interface ServiceCardProps {
  service: ServiceCatalogItem;
  selected: boolean;
  enabled: boolean;
  price: number;
  pending: boolean;
  onAdd: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
  onPrice: (price: number) => void;
}

const MAX_PRICE = 1_000_000_000;

export function ServiceCard({
  service,
  selected,
  enabled,
  price,
  pending,
  onAdd,
  onDelete,
  onToggle,
  onPrice,
}: ServiceCardProps) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(String(price));

  const numericDraft = Number(draft);
  const invalidPrice =
    !Number.isFinite(numericDraft) || numericDraft < 0 || numericDraft > MAX_PRICE;

  const name = service.nameAr || service.name;
  // كل بطاقات الكتالوج كانت تحمل `Wrench` نفسه: تسع بطاقات برمز واحد، فالتمييز
  // بينها يقع على النصّ وحده. الأيقونة واللون يأتيان الآن من فئة الخدمة.
  const meta = categoryMetaFor(service.category);
  const Icon = meta.icon;

  const startEditing = () => {
    setDraft(String(price));
    setEditing(true);
  };

  const commitPrice = () => {
    if (invalidPrice) return;
    onPrice(numericDraft);
    setEditing(false);
  };

  return (
    <Card
      className={cn(
        "gap-0 transition-colors",
        selected ? "border-primary/40 bg-primary/5" : "hover:border-border"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl border", meta.bg, meta.color)}>
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-bold text-foreground">{name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" aria-hidden /> {formatNumber(service.estimatedDuration)} دقيقة
              </p>
            </div>
          </div>

          {selected ? (
            <Switch
              checked={enabled}
              disabled={pending}
              onCheckedChange={onToggle}
              aria-label={`إتاحة ${name} للحجز`}
            />
          ) : (
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onAdd}>
              <Plus aria-hidden /> إضافة
            </Button>
          )}
        </div>

        <div className="mt-5 border-t border-border/60 pt-4">
          {editing ? (
            /* تحرير داخل البطاقة بدل فتح حوار كامل لتغيير رقم واحد */
            <div className="space-y-2">
              <label htmlFor={`price-${service.id}`} className="text-xs font-semibold text-muted-foreground">
                السعر بالليرة السورية
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id={`price-${service.id}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_PRICE}
                  value={draft}
                  autoFocus
                  aria-invalid={invalidPrice || undefined}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitPrice();
                    if (event.key === "Escape") setEditing(false);
                  }}
                  className="h-9"
                  dir="ltr"
                />
                <Button
                  type="button"
                  size="icon-sm"
                  onClick={commitPrice}
                  disabled={invalidPrice || pending}
                  aria-label="حفظ السعر"
                >
                  <Check aria-hidden />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                  aria-label="إلغاء التعديل"
                >
                  <X aria-hidden />
                </Button>
              </div>
              {invalidPrice && (
                <p role="alert" className="text-xs text-danger-soft">
                  أدخل رقماً بين 0 و {formatNumber(MAX_PRICE)}.
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  السعر {selected ? "الخاص بك" : "المقترح"}
                </p>
                <Money value={price} className="mt-1 block text-[15px] font-bold text-foreground" />
              </div>

              {selected && (
                <div className="flex items-center gap-1.5">
                  <Badge variant={enabled ? "success" : "neutral"} className="h-6 rounded-full border px-2.5">
                    {enabled ? "متاحة للحجز" : "متوقّفة"}
                  </Badge>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    title="تعديل السعر"
                    aria-label={`تعديل سعر ${name}`}
                    disabled={pending}
                    onClick={startEditing}
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    title="حذف من خدماتي"
                    aria-label={`حذف ${name} من خدماتي`}
                    disabled={pending}
                    onClick={() => setConfirmDelete(true)}
                    className="text-muted-foreground hover:bg-danger/10 hover:text-danger-soft"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="حذف الخدمة من قائمتك؟"
        description={`ستختفي «${name}» من خدماتك وأسعارك ولن يتمكّن العملاء من حجزها. يمكنك إضافتها مجدداً من الكتالوج.`}
        confirmLabel="تأكيد الحذف"
        danger
        isPending={pending}
        onConfirm={() => {
          onDelete();
          setConfirmDelete(false);
        }}
      />
    </Card>
  );
}
