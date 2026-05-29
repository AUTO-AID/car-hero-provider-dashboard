"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(13, 9, 22, 0.97)",
  borderColor: "rgba(143,92,177,0.35)",
  borderWidth: 1,
  padding: [12, 16],
  textStyle: { color: "#cbd5e1", fontSize: 12, fontFamily: "IBM Plex Sans Arabic" },
};

interface OverviewStatusDonutProps {
  pendingCount: number;
  completedCount: number;
  inProgressCount: number;
  cancelledCount: number;
}

export function OverviewStatusDonut({
  pendingCount,
  completedCount,
  inProgressCount,
  cancelledCount,
}: OverviewStatusDonutProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const statusDonutOption = {
    backgroundColor: "transparent",
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: "item",
      formatter: (p: any) => `<div style="display:flex;align-items:center;gap:8px">
        <span style="width:8px;height:8px;border-radius:50%;background:${p.color};box-shadow:0 0 8px ${p.color}55"></span>
        <span style="color:#cbd5e1">${p.name}</span>
        <b style="color:#fff;margin-right:6px">${p.value.toLocaleString("ar-EG")}</b>
        <span style="color:#64748b;font-size:11px">(${p.percent}%)</span>
      </div>`,
    },
    legend: { show: false },
    series: [
      {
        type: "pie",
        radius: ["58%", "80%"],
        center: ["50%", "50%"],
        data: [
          {
            name: "قيد الانتظار",
            value: pendingCount,
            itemStyle: { color: "#f59e0b", borderColor: "#0d0916", borderWidth: 3 },
          },
          {
            name: "مكتمل",
            value: completedCount,
            itemStyle: { color: "#10b981", borderColor: "#0d0916", borderWidth: 3 },
          },
          {
            name: "جاري",
            value: inProgressCount,
            itemStyle: { color: "#6366f1", borderColor: "#0d0916", borderWidth: 3 },
          },
          {
            name: "ملغي",
            value: cancelledCount,
            itemStyle: { color: "#ef4444", borderColor: "#0d0916", borderWidth: 3 },
          },
        ].filter((d) => d.value > 0),
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 20, shadowColor: "rgba(143,92,177,0.3)" },
          scale: true,
          scaleSize: 6,
        },
      },
    ],
  };

  return (
    <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/40 shadow-xl shadow-black/20 relative overflow-hidden group">
      <div className="mb-4 relative z-10">
        <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
          <Package className="w-4 h-4 text-violet-400" />
          توزيع حالات الطلبات
        </h3>
        <p className="text-[12px] text-muted-foreground mt-1">نسب الطلبات حسب الحالة</p>
      </div>

      <div className="relative z-10 h-[200px]">
        {isMounted ? (
          <ReactECharts
            option={statusDonutOption}
            style={{ height: "100%", width: "100%" }}
            opts={{ renderer: "canvas" }}
            notMerge={true}
            lazyUpdate={true}
          />
        ) : null}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-3 relative z-10">
        {[
          { label: "قيد الانتظار", color: "#f59e0b", val: pendingCount },
          { label: "مكتمل", color: "#10b981", val: completedCount },
          { label: "جاري", color: "#6366f1", val: inProgressCount },
          { label: "ملغي", color: "#ef4444", val: cancelledCount },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/30 border border-border/30"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: item.color, boxShadow: `0 0 6px ${item.color}60` }}
            />
            <span className="text-[10px] text-muted-foreground/80 flex-1">{item.label}</span>
            <span className="text-[11px] font-bold text-white tabular-nums">{item.val}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
