"use client";

import dynamic from "next/dynamic";
import { BarChart2, TrendingUp } from "lucide-react";
import { ProviderFinancialSummary } from "@/domain/entities/wallet.types";
import { Card } from "@/components/ui/card";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const KIND_LABELS: Record<string, string> = {
  earning: "أرباح الطلبات",
  withdrawal: "عمليات السحب",
  credit: "إضافات الرصيد",
  debit: "خصومات الرصيد",
  other: "عمليات أخرى",
};

const COLORS = ["#10b981", "#f59e0b", "#6366f1", "#f43f5e", "#94a3b8"];

export function FinanceCharts({ summary, currency }: { summary: ProviderFinancialSummary; currency: string }) {
  const trend = summary.revenueTrend;
  const breakdown = summary.breakdown;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2 p-5 bg-card/60 border-border/40 rounded-xl">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white"><TrendingUp className="size-4 text-primary" /> أرباح آخر 30 يوماً</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">صافي أرباح الطلبات المكتملة المثبتة في سجل المعاملات</p>
        </div>
        {trend.length ? (
          <ReactECharts
            option={{
              tooltip: { trigger: "axis" },
              grid: { top: 10, right: 10, bottom: 20, left: 10, containLabel: true },
              xAxis: { type: "category", data: trend.map((point) => new Date(point.date).toLocaleDateString("ar-SY", { month: "short", day: "numeric" })), axisLabel: { color: "#64748b", fontSize: 10 } },
              yAxis: { type: "value", axisLabel: { color: "#64748b", fontSize: 10 }, splitLine: { lineStyle: { color: "rgba(148,163,184,.1)", type: "dashed" } } },
              series: [{ type: "bar", data: trend.map((point) => point.amount), itemStyle: { color: "#10b981", borderRadius: [4, 4, 0, 0] } }],
            }}
            style={{ height: 230 }}
            opts={{ renderer: "canvas" }}
          />
        ) : (
          <div className="flex h-[230px] items-center justify-center text-xs text-muted-foreground">لا توجد أرباح مثبتة خلال آخر 30 يوماً.</div>
        )}
        <p className="text-[10px] text-muted-foreground">القيم معروضة بعملة {currency}</p>
      </Card>

      <Card className="p-5 bg-card/60 border-border/40 rounded-xl">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-white"><BarChart2 className="size-4 text-amber-400" /> توزيع العمليات</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">جميع الحركات المالية المسجلة للمحفظة</p>
        </div>
        {breakdown.length ? (
          <>
            <ReactECharts
              option={{
                tooltip: { trigger: "item" },
                series: [{ type: "pie", radius: ["55%", "82%"], data: breakdown.map((item, index) => ({ name: KIND_LABELS[item.kind] || item.kind, value: item.count, itemStyle: { color: COLORS[index % COLORS.length] } })), label: { show: false } }],
              }}
              style={{ height: 165 }}
              opts={{ renderer: "canvas" }}
            />
            <div className="space-y-2">
              {breakdown.map((item, index) => (
                <div key={item.kind} className="flex items-center gap-2 text-[11px]">
                  <span className="size-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="flex-1 text-muted-foreground">{KIND_LABELS[item.kind] || item.kind}</span>
                  <span className="font-bold text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-[230px] items-center justify-center text-center text-xs text-muted-foreground">لا توجد معاملات مسجلة بعد.</div>
        )}
      </Card>
    </div>
  );
}
