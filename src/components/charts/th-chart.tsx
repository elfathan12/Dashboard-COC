"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/hooks/use-mounted";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ThPoint } from "@/lib/types";

const AXIS_STYLE = { fill: "var(--muted-foreground)", fontSize: 11 };

export function ThChart({ data }: { data: ThPoint[] }) {
  const mounted = useMounted();

  if (!mounted) return <Skeleton className="h-72 w-full" />;

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="th" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
          formatter={(value) => [String(value), ""]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: "var(--muted-foreground)" }}>{value}</span>}
        />
        <Bar dataKey="terjual" name="Terjual" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={36} />
        <Bar dataKey="belumLaku" name="Belum Laku" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
