"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface WeeklyPerformancePoint {
  day: string;
  orders: number;
  revenue: number;
}

interface WeeklyPerformanceChartProps {
  data: WeeklyPerformancePoint[];
}

export function WeeklyPerformanceChart({ data }: WeeklyPerformanceChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const option = {
    backgroundColor: "transparent",
    tooltip: {
      backgroundColor: "rgba(13, 9, 22, 0.97)",
      borderColor: "rgba(143,92,177,0.35)",
      borderWidth: 1,
      padding: [12, 16] as [number, number],
      textStyle: { color: "#cbd5e1", fontSize: 12, fontFamily: "IBM Plex Sans Arabic" },
      extraCssText: "box-shadow: 0 8px 32px rgba(0,0,0,0.5); border-radius: 12px;",
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(143,92,177,0.03)" } },
    },
    legend: {
      data: ["عدد الطلبات", "الإيرادات"],
      textStyle: { color: "#64748b", fontSize: 10, fontFamily: "IBM Plex Sans Arabic" },
      top: 0,
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 6,
    },
    grid: { top: 35, right: 10, bottom: 20, left: 10, containLabel: true },
    xAxis: {
      type: "category",
      data: data.map((item) => item.day),
      axisLabel: { color: "#64748b", fontSize: 10, fontFamily: "IBM Plex Sans Arabic" },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value",
        name: "طلب",
        nameTextStyle: { color: "#475569", fontSize: 10 },
        axisLabel: { color: "#64748b", fontSize: 10 },
        splitLine: { lineStyle: { color: "rgba(143,92,177,0.06)", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      {
        type: "value",
        name: "ل.س",
        nameTextStyle: { color: "#475569", fontSize: 10 },
        axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
      },
    ],
    series: [
      {
        name: "عدد الطلبات",
        type: "bar",
        data: data.map((item) => item.orders),
        itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#a57ed8" }, { offset: 1, color: "rgba(165,126,216,0.2)" }] }, borderRadius: [4, 4, 0, 0] },
        barWidth: "20%",
      },
      {
        name: "الإيرادات",
        type: "bar",
        yAxisIndex: 1,
        data: data.map((item) => item.revenue),
        itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#10b981" }, { offset: 1, color: "rgba(16,185,129,0.2)" }] }, borderRadius: [4, 4, 0, 0] },
        barWidth: "20%",
      },
    ],
  };

  return (
    <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/40 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="mb-4 relative z-10">
        <h3 className="font-bold text-white text-sm tracking-tight">نظرة عامة على الأداء الأسبوعي</h3>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">الطلبات المكتملة وإيرادات آخر سبعة أيام من بياناتك الفعلية</p>
      </div>
      <div className="h-56 relative z-10">
        {data.length > 0 ? (
          <ReactECharts option={option} style={{ height: "100%", width: "100%" }} opts={{ renderer: "canvas" }} notMerge lazyUpdate />
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">لا توجد بيانات أداء أسبوعية بعد.</div>
        )}
      </div>
    </Card>
  );
}
