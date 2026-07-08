// Izvoz KPO knjige u .xlsx (zvanični Obrazac KPO) preko exceljs.

import ExcelJS from "exceljs";
import { paraToRsd } from "@/lib/money";
import { KPO_TITLE, opisKnjizenja, type KpoExportData } from "@/lib/kpo-export";

const NUM_FMT = "#,##0.00"; // Excel lokalizuje u 1.500,00 pod sr podešavanjima

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

export async function buildKpoExcel(data: KpoExportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`KPO ${data.godina}`);
  ws.columns = [
    { width: 8 },
    { width: 60 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
  ];

  // Header polja obrasca (redovi 1–6): labela u A, vrednost merged B:E
  const headerFields: [string, string][] = [
    ["PIB:", data.company.pib ?? ""],
    ["Obveznik:", data.obveznik],
    ["Firma-radnje:", data.company.naziv],
    ["Sedište (adresa):", data.company.adresa ?? ""],
    ["Šifra poreskog obveznika:", ""],
    ["Šifra delatnosti:", data.company.sifraDelatnosti ?? ""],
  ];
  headerFields.forEach(([label, value], i) => {
    const row = ws.getRow(i + 1);
    row.getCell(1).value = label;
    row.getCell(2).value = value;
    ws.mergeCells(i + 1, 2, i + 1, 5);
  });

  // Naslov (red 8, merged A:E)
  ws.mergeCells("A8:E8");
  const title = ws.getCell("A8");
  title.value = `${KPO_TITLE} — ${data.godina}.`;
  title.font = { bold: true };
  title.alignment = { horizontal: "center" };

  // Header tabele (redovi 10–11): spojen "PRIHOD OD DELATNOSTI" nad kolonama 3–4
  ws.mergeCells("A10:A11");
  ws.getCell("A10").value = "Redni broj";
  ws.mergeCells("B10:B11");
  ws.getCell("B10").value = "Datum i opis knjiženja";
  ws.mergeCells("C10:D10");
  ws.getCell("C10").value = "PRIHOD OD DELATNOSTI";
  ws.getCell("C11").value = "od prodaje proizvoda";
  ws.getCell("D11").value = "od izvršenih usluga";
  ws.mergeCells("E10:E11");
  ws.getCell("E10").value = "SVEGA PRIHODI OD DELATNOSTI (3+4)";

  for (let r = 10; r <= 11; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 5; c++) {
      row.getCell(c).alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    }
  }
  ws.getRow(10).font = { bold: true };
  ws.getRow(11).font = { bold: true };

  // Podaci (od reda 13) — pravi brojevi u dinarima, prihod 0 = prazna ćelija
  for (const kpoRow of data.rows) {
    const row = ws.addRow([
      kpoRow.redniBroj,
      opisKnjizenja(kpoRow),
      kpoRow.prihodProizvodi ? paraToRsd(kpoRow.prihodProizvodi) : null,
      kpoRow.prihodUsluge ? paraToRsd(kpoRow.prihodUsluge) : null,
      paraToRsd(kpoRow.svega),
    ]);
    row.getCell(1).alignment = { horizontal: "center", vertical: "top" };
    row.getCell(2).alignment = { wrapText: true, vertical: "top" };
    for (const c of [3, 4, 5]) {
      row.getCell(c).numFmt = NUM_FMT;
    }
  }

  // Totals red: "SVEGA:" merged A:B
  const totalsRow = ws.addRow([
    "SVEGA:",
    null,
    paraToRsd(data.totals.proizvodi),
    paraToRsd(data.totals.usluge),
    paraToRsd(data.totals.svega),
  ]);
  ws.mergeCells(totalsRow.number, 1, totalsRow.number, 2);
  totalsRow.font = { bold: true };
  for (const c of [3, 4, 5]) {
    totalsRow.getCell(c).numFmt = NUM_FMT;
  }

  // Tanki borderi na celom opsegu tabele
  for (let r = 10; r <= totalsRow.number; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 5; c++) {
      row.getCell(c).border = THIN_BORDER;
    }
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
