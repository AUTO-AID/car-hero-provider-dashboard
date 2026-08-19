"use client";

import { useClientReady } from "@/application/hooks/use-client-ready";
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
  const isMounted = useClientReady();

  const statusDonutOption = {
    backgroundColor: "transparent",
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: "item",
      formatter: (p: TooltipParam) => `<div style="display:flex;align-items:center;gap:8px">
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
    <Card className="p-6 bg-card/40 backdrop-blur-2xl border-border/20 shadow-2xl shadow-black/20 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="mb-4 relative z-10">
        <h3 className="font-bold text-foreground text-base flex items-center gap-2 drop-shadow-sm">
          <Package className="w-5 h-5 text-violet-400 drop-shadow-sm" />
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
            <span className="text-[11px] font-bold text-foreground tabular-nums">{item.val}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface TooltipParam {
  color: string;
  name: string;
  value: number;
  percent: number;
}
