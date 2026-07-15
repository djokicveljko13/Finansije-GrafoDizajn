import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { FakturaForm } from "./faktura-form";

export default async function NovaFakturaPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { companyId } = await params;
  const company = await prisma.company.findFirst({
    where: { id: companyId, userId: session.user.id },
  });
  if (!company) {
    notFound();
  }

  const godina = new Date().getFullYear();
  const [clients, maxBroj] = await Promise.all([
    prisma.client.findMany({
      where: { companyId },
      orderBy: { naziv: "asc" },
      select: { naziv: true, pib: true, maticniBroj: true, adresa: true, mesto: true },
    }),
    prisma.faktura.aggregate({
      where: { companyId, godina },
      _max: { broj: true },
    }),
  ]);
  const predlozeniBroj = (maxBroj._max.broj ?? 0) + 1;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link href={`/firma/${companyId}`}>
              <ArrowLeft className="size-4" />
              Nazad na KPO knjigu
            </Link>
          }
        />
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Nova faktura</h1>
        <p className="text-sm text-muted-foreground">
          {company.naziv} — popunite podatke levo, desno se prikazuje faktura uživo.
          Čuvanjem se faktura automatski upisuje i u KPO knjigu.
        </p>
      </header>

      <FakturaForm
        companyId={companyId}
        company={{
          naziv: company.naziv,
          adresa: company.adresa,
          mesto: company.mesto,
          pib: company.pib,
          maticniBroj: company.maticniBroj,
          racun: company.racun,
          telefon: company.telefon,
          email: company.email,
        }}
        clients={clients}
        predlozeniBroj={predlozeniBroj}
      />
    </main>
  );
}
