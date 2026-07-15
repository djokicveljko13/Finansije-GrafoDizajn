"use client";

// Live preview fakture — HTML aproksimacija PDF-a, isti raspored kao original.
// Boje su forsirane (beli papir, crn tekst) da preview izgleda isto i u dark modu.

import { formatAmount } from "@/lib/money";
import {
  formatBrojFakture,
  formatDatumSr,
  NAPOMENA_PDV,
  NAPOMENA_PECAT,
  type FakturaPreviewData,
} from "@/lib/faktura";

export function FakturaPreview({ data }: { data: FakturaPreviewData }) {
  const { company, kupac } = data;
  const brojPrikaz = formatBrojFakture(data.broj, data.godina);

  return (
    <div className="rounded-md border bg-white p-8 text-sm text-black shadow-sm">
      {/* Zaglavlje firme */}
      <div className="border-b-2 border-black pb-3 leading-relaxed">
        <p className="text-base font-bold">{company.naziv}</p>
        {company.adresa ? <p>{company.adresa}</p> : null}
        <p>
          {company.pib ? `PIB: ${company.pib}` : ""}
          {company.pib && company.maticniBroj ? " · " : ""}
          {company.maticniBroj ? `MBR: ${company.maticniBroj}` : ""}
        </p>
        {company.racun ? <p>Račun: {company.racun}</p> : null}
        {company.telefon ? <p>Telefon: {company.telefon}</p> : null}
        {company.email ? <p>e-mail: {company.email}</p> : null}
      </div>

      {/* Naslov */}
      <p className="mt-5 text-base font-bold">RAČUN br. {brojPrikaz}</p>

      {/* Datumi levo, kupac desno */}
      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row">
        <div className="leading-relaxed">
          <p>Datum fakturisanja: {formatDatumSr(data.datum)}</p>
          <p>Mesto fakturisanja: {company.mesto ?? ""}</p>
          <p>Datum prometa dobara: {formatDatumSr(data.datum)}</p>
          <p>Mesto prometa dobara: {company.mesto ?? ""}</p>
        </div>
        <div className="min-h-24 w-full border border-black p-3 leading-relaxed sm:w-64">
          <p className="font-bold">{kupac.naziv || " "}</p>
          {kupac.adresa ? <p>{kupac.adresa}</p> : null}
          {kupac.mesto ? <p>{kupac.mesto}</p> : null}
          {kupac.pib ? <p>PIB: {kupac.pib}</p> : null}
          {kupac.maticniBroj ? <p>MB: {kupac.maticniBroj}</p> : null}
        </div>
      </div>

      {/* Tabela stavki */}
      <table className="mt-5 w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-black bg-neutral-100 p-1.5 text-center font-bold">
              NAZIV ROBE / USLUGE
            </th>
            <th className="w-16 border border-black bg-neutral-100 p-1.5 text-center font-bold">
              Jed. mere
            </th>
            <th className="w-18 border border-black bg-neutral-100 p-1.5 text-center font-bold">
              Količina
            </th>
            <th className="w-22 border border-black bg-neutral-100 p-1.5 text-center font-bold">
              Cena
            </th>
            <th className="w-24 border border-black bg-neutral-100 p-1.5 text-center font-bold">
              UKUPNO
            </th>
          </tr>
        </thead>
        <tbody>
          {data.stavke.length === 0 ? (
            <tr>
              <td className="border border-black p-1.5 text-neutral-400" colSpan={5}>
                (bez stavki)
              </td>
            </tr>
          ) : (
            data.stavke.map((s, i) => (
              <tr key={i}>
                <td className="border border-black p-1.5">{s.naziv}</td>
                <td className="border border-black p-1.5 text-center">
                  {s.jedinicaMere}
                </td>
                <td className="border border-black p-1.5 text-right tabular-nums">
                  {formatAmount(s.kolicina)}
                </td>
                <td className="border border-black p-1.5 text-right tabular-nums">
                  {formatAmount(s.cena)}
                </td>
                <td className="border border-black p-1.5 text-right tabular-nums">
                  {formatAmount(s.ukupno)}
                </td>
              </tr>
            ))
          )}
          <tr>
            <td className="border border-black p-1.5 text-right font-bold" colSpan={4}>
              UKUPAN IZNOS ZA UPLATU:
            </td>
            <td className="border border-black p-1.5 text-right font-bold tabular-nums">
              {formatAmount(data.ukupno)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Valuta */}
      <p className="mt-4">
        Valuta plaćanja: {formatDatumSr(data.valuta)} Sa pozivom na br.{brojPrikaz}.
      </p>

      {/* Napomene */}
      <div className="mt-4 leading-relaxed">
        <p className="font-bold">NAPOMENA:</p>
        <p>{NAPOMENA_PDV}</p>
        <p>{NAPOMENA_PECAT}</p>
      </div>

      {/* Potpisi */}
      <div className="mt-12 flex justify-between text-center">
        <div>
          <p>______________________</p>
          <p className="mt-1">(Fakturisao)</p>
        </div>
        <div>
          <p>______________________</p>
          <p className="mt-1">(Primio)</p>
        </div>
      </div>
    </div>
  );
}
