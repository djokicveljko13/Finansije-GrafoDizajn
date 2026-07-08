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

  // Ako firme već postoje za ovog korisnika, ne dupliramo seed.
  const existing = await prisma.company.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log(`Korisnik ${email} već ima ${existing} firmi — preskačem seed firmi.`);
    return;
  }

  const firma1 = await prisma.company.create({
    data: {
      userId: user.id,
      naziv: "Grafo Dizajn",
      pib: "100200300",
      maticniBroj: "60123456",
      adresa: "Jagodina",
      sifraDelatnosti: "7410", // Specijalizovane dizajnerske delatnosti
      isSefEnabled: true,
    },
  });

  const firma2 = await prisma.company.create({
    data: {
      userId: user.id,
      naziv: "VP Elite Design",
      pib: "100200301",
      maticniBroj: "60123457",
      adresa: "Jagodina",
      sifraDelatnosti: "7410", // Specijalizovane dizajnerske delatnosti
      isSefEnabled: false,
    },
  });

  const firma3 = await prisma.company.create({
    data: {
      userId: user.id,
      naziv: "SD Štampa",
      pib: "100200302",
      maticniBroj: "60123458",
      adresa: "Jagodina",
      sifraDelatnosti: "1812", // Ostalo štampanje
      isSefEnabled: false,
    },
  });

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

  console.log("Seed gotov:");
  console.log(`  Vlasnik: ${email} / lozinka: ${password}`);
  console.log(`  Firme: ${firma1.naziv}, ${firma2.naziv}, ${firma3.naziv}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
