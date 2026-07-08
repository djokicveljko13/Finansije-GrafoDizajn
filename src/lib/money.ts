// Novac se u bazi čuva kao CEO BROJ u parama (1 RSD = 100 para).
// Ove funkcije konvertuju između para (baza) i dinara (UI/prikaz).

/** Para (int) -> broj dinara (npr. 150000 -> 1500) */
export function paraToRsd(para: number): number {
  return para / 100;
}

/** Dinari (broj/string iz forme) -> para (int). Prihvata "1.500,50" i "1500.50". */
export function rsdToPara(input: number | string): number {
  if (typeof input === "number") return Math.round(input * 100);
  const normalized = input
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "") // hiljade
    .replace(",", "."); // decimalni zarez -> tačka
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

const rsdFormatter = new Intl.NumberFormat("sr-RS", {
  style: "currency",
  currency: "RSD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("sr-RS", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Para -> "1.500,00 RSD" */
export function formatRsd(para: number): string {
  return rsdFormatter.format(paraToRsd(para));
}

/** Para -> "1.500,00" (bez oznake valute, za tabele/export) */
export function formatAmount(para: number): string {
  return numberFormatter.format(paraToRsd(para));
}
