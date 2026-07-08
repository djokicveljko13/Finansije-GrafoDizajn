"use client";

import { useRouter } from "next/navigation";

export function YearFilter({ years, selected }: { years: number[]; selected: number }) {
  const router = useRouter();

  return (
    <select
      value={selected}
      onChange={(e) => router.push(`?godina=${e.target.value}`)}
      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
