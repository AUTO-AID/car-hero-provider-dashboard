"use client";

import { X, Truck, Zap, Disc, Droplet, Wrench } from "lucide-react";

export function getServiceIcon(serviceName: string) {
  const name = serviceName.toLowerCase();
  if (name.includes("سحب") || name.includes("سطحة") || name.includes("towing")) {
    return Truck;
  }
  if (name.includes("بطارية") || name.includes("battery") || name.includes("كهرباء") || name.includes("electric")) {
    return Zap;
  }
  if (name.includes("إطار") || name.includes("دولاب") || name.includes("tire") || name.includes("wheel") || name.includes("بنجر")) {
    return Disc;
  }
  if (name.includes("غسيل") || name.includes("تنظيف") || name.includes("wash") || name.includes("clean")) {
    return Droplet;
  }
  return Wrench;
}

interface ServiceCardProps {
  service: string;
  onRemove: () => void;
  isPending: boolean;
}

export function ServiceCard({ service, onRemove, isPending }: ServiceCardProps) {
  const Icon = getServiceIcon(service);

  return (
    <div
      className="group relative flex items-center justify-between p-4 rounded-2xl border border-border/30 bg-secondary/25 hover:bg-secondary/45 hover:border-primary/20 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-200">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold text-white text-sm">
            {service}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            خدمة فعالة ومتاحة للطلب
          </p>
        </div>
      </div>
      <button
        onClick={onRemove}
        disabled={isPending}
        aria-label={`حذف ${service}`}
        className="p-2 rounded-lg text-muted-foreground/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
