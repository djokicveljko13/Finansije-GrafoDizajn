"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rsdToPara } from "@/lib/money";

// prihodProizvodi/prihodUsluge su Int kolone (32-bit) — veće vrednosti padaju tek pri čitanju.
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

export type KpoFormState = { error?: string } | undefined;

export async function createKpoEntry(
  companyId: string,
  _prevState: KpoFormState,
  formData: FormData
): Promise<KpoFormState> {
  await assertOwnsCompany(companyId);

  const datumNaplateRaw = formData.get("datumNaplate");
  const brojIsprave = (formData.get("brojIsprave") as string | null)?.trim() || null;
  const opis = (formData.get("opis") as string | null)?.trim() || null;
  const clientNaziv = (formData.get("clientNaziv") as string | null)?.trim();
  const prihodProizvodiRaw = formData.get("prihodProizvodi") as string | null;
  const prihodUslugeRaw = formData.get("prihodUsluge") as string | null;

  if (typeof datumNaplateRaw !== "string" || !datumNaplateRaw) {
    return { error: "Datum naplate je obavezan." };
  }
  const datumNaplate = new Date(datumNaplateRaw);
  if (Number.isNaN(datumNaplate.getTime())) {
    return { error: "Neispravan datum naplate." };
  }

  const prihodProizvodi = rsdToPara(prihodProizvodiRaw || "0");
  const prihodUsluge = rsdToPara(prihodUslugeRaw || "0");
  if (prihodProizvodi === 0 && prihodUsluge === 0) {
    return { error: "Unesite prihod od proizvoda ili usluga." };
  }
  if (!validPara(prihodProizvodi) || !validPara(prihodUsluge)) {
    return { error: "Iznos je prevelik." };
  }

  let clientId: string | null = null;
  if (clientNaziv) {
    const existing = await prisma.client.findFirst({
      where: { companyId, naziv: clientNaziv },
    });
    clientId = existing
      ? existing.id
      : (await prisma.client.create({ data: { companyId, naziv: clientNaziv } })).id;
  }

  await prisma.kpoEntry.create({
    data: {
      companyId,
      godina: datumNaplate.getFullYear(),
      datumNaplate,
      brojIsprave,
      opis,
      clientId,
      prihodProizvodi,
      prihodUsluge,
    },
  });

  revalidatePath(`/firma/${companyId}`);
  return undefined;
}

export async function deleteKpoEntry(companyId: string, entryId: string) {
  await assertOwnsCompany(companyId);
  await prisma.kpoEntry.deleteMany({ where: { id: entryId, companyId } });
  revalidatePath(`/firma/${companyId}`);
}

export type KpoEditableField =
  | "datumNaplate"
  | "brojIsprave"
  | "opis"
  | "clientNaziv"
  | "prihodProizvodi"
  | "prihodUsluge";

export type KpoUpdateResult = { error?: string };

export async function updateKpoEntry(
  companyId: string,
  entryId: string,
  field: KpoEditableField,
  value: string
): Promise<KpoUpdateResult> {
  await assertOwnsCompany(companyId);
  const entry = await prisma.kpoEntry.findFirst({ where: { id: entryId, companyId } });
  if (!entry) return { error: "Upis nije pronađen." };

  switch (field) {
    case "datumNaplate": {
      const datumNaplate = new Date(value);
      if (!value || Number.isNaN(datumNaplate.getTime())) {
        return { error: "Neispravan datum naplate." };
      }
      await prisma.kpoEntry.update({
        where: { id: entryId },
        data: { datumNaplate, godina: datumNaplate.getFullYear() },
      });
      break;
    }
    case "brojIsprave":
      await prisma.kpoEntry.update({
        where: { id: entryId },
        data: { brojIsprave: value.trim() || null },
      });
      break;
    case "opis":
      await prisma.kpoEntry.update({
        where: { id: entryId },
        data: { opis: value.trim() || null },
      });
      break;
    case "clientNaziv": {
      const naziv = value.trim();
      let clientId: string | null = null;
      if (naziv) {
        const existing = await prisma.client.findFirst({ where: { companyId, naziv } });
        clientId = existing
          ? existing.id
          : (await prisma.client.create({ data: { companyId, naziv } })).id;
      }
      await prisma.kpoEntry.update({ where: { id: entryId }, data: { clientId } });
      break;
    }
    case "prihodProizvodi": {
      const prihodProizvodi = rsdToPara(value || "0");
      if (!validPara(prihodProizvodi)) return { error: "Iznos je prevelik." };
      await prisma.kpoEntry.update({ where: { id: entryId }, data: { prihodProizvodi } });
      break;
    }
    case "prihodUsluge": {
      const prihodUsluge = rsdToPara(value || "0");
      if (!validPara(prihodUsluge)) return { error: "Iznos je prevelik." };
      await prisma.kpoEntry.update({ where: { id: entryId }, data: { prihodUsluge } });
      break;
    }
  }

  revalidatePath(`/firma/${companyId}`);
  return {};
}
