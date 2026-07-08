import type { KpoEntry, Client } from "@prisma/client";

export type KpoEntryWithClient = KpoEntry & { client: Client | null };

/** Jedan izračunat red KPO knjige — sa rednim brojem, zbirom i kumulativom. */
export type KpoRow = {
  id: string;
  redniBroj: number;
  datumNaplate: Date;
  brojIsprave: string | null;
  opis: string | null;
  clientId: string | null;
  clientNaziv: string | null;
  prihodProizvodi: number; // para
  prihodUsluge: number; // para
  svega: number; // para
  kumulativ: number; // para
};

/**
 * Sortira upise po datumu naplate (pa po vremenu kreiranja radi stabilnosti) i
 * računa redni broj, "svega" i kumulativni zbir. redniBroj/kumulativ se NIKAD
 * ne čuvaju u bazi — uvek se izvode ovde, pa edit/brisanje ne kvare numeraciju.
 */
export function computeKpoRows(entries: KpoEntryWithClient[]): KpoRow[] {
  const sorted = [...entries].sort((a, b) => {
    const d = a.datumNaplate.getTime() - b.datumNaplate.getTime();
    if (d !== 0) return d;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  let kumulativ = 0;
  return sorted.map((e, i) => {
    const svega = e.prihodProizvodi + e.prihodUsluge;
    kumulativ += svega;
    return {
      id: e.id,
      redniBroj: i + 1,
      datumNaplate: e.datumNaplate,
      brojIsprave: e.brojIsprave,
      opis: e.opis,
      clientId: e.clientId,
      clientNaziv: e.client?.naziv ?? null,
      prihodProizvodi: e.prihodProizvodi,
      prihodUsluge: e.prihodUsluge,
      svega,
      kumulativ,
    };
  });
}

export type KpoTotals = {
  proizvodi: number;
  usluge: number;
  svega: number;
};

export function sumKpoRows(rows: KpoRow[]): KpoTotals {
  return rows.reduce<KpoTotals>(
    (acc, r) => ({
      proizvodi: acc.proizvodi + r.prihodProizvodi,
      usluge: acc.usluge + r.prihodUsluge,
      svega: acc.svega + r.svega,
    }),
    { proizvodi: 0, usluge: 0, svega: 0 }
  );
}

export type MesecniPromet = {
  mesec: number; // 1-12
  svega: number; // para
};

/** Grupiše "svega" po mesecu (1-12), uvek vraća svih 12 meseci — i one bez prometa. */
export function groupKpoByMonth(rows: KpoRow[]): MesecniPromet[] {
  const perMesec = new Array<number>(12).fill(0);
  for (const row of rows) {
    perMesec[row.datumNaplate.getMonth()] += row.svega;
  }
  return perMesec.map((svega, i) => ({ mesec: i + 1, svega }));
}
