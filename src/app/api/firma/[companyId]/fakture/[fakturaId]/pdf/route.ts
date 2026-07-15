// GET /api/firma/[companyId]/fakture/[fakturaId]/pdf
// Skida fakturu (račun) kao PDF, isti raspored kao live preview.

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugifyNaziv } from "@/lib/kpo-export";
import { buildFakturaPdf } from "@/lib/faktura-pdf";
import type { FakturaPreviewData } from "@/lib/faktura";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ companyId: string; fakturaId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Niste prijavljeni.", { status: 401 });
  }

  const { companyId, fakturaId } = await params;
  const company = await prisma.company.findFirst({
    where: { id: companyId, userId: session.user.id },
  });
  if (!company) {
    return new Response("Firma nije pronađena.", { status: 404 });
  }

  const faktura = await prisma.faktura.findFirst({
    where: { id: fakturaId, companyId },
    include: { stavke: { orderBy: { redosled: "asc" } } },
  });
  if (!faktura) {
    return new Response("Faktura nije pronađena.", { status: 404 });
  }

  const data: FakturaPreviewData = {
    company: {
      naziv: company.naziv,
      adresa: company.adresa,
      mesto: company.mesto,
      pib: company.pib,
      maticniBroj: company.maticniBroj,
      racun: company.racun,
      telefon: company.telefon,
      email: company.email,
    },
    broj: faktura.broj,
    godina: faktura.godina,
    datum: faktura.datum,
    valuta: faktura.valuta,
    kupac: {
      naziv: faktura.kupacNaziv,
      adresa: faktura.kupacAdresa,
      mesto: faktura.kupacMesto,
      pib: faktura.kupacPib,
      maticniBroj: faktura.kupacMaticniBroj,
    },
    stavke: faktura.stavke.map((s) => ({
      naziv: s.naziv,
      jedinicaMere: s.jedinicaMere,
      kolicina: s.kolicina,
      cena: s.cena,
      ukupno: s.ukupno,
    })),
    ukupno: faktura.ukupno,
  };

  const buffer = await buildFakturaPdf(data);
  const filename = `Faktura-${String(faktura.broj).padStart(3, "0")}-${faktura.godina}-${slugifyNaziv(company.naziv)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
