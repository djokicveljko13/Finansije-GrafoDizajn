// PDF fakture (računa) preko pdfmake 0.3 — isti raspored kao live preview,
// oba se grade iz istog FakturaPreviewData oblika.
// Roboto iz pdfmake vfs-a pokriva š đ č ć ž — bez ručnog embedovanja fontova.

import pdfmake from "pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import { formatAmount } from "@/lib/money";
import {
  formatBrojFakture,
  formatDatumSr,
  NAPOMENA_PDV,
  NAPOMENA_PECAT,
  type FakturaPreviewData,
} from "@/lib/faktura";

let fontsReady = false;

function ensureFonts() {
  if (fontsReady) return;
  for (const name of Object.keys(vfsFonts)) {
    pdfmake.virtualfs.writeFileSync(name, Buffer.from(vfsFonts[name], "base64"));
  }
  pdfmake.setFonts({
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Medium.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-MediumItalic.ttf",
    },
  });
  // Dokument se gradi isključivo iz naših podataka — zabrani mrežu i lokalni fs.
  pdfmake.setUrlAccessPolicy(() => false);
  pdfmake.setLocalAccessPolicy(() => false);
  fontsReady = true;
}

export function buildFakturaPdf(data: FakturaPreviewData): Promise<Buffer> {
  ensureFonts();

  const { company, kupac } = data;
  const brojPrikaz = formatBrojFakture(data.broj, data.godina);

  const hdr = (text: string) => ({
    text,
    bold: true,
    alignment: "center",
    fillColor: "#eeeeee",
  });
  const num = (para: number) => ({
    text: formatAmount(para),
    alignment: "right",
  });

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 50] as [number, number, number, number],
    defaultStyle: { font: "Roboto", fontSize: 9 },
    info: { title: `Faktura ${brojPrikaz} — ${company.naziv}` },
    content: [
      // Zaglavlje firme
      {
        stack: [
          { text: company.naziv, bold: true, fontSize: 13 },
          company.adresa ?? "",
          [
            company.pib ? `PIB: ${company.pib}` : "",
            company.maticniBroj ? `MBR: ${company.maticniBroj}` : "",
          ]
            .filter(Boolean)
            .join("   "),
          company.racun ? `Račun: ${company.racun}` : "",
          company.telefon ? `Telefon: ${company.telefon}` : "",
          company.email ? `e-mail: ${company.email}` : "",
        ].filter(Boolean),
        lineHeight: 1.3,
      },
      // Debela linija ispod zaglavlja (kao na originalu)
      {
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5 },
        ],
        margin: [0, 8, 0, 18] as [number, number, number, number],
      },
      // Naslov
      {
        text: `RAČUN br. ${brojPrikaz}`,
        bold: true,
        fontSize: 12,
        margin: [0, 0, 0, 14] as [number, number, number, number],
      },
      // Datumi levo + kupac desno (boks = tabela sa jednom ćelijom)
      {
        columns: [
          {
            width: "*",
            stack: [
              `Datum fakturisanja: ${formatDatumSr(data.datum)}`,
              `Mesto fakturisanja: ${company.mesto ?? ""}`,
              `Datum prometa dobara: ${formatDatumSr(data.datum)}`,
              `Mesto prometa dobara: ${company.mesto ?? ""}`,
            ],
            lineHeight: 1.4,
          },
          {
            width: 220,
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    stack: [
                      { text: kupac.naziv, bold: true },
                      kupac.adresa ?? "",
                      kupac.mesto ?? "",
                      kupac.pib ? `PIB: ${kupac.pib}` : "",
                      kupac.maticniBroj ? `MB: ${kupac.maticniBroj}` : "",
                    ].filter(Boolean),
                    lineHeight: 1.3,
                    margin: [6, 6, 6, 6] as [number, number, number, number],
                  },
                ],
              ],
            },
          },
        ],
        columnGap: 20,
        margin: [0, 0, 0, 18] as [number, number, number, number],
      },
      // Tabela stavki
      {
        table: {
          headerRows: 1,
          widths: ["*", 55, 55, 70, 80],
          body: [
            [
              hdr("NAZIV ROBE / USLUGE"),
              hdr("Jed. mere"),
              hdr("Količina"),
              hdr("Cena"),
              hdr("UKUPNO"),
            ],
            ...data.stavke.map((s) => [
              s.naziv,
              { text: s.jedinicaMere, alignment: "center" },
              num(s.kolicina),
              num(s.cena),
              num(s.ukupno),
            ]),
            [
              {
                text: "UKUPAN IZNOS ZA UPLATU:",
                colSpan: 4,
                bold: true,
                alignment: "right",
              },
              {},
              {},
              {},
              { ...num(data.ukupno), bold: true },
            ],
          ],
        },
      },
      // Valuta plaćanja
      {
        text: `Valuta plaćanja: ${formatDatumSr(data.valuta)} Sa pozivom na br.${brojPrikaz}.`,
        margin: [0, 14, 0, 0] as [number, number, number, number],
      },
      // Napomene
      {
        stack: [{ text: "NAPOMENA:", bold: true }, NAPOMENA_PDV, NAPOMENA_PECAT],
        lineHeight: 1.3,
        margin: [0, 14, 0, 0] as [number, number, number, number],
      },
      // Potpisi
      {
        columns: [
          {
            width: 180,
            stack: [
              "______________________________",
              { text: "(Fakturisao)", alignment: "center", margin: [0, 2, 0, 0] },
            ],
          },
          { width: "*", text: "" },
          {
            width: 180,
            stack: [
              "______________________________",
              { text: "(Primio)", alignment: "center", margin: [0, 2, 0, 0] },
            ],
          },
        ],
        margin: [0, 50, 0, 0] as [number, number, number, number],
      },
    ],
  };

  return pdfmake.createPdf(docDefinition).getBuffer();
}
