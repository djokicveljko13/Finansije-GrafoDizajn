import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ChevronRight, LogOut } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

export default async function IzborKompanijePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const companies = await prisma.company.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Izbor firme</h1>
          <p className="text-sm text-muted-foreground">
            Izaberite firmu za koju vodite KPO knjigu.
          </p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-4" />
            Odjava
          </Button>
        </form>
      </header>

      <ul className="flex flex-col gap-3">
        {companies.map((company) => (
          <li key={company.id}>
            <Link
              href={`/firma/${company.id}`}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="font-medium">{company.naziv}</span>
                <span className="text-sm text-muted-foreground">
                  {company.isSefEnabled ? "Na SEF-u" : "Nije na SEF-u"}
                  {company.pib ? ` · PIB ${company.pib}` : ""}
                </span>
              </span>
              <ChevronRight className="ml-auto size-5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>

      {companies.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nema firmi za ovog korisnika.
        </p>
      ) : null}
    </main>
  );
}
