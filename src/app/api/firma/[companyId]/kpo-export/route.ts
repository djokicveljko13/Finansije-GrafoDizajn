// GET /api/firma/[companyId]/kpo-export?godina=2026&format=xlsx|pdf
// Skida KPO knjigu izabrane godine kao zvanični Obrazac KPO.

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeKpoRows, sumKpoRows } from "@/lib/kpo";
import { slugifyNaziv, type KpoExportData } from "@/lib/kpo-export";
import { buildKpoExcel } from "@/lib/kpo-export-excel";
import { buildKpoPdf } from "@/lib/kpo-export-pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Niste prijavljeni.", { status: 401 });
  }

  const { companyId } = await params;
  const company = await prisma.company.findFirst({
    where: { id: companyId, userId: session.user.id },
    include: { user: { select: { name: true } } },
  });
  if (!company) {
    return new Response("Firma nije pronađena.", { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const godina = Number(searchParams.get("godina"));
  const format = searchParams.get("format");
  if (!Number.isInteger(godina) || godina < 1900 || godina > 2200) {
    return new Response("Neispravna godina.", { status: 400 });
  }
  if (format !== "xlsx" && format !== "pdf") {
    return new Response("Neispravan format.", { status: 400 });
  }

  const entries = await prisma.kpoEntry.findMany({
    where: { companyId, godina },
    include: { client: true },
  });
  const rows = computeKpoRows(entries);
  const data: KpoExportData = {
    company,
    obveznik: company.user.name ?? "",
    godina,
    rows,
    totals: sumKpoRows(rows),
  };

  const buffer =
    format === "xlsx" ? await buildKpoExcel(data) : await buildKpoPdf(data);
  const filename = `KPO-${slugifyNaziv(company.naziv)}-${godina}.${format}`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
