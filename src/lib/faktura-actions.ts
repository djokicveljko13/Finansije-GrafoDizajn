"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rsdToPara } from "@/lib/money";
import { formatBrojFakture, stavkaUkupno } from "@/lib/faktura";

// prihodUsluge/ukupno su Int kolone (32-bit) — veće vrednosti padaju tek pri čitanju.
const MAX_PARA = 2_147_483_647;

function validPara(para: number) {
  return Number.isFinite(para) && para >= 0 && para <= MAX_PARA;
}

async function assertOwnsCompany(companyId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Niste prijavljeni.");
  const company = await prisma.company.findFirst({
    where: { id: companyId, userId: session.user.id },
  });
  if (!company) throw new Error("Firma nije pronađena.");
  return company;
}

export type FakturaFormState = { error?: string } | undefined;

export async function createFaktura(
  companyId: string,
  _prevState: FakturaFormState,
  formData: FormData
): Promise<FakturaFormState> {
  await assertOwnsCompany(companyId);

  const datumRaw = formData.get("datum");
  if (typeof datumRaw !== "string" || !datumRaw) {
    return { error: "Datum fakture je obavezan." };
  }
  const datum = new Date(datumRaw);
  if (Number.isNaN(datum.getTime())) {
    return { error: "Neispravan datum fakture." };
  }

  const valutaRaw = formData.get("valuta");
  if (typeof valutaRaw !== "string" || !valutaRaw) {
    return { error: "Valuta plaćanja je obavezna." };
  }
  const valuta = new Date(valutaRaw);
  if (Number.isNaN(valuta.getTime())) {
    return { error: "Neispravna valuta plaćanja." };
  }

  const broj = Number.parseInt((formData.get("broj") as string | null) ?? "", 10);
  if (!Number.isInteger(broj) || broj < 1 || broj > 9999) {
    return { error: "Broj fakture mora biti ceo broj između 1 i 9999." };
  }

  const kupacNaziv = (formData.get("kupacNaziv") as string | null)?.trim();
  if (!kupacNaziv) {
    return { error: "Naziv kupca je obavezan." };
  }
  const kupacAdresa = (formData.get("kupacAdresa") as string | null)?.trim() || null;
  const kupacMesto = (formData.get("kupacMesto") as string | null)?.trim() || null;
  const kupacPib = (formData.get("kupacPib") as string | null)?.trim() || null;
  const kupacMaticniBroj =
    (formData.get("kupacMaticniBroj") as string | null)?.trim() || null;

  // Stavke stižu kao paralelni nizovi (svaki red forme ponavlja ista name polja).
  const nazivi = formData.getAll("stavkaNaziv").map((v) => String(v).trim());
  const jedinice = formData.getAll("stavkaJedinica").map((v) => String(v).trim());
  const kolicine = formData.getAll("stavkaKolicina").map((v) => String(v));
  const cene = formData.getAll("stavkaCena").map((v) => String(v));

  const stavke: Array<{
    naziv: string;
    jedinicaMere: string;
    kolicina: number;
    cena: number;
    ukupno: number;
  }> = [];

  for (let i = 0; i < nazivi.length; i++) {
    const naziv = nazivi[i];
    const kolicina = rsdToPara(kolicine[i] || "0");
    const cena = rsdToPara(cene[i] || "0");
    if (!naziv && kolicina === 0 && cena === 0) continue; // potpuno prazan red
    if (!naziv) {
      return { error: `Stavka ${i + 1}: naziv je obavezan.` };
    }
    if (kolicina <= 0) {
      return { error: `Stavka "${naziv}": količina mora biti veća od nule.` };
    }
    if (!validPara(cena)) {
      return { error: `Stavka "${naziv}": cena je neispravna ili prevelika.` };
    }
    const ukupno = stavkaUkupno(kolicina, cena);
    if (!validPara(ukupno)) {
      return { error: `Stavka "${naziv}": iznos je prevelik.` };
    }
    stavke.push({
      naziv,
      jedinicaMere: jedinice[i] || "kom",
      kolicina,
      cena,
      ukupno,
    });
  }

  if (stavke.length === 0) {
    return { error: "Dodajte bar jednu stavku." };
  }
  const ukupno = stavke.reduce((sum, s) => sum + s.ukupno, 0);
  if (ukupno <= 0) {
    return { error: "Ukupan iznos fakture mora biti veći od nule." };
  }
  if (!validPara(ukupno)) {
    return { error: "Ukupan iznos je prevelik." };
  }

  const godina = datum.getFullYear();
  const brojPrikaz = formatBrojFakture(broj, godina);

  let fakturaId: string;
  try {
    fakturaId = await prisma.$transaction(async (tx) => {
      // Kupac: nađi ili napravi klijenta; postojećem dopuni podatke koje je korisnik uneo.
      const existing = await tx.client.findFirst({
        where: { companyId, naziv: kupacNaziv },
      });
      const clientData = {
        ...(kupacPib ? { pib: kupacPib } : {}),
        ...(kupacAdresa ? { adresa: kupacAdresa } : {}),
        ...(kupacMesto ? { mesto: kupacMesto } : {}),
        ...(kupacMaticniBroj ? { maticniBroj: kupacMaticniBroj } : {}),
      };
      const client = existing
        ? await tx.client.update({ where: { id: existing.id }, data: clientData })
        : await tx.client.create({
            data: { companyId, naziv: kupacNaziv, ...clientData },
          });

      const kpoEntry = await tx.kpoEntry.create({
        data: {
          companyId,
          godina,
          datumNaplate: datum,
          brojIsprave: brojPrikaz,
          opis: stavke.map((s) => s.naziv).join(", ") || `Faktura ${brojPrikaz}`,
          clientId: client.id,
          prihodProizvodi: 0,
          prihodUsluge: ukupno, // ceo iznos fakture je prihod od usluga
        },
      });

      const faktura = await tx.faktura.create({
        data: {
          companyId,
          broj,
          godina,
          datum,
          valuta,
          kupacNaziv,
          kupacAdresa,
          kupacMesto,
          kupacPib,
          kupacMaticniBroj,
          clientId: client.id,
          ukupno,
          stavke: {
            create: stavke.map((s, redosled) => ({ ...s, redosled })),
          },
        },
      });

      await tx.kpoEntry.update({
        where: { id: kpoEntry.id },
        data: { fakturaId: faktura.id },
      });

      return faktura.id;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        error: `Faktura broj ${brojPrikaz} već postoji. Izaberite drugi broj.`,
      };
    }
    throw e;
  }

  revalidatePath(`/firma/${companyId}`);
  revalidatePath(`/firma/${companyId}/fakture`);
  redirect(`/firma/${companyId}/fakture?nova=${fakturaId}`);
}

export async function deleteFaktura(companyId: string, fakturaId: string) {
  await assertOwnsCompany(companyId);
  // Kaskade na nivou baze brišu stavke i povezani KPO upis.
  await prisma.faktura.deleteMany({ where: { id: fakturaId, companyId } });
  revalidatePath(`/firma/${companyId}`);
  revalidatePath(`/firma/${companyId}/fakture`);
}
