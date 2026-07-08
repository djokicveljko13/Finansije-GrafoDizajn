import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeKpoRows, sumKpoRows, groupKpoByMonth } from "@/lib/kpo";
import { formatAmount, formatRsd } from "@/lib/money";
import { LimitProgress } from "./limit-progress";
import { MonthlyChart } from "./monthly-chart";

export default async function PregledPrometaPage({
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
  const entries = await prisma.kpoEntry.findMany({
    where: { companyId, godina },
    include: { client: true },
  });

  const rows = computeKpoRows(entries);
  const totals = sumKpoRows(rows);
  const mesecniPromet = groupKpoByMonth(rows);
  const preostalo = Math.max(company.pausalLimit - totals.svega, 0);
  const procenat = Math.min((totals.svega / company.pausalLimit) * 100, 100);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={
            <Link href={`/firma/${companyId}`}>
              <ArrowLeft className="size-4" />
              Nazad na firmu
            </Link>
          }
        />
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Pregled prometa — {company.naziv}</h1>
        <p className="text-sm text-muted-foreground">Tekuća godina: {godina}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ukupan promet u {godina}.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-semibold tabular-nums">{formatRsd(totals.svega)}</p>
            <p className="text-sm text-muted-foreground">
              Proizvodi: {formatAmount(totals.proizvodi)} · Usluge:{" "}
              {formatAmount(totals.usluge)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paušalni limit</CardTitle>
          </CardHeader>
          <CardContent>
            <LimitProgress
              ostvareno={totals.svega}
              limit={company.pausalLimit}
              preostalo={preostalo}
              procenat={procenat}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promet po mesecima — {godina}.</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={mesecniPromet} />
        </CardContent>
      </Card>
    </main>
  );
}
