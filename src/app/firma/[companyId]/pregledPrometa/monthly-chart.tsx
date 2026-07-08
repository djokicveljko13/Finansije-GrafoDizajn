"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MesecniPromet } from "@/lib/kpo";
import { formatAmount, paraToRsd } from "@/lib/money";

const NAZIVI_MESECI = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Maj",
  "Jun",
  "Jul",
  "Avg",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

export function MonthlyChart({ data }: { data: MesecniPromet[] }) {
  const chartData = data.map((m) => ({
    naziv: NAZIVI_MESECI[m.mesec - 1],
    dinara: paraToRsd(m.svega),
    para: m.svega,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis dataKey="naziv" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(v: number) => v.toLocaleString("sr-RS")}
            width={70}
          />
          <Tooltip
            formatter={(_value, _name, item) => [
              formatAmount((item.payload as { para: number }).para) + " RSD",
              "Promet",
            ]}
            labelFormatter={(label) => label}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="dinara" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
