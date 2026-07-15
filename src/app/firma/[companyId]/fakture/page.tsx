import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, FilePlus, FileText } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRsd } from "@/lib/money";
import { formatBrojFakture, formatDatumSr } from "@/lib/faktura";
import { DeleteFakturaDialog } from "./delete-faktura-dialog";

export default async function FakturePage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ nova?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { companyId } = await params;
  const { nova } = await searchParams;
  const company = await prisma.company.findFirst({
    where: { id: companyId, userId: session.user.id },
  });
  if (!company) {
    notFound();
  }

  const fakture = await prisma.faktura.findMany({
    where: { companyId },
    orderBy: [{ godina: "desc" }, { broj: "desc" }],
  });
  const novaFaktura = nova ? fakture.find((f) => f.id === nova) : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
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

      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Fakture — {company.naziv}</h1>
          <p className="text-sm text-muted-foreground">
            Svaka faktura je automatski upisana i u KPO knjigu.
          </p>
        </div>
        <Button
          size="sm"
          nativeButton={false}
          render={
            <Link href={`/firma/${companyId}/fakture/nova`}>
              <FilePlus className="size-4" />
              Nova faktura
            </Link>
          }
        />
      </header>

      {novaFaktura ? (
        <Card className="border-green-600/40 bg-green-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-green-600" />
              Faktura {formatBrojFakture(novaFaktura.broj, novaFaktura.godina)} je
              sačuvana i upisana u KPO knjigu.
            </p>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <a href={`/api/firma/${companyId}/fakture/${novaFaktura.id}/pdf`}>
                  <FileText className="size-4" />
                  Preuzmi PDF
                </a>
              }
            />
          </CardContent>
        </Card>
      ) : null}

      {fakture.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Još nema izdatih faktura.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="p-3 font-medium">Broj</th>
                <th className="p-3 font-medium">Datum</th>
                <th className="p-3 font-medium">Kupac</th>
                <th className="p-3 text-right font-medium">Iznos</th>
                <th className="p-3 text-right font-medium">Akcije</th>
              </tr>
            </thead>
            <tbody>
              {fakture.map((f) => (
                <tr key={f.id} className="border-b last:border-b-0">
                  <td className="p-3 font-medium tabular-nums">
                    {formatBrojFakture(f.broj, f.godina)}
                  </td>
                  <td className="p-3 tabular-nums">{formatDatumSr(f.datum)}</td>
                  <td className="p-3">{f.kupacNaziv}</td>
                  <td className="p-3 text-right tabular-nums">
                    {formatRsd(f.ukupno)}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={
                          <a href={`/api/firma/${companyId}/fakture/${f.id}/pdf`}>
                            <FileText className="size-4" />
                            PDF
                          </a>
                        }
                      />
                      <DeleteFakturaDialog
                        companyId={companyId}
                        fakturaId={f.id}
                        brojPrikaz={formatBrojFakture(f.broj, f.godina)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
