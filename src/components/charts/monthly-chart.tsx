"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/hooks/use-mounted";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/types";

const AXIS_STYLE = { fill: "var(--muted-foreground)", fontSize: 11 };

export function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  const mounted = useMounted();

  if (!mounted) return <Skeleton className="h-72 w-full" />;

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <defs>
          <linearGradient id="fillPenjualan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id="fillModal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
          width={64}
          tickFormatter={(value) => formatRupiahCompact(Number(value))}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
          formatter={(value, name) => [formatRupiah(Number(value)), String(name)]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: "var(--muted-foreground)" }}>{value}</span>}
        />
        <Bar dataKey="penjualan" name="Penjualan" fill="url(#fillPenjualan)" radius={[6, 6, 0, 0]} maxBarSize={36} />
        <Bar dataKey="modal" name="Modal" fill="url(#fillModal)" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
