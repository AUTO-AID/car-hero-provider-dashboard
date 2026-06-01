"use client";

import { useState } from "react";
import { Clock3, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ServiceCatalogItem } from "@/infrastructure/services/profile.service";

export function ServiceCard({ service, selected, enabled, price, pending, onAdd, onDelete, onToggle, onPrice }: { service: ServiceCatalogItem; selected: boolean; enabled: boolean; price: number; pending: boolean; onAdd: () => void; onDelete: () => void; onToggle: (enabled: boolean) => void; onPrice: (price: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(String(price));
  const numericDraft = Number(draft);
  const validPrice = Number.isFinite(numericDraft) && numericDraft >= 0 && numericDraft <= 1_000_000_000;
  return (
    <article className={`p-4 rounded-lg border transition-colors ${selected ? "border-primary/30 bg-primary/5" : "border-border/25 bg-secondary/10"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0"><span className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center"><Wrench className="w-4 h-4 text-primary" /></span><div className="min-w-0"><h2 className="text-sm font-bold truncate">{service.nameAr || service.name}</h2><p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1"><Clock3 className="w-3 h-3" /> {service.estimatedDuration} دقيقة</p></div></div>
        {selected ? <Switch checked={enabled} disabled={pending} onCheckedChange={onToggle} aria-label={`توفر ${service.nameAr}`} /> : <Button type="button" size="sm" disabled={pending} onClick={onAdd} className="gap-1"><Plus className="w-3.5 h-3.5" /> إضافة</Button>}
      </div>
      <div className="flex items-end justify-between gap-3 mt-4 pt-3 border-t border-border/20">
        <div><p className="text-[10px] text-muted-foreground">السعر {selected ? "لديك" : "الأساسي"}</p><p className="text-sm font-black mt-0.5">{price.toLocaleString("ar-SY")} ل.س</p></div>
        <div className="flex items-center gap-1.5">{selected && <><Badge variant={enabled ? "default" : "outline"}>{enabled ? "متاحة" : "متوقفة"}</Badge><Button type="button" size="icon-sm" variant="ghost" title="تعديل السعر" disabled={pending} onClick={() => { setDraft(String(price)); setEditing(true); }}><Pencil className="w-3.5 h-3.5" /></Button><Button type="button" size="icon-sm" variant="ghost" title="حذف من خدماتي" disabled={pending} onClick={() => setConfirmDelete(true)} className="text-rose-400"><Trash2 className="w-3.5 h-3.5" /></Button></>}</div>
      </div>
      <Dialog open={editing} onOpenChange={setEditing}><DialogContent><DialogHeader><DialogTitle>تعديل سعر الخدمة</DialogTitle><DialogDescription>{service.nameAr || service.name}</DialogDescription></DialogHeader><label className="text-xs font-bold space-y-2"><span>السعر بالليرة السورية</span><Input type="number" min="0" max="1000000000" value={draft} onChange={(event) => setDraft(event.target.value)} /></label><DialogFooter><Button type="button" disabled={!validPrice || pending} onClick={() => { onPrice(numericDraft); setEditing(false); }}>حفظ السعر</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}><DialogContent><DialogHeader><DialogTitle>حذف الخدمة من قائمتك؟</DialogTitle><DialogDescription>ستختفي خدمة {service.nameAr || service.name} من خدماتك وأسعارك. يمكنك إضافتها مجدداً من الكتالوج.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="destructive" disabled={pending} onClick={() => { onDelete(); setConfirmDelete(false); }}>تأكيد الحذف</Button></DialogFooter></DialogContent></Dialog>
    </article>
  );
}
