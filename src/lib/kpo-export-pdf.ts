// Izvoz KPO knjige u .pdf (zvanični Obrazac KPO) preko pdfmake 0.3.
// Roboto iz pdfmake vfs-a pokriva š đ č ć ž — bez ručnog embedovanja fontova.

import pdfmake from "pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import { formatAmount } from "@/lib/money";
import { KPO_TITLE, opisKnjizenja, type KpoExportData } from "@/lib/kpo-export";

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

export function buildKpoPdf(data: KpoExportData): Promise<Buffer> {
  ensureFonts();

  const num = (para: number) => ({
    text: para ? formatAmount(para) : "",
    alignment: "right",
  });

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 40, 40, 50] as [number, number, number, number],
    defaultStyle: { font: "Roboto", fontSize: 9 },
    info: { title: `KPO ${data.company.naziv} ${data.godina}` },
    content: [
      {
        stack: [
          `PIB: ${data.company.pib ?? ""}`,
          `Obveznik: ${data.obveznik}`,
          `Firma-radnje: ${data.company.naziv}`,
          `Sedište (adresa): ${data.company.adresa ?? ""}`,
          "Šifra poreskog obveznika:",
          `Šifra delatnosti: ${data.company.sifraDelatnosti ?? ""}`,
        ],
        lineHeight: 1.3,
        margin: [0, 0, 0, 14],
      },
      { text: KPO_TITLE, bold: true, fontSize: 11, alignment: "center" },
      {
        text: `za ${data.godina}. godinu`,
        alignment: "center",
        margin: [0, 2, 0, 12],
      },
      {
        table: {
          headerRows: 2, // header se ponavlja pri prelomu strane
          widths: [30, "*", 65, 65, 75],
          body: [
            [
              { text: "Redni broj", rowSpan: 2, alignment: "center", bold: true },
              {
                text: "Datum i opis knjiženja",
                rowSpan: 2,
                alignment: "center",
                bold: true,
              },
              {
                text: "PRIHOD OD DELATNOSTI",
                colSpan: 2,
                alignment: "center",
                bold: true,
              },
              {},
              {
                text: "SVEGA PRIHODI OD DELATNOSTI (3+4)",
                rowSpan: 2,
                alignment: "center",
                bold: true,
              },
            ],
            [
              {},
              {},
              { text: "od prodaje proizvoda", alignment: "center", bold: true },
              { text: "od izvršenih usluga", alignment: "center", bold: true },
              {},
            ],
            ...data.rows.map((row) => [
              { text: String(row.redniBroj), alignment: "center" },
              { text: opisKnjizenja(row) },
              num(row.prihodProizvodi),
              num(row.prihodUsluge),
              { text: formatAmount(row.svega), alignment: "right" },
            ]),
            [
              { text: "SVEGA:", colSpan: 2, bold: true },
              {},
              { ...num(data.totals.proizvodi), bold: true },
              { ...num(data.totals.usluge), bold: true },
              {
                text: formatAmount(data.totals.svega),
                alignment: "right",
                bold: true,
              },
            ],
          ],
        },
      },
      {
        columns: [
          { text: "Sastavio: ______________________" },
          {
            text: "Odgovorno lice: ______________________",
            alignment: "right",
          },
        ],
        margin: [0, 30, 0, 0],
      },
    ],
  };

  return pdfmake.createPdf(docDefinition).getBuffer();
}
