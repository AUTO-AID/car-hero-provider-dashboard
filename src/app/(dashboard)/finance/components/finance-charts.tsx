"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, BarChart2 } from "lucide-react";
import { Transaction } from "@/domain/entities/wallet.types";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(13, 9, 22, 0.97)",
  borderColor: "rgba(143,92,177,0.35)",
  borderWidth: 1,
  padding: [12, 16] as [number, number],
  textStyle: { color: "#cbd5e1", fontSize: 12, fontFamily: "IBM Plex Sans Arabic" },
};

interface FinanceChartsProps {
  transactions: Transaction[];
  totalEarnings: number;
}

export function FinanceCharts({ transactions, totalEarnings }: FinanceChartsProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const recentTransactions = transactions.slice(0, 8).reverse();
  const revenueLabels = recentTransactions.map((tx) => {
    const date = tx.createdAt ? new Date(tx.createdAt) : null;
    return date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString("ar-SY", { month: "short", day: "numeric" })
      : "غير محدد";
  });
  const earningCount = transactions.filter((tx: Transaction) => tx.type === "earning").length;
  const depositCount = transactions.filter((tx: Transaction) => tx.type === "deposit").length;
  const withdrawalCount = transactions.filter((tx: Transaction) => tx.type === "withdrawal").length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 📊 Revenue Trend - Area Chart */}
      <Card className="lg:col-span-2 p-6 bg-card/60 backdrop-blur-xl border-border/40 shadow-xl shadow-black/20 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> مسار الأرباح الشهري
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">الإيرادات المتحققة من الطلبات المكتملة</p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[11px] font-bold">
            {(totalEarnings || 0).toLocaleString()} ل.س إجمالي
          </span>
        </div>
        <ReactECharts
          option={{
            backgroundColor: "transparent",
            tooltip: {
              ...TOOLTIP_STYLE,
              trigger: "axis",
              formatter: (params: any[]) => {
                const p = params[0];
                return `<div><b style="color:#f5f5f7">${p.axisValue}</b><br/><span style="color:#c9a7e3">${(
                  p.value || 0
                ).toLocaleString("ar-EG")} ل.س</span></div>`;
              },
            },
            grid: { top: 10, right: 10, bottom: 20, left: 10, containLabel: true },
            xAxis: {
              type: "category",
              data: revenueLabels,
              axisLabel: { color: "#64748b", fontSize: 10, fontFamily: "IBM Plex Sans Arabic" },
              axisLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
              axisTick: { show: false },
            },
            yAxis: {
              type: "value",
              axisLabel: {
                color: "#64748b",
                fontSize: 10,
                formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v),
              },
              splitLine: { lineStyle: { color: "rgba(143,92,177,0.06)", type: "dashed" } },
              axisLine: { show: false },
              axisTick: { show: false },
            },
            series: [
              {
                type: "line",
                data: recentTransactions.map((tx: Transaction) => tx.amount || 0),
                smooth: 0.45,
                showSymbol: false,
                emphasis: { showSymbol: true, itemStyle: { color: "#a57ed8" } },
                lineStyle: { color: "#a57ed8", width: 3, shadowColor: "rgba(165,126,216,0.35)", shadowBlur: 12 },
                itemStyle: { color: "#a57ed8", borderColor: "#0d0916", borderWidth: 2 },
                areaStyle: {
                  color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: "rgba(165,126,216,0.3)" },
                      { offset: 0.7, color: "rgba(165,126,216,0.05)" },
                      { offset: 1, color: "rgba(165,126,216,0)" },
                    ],
                  },
                },
              },
            ],
          }}
          style={{ height: 240, width: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
          lazyUpdate
        />
      </Card>

      {/* 📊 Transaction Types Donut */}
      <Card className="p-6 bg-card/60 backdrop-blur-xl border-border/40 shadow-xl shadow-black/20 relative overflow-hidden group">
        <div className="mb-4 relative z-10">
          <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" /> توزيع العمليات
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">تصنيف المعاملات المالية</p>
        </div>
        <ReactECharts
          option={{
            backgroundColor: "transparent",
            tooltip: {
              ...TOOLTIP_STYLE,
              trigger: "item",
              formatter: (p: any) =>
                `<span style="color:${p.color}">● ${p.name}</span>: <b>${p.value.toLocaleString(
                  "ar-EG"
                )}</b> (${p.percent}%)`,
            },
            legend: { show: false },
            series: [
              {
                type: "pie",
                radius: ["55%", "80%"],
                center: ["50%", "45%"],
                data: [
                  {
                    name: "أرباح طلبات",
                    value: earningCount,
                    itemStyle: { color: "#10b981", borderColor: "#0d0916", borderWidth: 3 },
                  },
                  {
                    name: "إيداع رصيد",
                    value: depositCount,
                    itemStyle: { color: "#6366f1", borderColor: "#0d0916", borderWidth: 3 },
                  },
                  {
                    name: "سحب رصيد",
                    value: withdrawalCount,
                    itemStyle: { color: "#f59e0b", borderColor: "#0d0916", borderWidth: 3 },
                  },
                ],
                label: { show: false },
                labelLine: { show: false },
                emphasis: {
                  itemStyle: { shadowBlur: 16, shadowColor: "rgba(143,92,177,0.3)" },
                  scale: true,
                  scaleSize: 6,
                },
              },
            ],
          }}
          style={{ height: 180, width: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
          lazyUpdate
        />
        <div className="space-y-2 mt-2">
          {[
            {
              label: "أرباح طلبات",
              color: "#10b981",
              val: earningCount,
            },
            {
              label: "إيداع رصيد",
              color: "#6366f1",
              val: depositCount,
            },
            {
              label: "سحب رصيد",
              color: "#f59e0b",
              val: withdrawalCount,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/30 border border-border/30"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-[10px] text-muted-foreground/80 flex-1">{item.label}</span>
              <span className="text-[11px] font-bold text-white tabular-nums">{item.val}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
