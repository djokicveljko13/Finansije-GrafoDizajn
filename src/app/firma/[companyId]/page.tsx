import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BarChart3, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeKpoRows, sumKpoRows } from "@/lib/kpo";
import { ExportMenu } from "./export-menu";
import { KpoForm } from "./kpo-form";
import { KpoTable } from "./kpo-table";
import { YearFilter } from "./year-filter";

export default async function FirmaPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ godina?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { companyId } = await params;
  const { godina: godinaParam } = await searchParams;
  const company = await prisma.company.findFirst({
    where: { id: companyId, userId: session.user.id },
  });
  if (!company) {
    notFound();
  }

  const currentYear = new Date().getFullYear();
  const distinctYears = await prisma.kpoEntry.findMany({
    where: { companyId },
    distinct: ["godina"],
    select: { godina: true },
    orderBy: { godina: "desc" },
  });
  const years = Array.from(
    new Set([currentYear, ...distinctYears.map((y) => y.godina)])
  ).sort((a, b) => b - a);
  const godina = Number(godinaParam) || currentYear;

  const [entries, clients] = await Promise.all([
    prisma.kpoEntry.findMany({
      where: { companyId, godina },
      include: { client: true },
    }),
    prisma.client.findMany({ where: { companyId }, orderBy: { naziv: "asc" } }),
  ]);

  const rows = computeKpoRows(entries);
  const totals = sumKpoRows(rows);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link href="/izbor-kompanije">
              <ArrowLeft className="size-4" />
              Nazad na izbor firme
            </Link>
          }
        />
      </div>

      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{company.naziv}</h1>
          <p className="text-sm text-muted-foreground">
            {company.isSefEnabled ? "Na SEF-u" : "Nije na SEF-u"}
            {company.pib ? ` · PIB ${company.pib}` : ""}
            {company.sifraDelatnosti ? ` · Šifra ${company.sifraDelatnosti}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link href={`/firma/${companyId}/pregledPrometa`}>
                <BarChart3 className="size-4" />
                Pregled prometa
              </Link>
            }
          />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link href={`/firma/${companyId}/dugovanja`}>
                <Wallet className="size-4" />
                Dugovanja klijenata
              </Link>
            }
          />
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Novi unos u KPO knjigu</CardTitle>
        </CardHeader>
        <CardContent>
          <KpoForm companyId={companyId} clientNames={clients.map((c) => c.naziv)} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">KPO knjiga — {godina}</h2>
        <div className="flex items-center gap-2">
          <ExportMenu companyId={companyId} godina={godina} />
          <YearFilter years={years} selected={godina} />
        </div>
      </div>

      <KpoTable
        companyId={companyId}
        rows={rows}
        totals={totals}
        clientNames={clients.map((c) => c.naziv)}
      />
    </main>
  );
}
