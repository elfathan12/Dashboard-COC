"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useMounted } from "@/hooks/use-mounted";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  sold: "#10b981",
  unsold: "#f59e0b",
};

interface StatusDatum {
  name: string;
  key: string;
  value: number;
}

export function StatusChart({ data }: { data: StatusDatum[] }) {
  const mounted = useMounted();
  const total = data.reduce((acc, item) => acc + item.value, 0);

  if (!mounted) return <Skeleton className="h-72 w-full" />;

  if (total === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        Belum ada data untuk ditampilkan
      </div>
    );
  }

  return (
    <div className="flex h-72 flex-col items-center justify-center">
      <div className="relative w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={4}
              stroke="none"
            >
              {data.map((item) => (
                <Cell key={item.key} fill={COLORS[item.key] ?? "#8b5cf6"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value, name) => [`${value} akun`, String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
          <span className="text-xs text-muted-foreground">Total Akun</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 pb-2">
        {data.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: COLORS[item.key] ?? "#8b5cf6" }}
            />
            <span className="text-xs text-muted-foreground">
              {item.name}{" "}
              <span className="text-foreground tabular-nums">{item.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
