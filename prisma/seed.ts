import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_OWNER_EMAIL ?? "tata@gdfinance.rs";
  const password = process.env.SEED_OWNER_PASSWORD;
  const name = process.env.SEED_OWNER_NAME ?? "Vlasnik";

  if (!password) {
    throw new Error("SEED_OWNER_PASSWORD nije podešen u .env fajlu.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: passwordHash },
    create: { email, name, password: passwordHash },
  });

  // Podaci za zaglavlje fakture (računa) — za VP Elite sa prave fakture.
  const fakturaPodaci = {
    "112627869": {
      adresa: "Branka Radičevića, Međureč",
      mesto: "Međureč",
      racun: "160-6000001236873-68",
      telefon: "064 11 60 971",
      email: "stampavelikihformatagd@gmail.com",
    },
    "105812010": { mesto: "Jagodina" },
    "113889315": { mesto: "Jagodina" },
  } as const;

  // Ako firme već postoje za ovog korisnika, samo dopunimo nove kolone (backfill).
  const existing = await prisma.company.count({ where: { userId: user.id } });
  if (existing > 0) {
    for (const [pib, data] of Object.entries(fakturaPodaci)) {
      await prisma.company.updateMany({ where: { userId: user.id, pib }, data });
    }
    console.log(
      `Korisnik ${email} već ima ${existing} firmi — dopunjeni podaci za fakture, preskačem seed firmi.`
    );
    return;
  }

  const firma1 = await prisma.company.create({
    data: {
      userId: user.id,
      naziv: "Grafo Dizajn",
      pib: "105812010",
      maticniBroj: "61923306",
      adresa: "Jagodina",
      sifraDelatnosti: "1812",
      isSefEnabled: true,
      ...fakturaPodaci["105812010"],
    },
  });

  const firma2 = await prisma.company.create({
    data: {
      userId: user.id,
      naziv: "VP Elite Design",
      pib: "112627869",
      maticniBroj: "66240657",
      sifraDelatnosti: "1812",
      isSefEnabled: false,
      ...fakturaPodaci["112627869"],
    },
  });

  const firma3 = await prisma.company.create({
    data: {
      userId: user.id,
      naziv: "SD Štampa",
      pib: "113889315",
      maticniBroj: "67162048",
      adresa: "Jagodina",
      sifraDelatnosti: "1812",
      isSefEnabled: false,
      ...fakturaPodaci["113889315"],
    },
  });

  // Test klijenti i KPO upisi samo za lokalni razvoj (SEED_DEMO=1) —
  // produkcija kreće bez upisa, tata unosi prave podatke.
  if (process.env.SEED_DEMO !== "1") {
    console.log("Seed gotov (bez demo podataka):");
    console.log(`  Vlasnik: ${email}`);
    console.log(`  Firme: ${firma1.naziv}, ${firma2.naziv}, ${firma3.naziv}`);
    return;
  }

  const k1 = await prisma.client.create({
    data: { companyId: firma1.id, naziv: "Reklama Studio DOO", pib: "101010101" },
  });
  const k2 = await prisma.client.create({
    data: { companyId: firma1.id, naziv: "Opština Jagodina", pib: "101010102" },
  });
  await prisma.client.create({
    data: { companyId: firma2.id, naziv: "Fizičko lice (gotovina)" },
  });

  // Par test upisa za firmu 1 (Grafo Dizajn, 2026) — za proveru rednog broja i kumulativa.
  await prisma.kpoEntry.createMany({
    data: [
      {
        companyId: firma1.id,
        godina: 2026,
        datumNaplate: new Date("2026-01-15"),
        brojIsprave: "1/2026",
        opis: "Dizajn vizuelnog identiteta i logotipa",
        clientId: k1.id,
        prihodProizvodi: 0,
        prihodUsluge: 4500000, // 45.000,00 RSD
      },
      {
        companyId: firma1.id,
        godina: 2026,
        datumNaplate: new Date("2026-02-03"),
        brojIsprave: "2/2026",
        opis: "Štampa flajera + dizajn brošure",
        clientId: k2.id,
        prihodProizvodi: 1200000, // 12.000,00 (štampani materijal)
        prihodUsluge: 800000, // 8.000,00 (dizajn)
      },
      {
        companyId: firma1.id,
        godina: 2026,
        datumNaplate: new Date("2026-03-20"),
        brojIsprave: "3/2026",
        opis: "Dizajn i priprema za štampu kataloga",
        clientId: k1.id,
        prihodProizvodi: 0,
        prihodUsluge: 6000000, // 60.000,00
      },
    ],
  });

  console.log("Seed gotov (sa demo podacima):");
  console.log(`  Vlasnik: ${email}`);
  console.log(`  Firme: ${firma1.naziv}, ${firma2.naziv}, ${firma3.naziv}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
