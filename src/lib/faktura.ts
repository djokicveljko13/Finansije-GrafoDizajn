// Deljeni helperi za fakture — koriste ih i live preview (client) i PDF (server),
// pa ovde ne sme biti server-only importa. Novac je u parama, količina u stotinkama.

import { addDays, format } from "date-fns";

/** 52, 2026 -> "052/2026" */
export function formatBrojFakture(broj: number, godina: number): string {
  return `${String(broj).padStart(3, "0")}/${godina}`;
}

/** kolicina (stotinke) × cena (para) -> ukupno (para); jedno zaokruživanje po stavci. */
export function stavkaUkupno(kolicina: number, cena: number): number {
  return Math.round((kolicina * cena) / 100);
}

/** Podrazumevana valuta plaćanja: datum + 7 dana, kao ISO "yyyy-MM-dd" za date input. */
export function defaultValuta(datumIso: string): string {
  const datum = new Date(datumIso);
  if (Number.isNaN(datum.getTime())) return datumIso;
  return format(addDays(datum, 7), "yyyy-MM-dd");
}

/** Datum za prikaz na fakturi: "15.07.2026." */
export function formatDatumSr(d: Date | string): string {
  const datum = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(datum.getTime())) return "";
  return format(datum, "dd.MM.yyyy.");
}

export const NAPOMENA_PDV = "Nismo u sistemu PDV-a.";
export const NAPOMENA_PECAT =
  "Ova faktura je urađena na računaru i važeća je bez pečata i potpisa.";

// Jedan oblik podataka hrani i HTML preview i PDF — garantuje da su identični.
export type FakturaPreviewData = {
  company: {
    naziv: string;
    adresa: string | null;
    mesto: string | null;
    pib: string | null;
    maticniBroj: string | null;
    racun: string | null;
    telefon: string | null;
    email: string | null;
  };
  broj: number;
  godina: number;
  datum: Date | string;
  valuta: Date | string;
  kupac: {
    naziv: string;
    adresa: string | null;
    mesto: string | null;
    pib: string | null;
    maticniBroj: string | null;
  };
  stavke: Array<{
    naziv: string;
    jedinicaMere: string;
    kolicina: number; // stotinke
    cena: number; // para
    ukupno: number; // para
  }>;
  ukupno: number; // para
};
