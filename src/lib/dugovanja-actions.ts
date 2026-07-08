"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rsdToPara } from "@/lib/money";

// iznos je Int kolona (32-bit) — veće vrednosti padaju tek pri čitanju.
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

export type DebtFormState = { error?: string } | undefined;

export async function createDebt(
  companyId: string,
  _prevState: DebtFormState,
  formData: FormData
): Promise<DebtFormState> {
  await assertOwnsCompany(companyId);

  const klijent = (formData.get("klijent") as string | null)?.trim();
  const iznosRaw = formData.get("iznos") as string | null;

  if (!klijent) {
    return { error: "Naziv klijenta je obavezan." };
  }

  const iznos = rsdToPara(iznosRaw || "0");
  if (iznos <= 0) {
    return { error: "Unesite iznos duga." };
  }
  if (!validPara(iznos)) {
    return { error: "Iznos je prevelik." };
  }

  await prisma.debt.create({
    data: { companyId, klijent, iznos },
  });

  revalidatePath(`/firma/${companyId}/dugovanja`);
  return undefined;
}

export async function deleteDebt(companyId: string, debtId: string) {
  await assertOwnsCompany(companyId);
  await prisma.debt.deleteMany({ where: { id: debtId, companyId } });
  revalidatePath(`/firma/${companyId}/dugovanja`);
}

export type PayPartialState = { error?: string } | undefined;

export async function payPartialDebt(
  companyId: string,
  debtId: string,
  _prevState: PayPartialState,
  formData: FormData
): Promise<PayPartialState> {
  await assertOwnsCompany(companyId);

  const debt = await prisma.debt.findFirst({ where: { id: debtId, companyId } });
  if (!debt) {
    return { error: "Dugovanje nije pronađeno." };
  }

  const iznosRaw = formData.get("iznos") as string | null;
  const uplata = rsdToPara(iznosRaw || "0");
  if (uplata <= 0) {
    return { error: "Unesite iznos uplate." };
  }
  if (uplata > debt.iznos) {
    return { error: "Iznos uplate ne može biti veći od preostalog duga." };
  }

  const preostalo = debt.iznos - uplata;
  if (preostalo === 0) {
    await prisma.debt.delete({ where: { id: debtId } });
  } else {
    await prisma.debt.update({ where: { id: debtId }, data: { iznos: preostalo } });
  }

  revalidatePath(`/firma/${companyId}/dugovanja`);
  return undefined;
}
