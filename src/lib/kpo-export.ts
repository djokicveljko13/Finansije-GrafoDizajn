// Deljeni tipovi i pomoćne funkcije za izvoz KPO knjige (Excel + PDF).
// Izvoz prati zvanični Obrazac KPO: 5 kolona, kolona 2 spaja datum + klijenta.

import { format } from "date-fns";
import type { KpoRow, KpoTotals } from "@/lib/kpo";

export const KPO_TITLE =
  "KNJIGA O OSTVARENOM PROMETU PAUŠALNO OPOREZOVANIH OBVEZNIKA";

export type KpoExportData = {
  company: {
    naziv: string;
    pib: string | null;
    adresa: string | null;
    sifraDelatnosti: string | null;
  };
  obveznik: string; // ime i prezime poreskog obveznika (User.name)
  godina: number;
  rows: KpoRow[];
  totals: KpoTotals;
};

/** Kolona 2 obrasca: "15.03.2026. Klijent DOO" */
export function opisKnjizenja(row: KpoRow): string {
  const datum = format(row.datumNaplate, "dd.MM.yyyy.");
  return row.clientNaziv ? `${datum} ${row.clientNaziv}` : datum;
}

const COMBINING_MARKS = /[̀-ͯ]/g;

/** ASCII slug za ime fajla; đ/Đ se mapira ručno jer NFD ne dekomponuje đ. */
export function slugifyNaziv(naziv: string): string {
  return (
    naziv
      .replace(/đ/g, "dj")
      .replace(/Đ/g, "Dj")
      .normalize("NFD")
      .replace(COMBINING_MARKS, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "firma"
  );
}
