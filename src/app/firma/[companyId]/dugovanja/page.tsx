import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRsd } from "@/lib/money";
import { DugovanjeForm } from "./dugovanje-form";
import { DugovanjaTable } from "./dugovanja-table";

export default async function DugovanjaPage({
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

  const [debts, clients] = await Promise.all([
    prisma.debt.findMany({ where: { companyId }, orderBy: { createdAt: "asc" } }),
    prisma.client.findMany({ where: { companyId }, orderBy: { naziv: "asc" } }),
  ]);

  const ukupno = debts.reduce((sum, d) => sum + d.iznos, 0);

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
        <h1 className="text-2xl font-semibold">Dugovanja klijenata — {company.naziv}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Ukupno dugovanje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">{formatRsd(ukupno)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Novi unos duga</CardTitle>
        </CardHeader>
        <CardContent>
          <DugovanjeForm companyId={companyId} clientNames={clients.map((c) => c.naziv)} />
        </CardContent>
      </Card>

      <DugovanjaTable companyId={companyId} debts={debts} ukupno={ukupno} />
    </main>
  );
}
