"use client";

import { useClientReady } from "@/application/hooks/use-client-ready";
import { Card } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(13, 9, 22, 0.7)",
  borderColor: "rgba(143,92,177,0.3)",
  borderWidth: 1,
  padding: [16, 20],
  textStyle: { color: "#e2e8f0", fontSize: 13, fontFamily: "IBM Plex Sans Arabic" },
  extraCssText: "backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);",
};

interface ChartItem {
  name: string;
  earnings: number;
  orders: number;
}

interface OverviewRevenueChartProps {
  data: ChartItem[];
}

export function OverviewRevenueChart({ data }: OverviewRevenueChartProps) {
  const isMounted = useClientReady();

  const revenueChartOption = {
    backgroundColor: "transparent",
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: "axis",
      axisPointer: {
        type: "cross",
        crossStyle: { color: "rgba(255,255,255,0.1)" },
        lineStyle: { color: "rgba(143,92,177,0.3)" },
      },
      formatter: (params: TooltipParam[]) => {
        const rev = params[0];
        const ord = params[1];
        return `<div style="min-width:180px">
          <div style="font-weight:800;color:#f8fafc;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px;margin-bottom:12px;font-size:14px;letter-spacing:0.5px">${rev?.axisValue}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:8px">
            <span style="display:flex;align-items:center;gap:8px;color:#94a3b8;font-weight:600">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:linear-gradient(135deg, #a57ed8, #8f5cb1);box-shadow:0 0 8px #a57ed8"></span>الأرباح
            </span>
            <b style="color:#e9d5ff;font-variant-numeric:tabular-nums;font-size:15px;text-shadow:0 0 10px rgba(165,126,216,0.3)">${(rev?.value || 0).toLocaleString("ar-EG")} ل.س</b>
          </div>
          ${ord ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:24px">
            <span style="display:flex;align-items:center;gap:8px;color:#94a3b8;font-weight:600">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:linear-gradient(135deg, #34d399, #10b981);box-shadow:0 0 8px #34d399"></span>الطلبات
            </span>
            <b style="color:#a7f3d0;font-variant-numeric:tabular-nums;font-size:15px;text-shadow:0 0 10px rgba(52,211,153,0.3)">${(ord?.value || 0).toLocaleString("ar-EG")} طلب</b>
          </div>` : ""}
        </div>`;
      },
    },
    legend: {
      data: ["الأرباح", "الطلبات"],
      right: 0,
      top: 0,
      textStyle: { color: "#64748b", fontSize: 11, fontFamily: "IBM Plex Sans Arabic" },
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
    },
    grid: { top: 36, right: 50, bottom: 20, left: 10, containLabel: true },
    xAxis: {
      type: "category",
      data: data.map((d) => d.name),
      axisLabel: { color: "#64748b", fontSize: 10, fontFamily: "IBM Plex Sans Arabic", margin: 12 },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value",
        name: "ل.س",
        nameTextStyle: { color: "#475569", fontSize: 10 },
        axisLabel: {
          color: "#64748b",
          fontSize: 10,
          formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v),
        },
        splitLine: { lineStyle: { color: "rgba(143,92,177,0.06)", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      {
        type: "value",
        name: "طلبات",
        nameTextStyle: { color: "#475569", fontSize: 10 },
        axisLabel: { color: "#64748b", fontSize: 10 },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
      },
    ],
    series: [
      {
        name: "الأرباح",
        type: "line",
        data: data.map((d) => d.earnings),
        smooth: 0.45,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: false,
        emphasis: { showSymbol: true },
        lineStyle: {
          color: "#a57ed8",
          width: 3,
          shadowColor: "rgba(165,126,216,0.4)",
          shadowBlur: 12,
          shadowOffsetY: 6,
        },
        itemStyle: { color: "#a57ed8", borderColor: "#0d0916", borderWidth: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(165,126,216,0.28)" },
              { offset: 0.7, color: "rgba(165,126,216,0.05)" },
              { offset: 1, color: "rgba(165,126,216,0)" },
            ],
          },
        },
      },
      {
        name: "الطلبات",
        type: "bar",
        yAxisIndex: 1,
        data: data.map((d) => d.orders),
        barWidth: "22%",
        barMaxWidth: 24,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(52,211,153,0.45)" },
              { offset: 1, color: "rgba(52,211,153,0.05)" },
            ],
          },
        },
      },
    ],
  };

  return (
    <Card className="xl:col-span-2 p-6 bg-card/40 backdrop-blur-2xl border border-border/20 shadow-2xl group relative overflow-hidden transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 relative z-10">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            نمو الأرباح والطلبات
          </h3>
          <p className="text-[12px] text-muted-foreground mt-1">
            توزيع الإيرادات وعدد الطلبات شهرياً
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-violet-400" />الأرباح
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />الطلبات
          </span>
        </div>
      </div>

      <div className="relative z-10 -mx-2 h-[300px]">
        {isMounted ? (
          <ReactECharts
            option={revenueChartOption}
            style={{ height: "100%", width: "100%" }}
            opts={{ renderer: "canvas" }}
            notMerge={true}
            lazyUpdate={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <Activity className="w-5 h-5 me-2 animate-spin" /> جاري تحميل الرسم البياني...
          </div>
        )}
      </div>
    </Card>
  );
}

interface TooltipParam {
  axisValue?: string;
  value?: number;
}
