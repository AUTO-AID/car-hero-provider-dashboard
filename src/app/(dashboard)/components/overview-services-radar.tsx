"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface ServicePerformance {
  _id: string;
  count: number;
  revenue: number;
}

interface OverviewServicesRadarProps {
  svcsPerformance: ServicePerformance[];
}

export function OverviewServicesRadar({ svcsPerformance }: OverviewServicesRadarProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const topSvcs = svcsPerformance.slice(0, 6);
  const maxCount = Math.max(...topSvcs.map((item) => item.count), 1);
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      backgroundColor: "rgba(13, 9, 22, 0.97)",
      borderColor: "rgba(143,92,177,0.35)",
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: "#cbd5e1", fontSize: 12, fontFamily: "IBM Plex Sans Arabic" },
      trigger: "item",
    },
    radar: {
      indicator: topSvcs.map((service) => ({
        name: service._id || "خدمة",
        max: maxCount * 1.2,
      })),
      center: ["50%", "55%"],
      radius: "65%",
      axisName: { color: "#94a3b8", fontSize: 10, fontFamily: "IBM Plex Sans Arabic" },
      splitLine: { lineStyle: { color: "rgba(143,92,177,0.12)", type: "dashed" } },
      splitArea: { areaStyle: { color: ["rgba(143,92,177,0.03)", "rgba(143,92,177,0.06)"] } },
      axisLine: { lineStyle: { color: "rgba(143,92,177,0.15)" } },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            name: "أداء الخدمات",
            value: topSvcs.map((service) => service.count),
            symbol: "circle",
            symbolSize: 5,
            itemStyle: { color: "#a57ed8" },
            lineStyle: { color: "#a57ed8", width: 2.5, shadowColor: "rgba(165,126,216,0.5)", shadowBlur: 8 },
            areaStyle: {
              color: {
                type: "radial",
                x: 0.5,
                y: 0.5,
                r: 0.5,
                colorStops: [
                  { offset: 0, color: "rgba(165,126,216,0.35)" },
                  { offset: 1, color: "rgba(165,126,216,0.05)" },
                ],
              },
            },
          },
        ],
      },
    ],
  };

  return (
    <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/40 shadow-xl shadow-black/20 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="mb-4 relative z-10">
        <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          أداء الخدمات
        </h3>
        <p className="text-[12px] text-muted-foreground mt-1">مقارنة الخدمات الأكثر طلباً من بيانات الطلبات المكتملة</p>
      </div>

      <div className="relative z-10 h-[300px]">
        {isMounted && topSvcs.length > 0 ? (
          <ReactECharts option={option} style={{ height: "100%", width: "100%" }} opts={{ renderer: "canvas" }} notMerge lazyUpdate />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            لا توجد بيانات أداء خدمات بعد.
          </div>
        )}
      </div>
    </Card>
  );
}
