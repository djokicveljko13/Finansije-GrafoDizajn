"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createFaktura } from "@/lib/faktura-actions";
import { rsdToPara, formatAmount } from "@/lib/money";
import {
  defaultValuta,
  formatBrojFakture,
  stavkaUkupno,
  type FakturaPreviewData,
} from "@/lib/faktura";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FakturaPreview } from "./faktura-preview";

type ClientOption = {
  naziv: string;
  pib: string | null;
  maticniBroj: string | null;
  adresa: string | null;
  mesto: string | null;
};

type StavkaState = {
  naziv: string;
  jedinicaMere: string;
  kolicina: string;
  cena: string;
};

const praznaStavka: StavkaState = { naziv: "", jedinicaMere: "kom", kolicina: "1", cena: "" };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function FakturaForm({
  companyId,
  company,
  clients,
  predlozeniBroj,
}: {
  companyId: string;
  company: FakturaPreviewData["company"];
  clients: ClientOption[];
  predlozeniBroj: number;
}) {
  const action = createFaktura.bind(null, companyId);
  const [state, formAction, pending] = useActionState(action, undefined);

  const [broj, setBroj] = useState(String(predlozeniBroj));
  const [datum, setDatum] = useState(todayIso());
  const [valuta, setValuta] = useState(defaultValuta(todayIso()));
  const [valutaTouched, setValutaTouched] = useState(false);
  const [kupac, setKupac] = useState({
    naziv: "",
    adresa: "",
    mesto: "",
    pib: "",
    maticniBroj: "",
  });
  const [stavke, setStavke] = useState<StavkaState[]>([{ ...praznaStavka }]);

  function onDatumChange(value: string) {
    setDatum(value);
    if (!valutaTouched && value) {
      setValuta(defaultValuta(value));
    }
  }

  function onKupacNazivChange(value: string) {
    const match = clients.find((c) => c.naziv === value);
    if (match) {
      setKupac({
        naziv: value,
        adresa: match.adresa ?? "",
        mesto: match.mesto ?? "",
        pib: match.pib ?? "",
        maticniBroj: match.maticniBroj ?? "",
      });
    } else {
      setKupac((k) => ({ ...k, naziv: value }));
    }
  }

  function setStavka(index: number, patch: Partial<StavkaState>) {
    setStavke((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  // Preview je čisto izvedeno stanje — ista računica kao na serveru (stavkaUkupno).
  const godina = new Date(datum).getFullYear() || new Date().getFullYear();
  const brojNum = Number.parseInt(broj, 10) || 0;
  const previewStavke = stavke
    .filter((s) => s.naziv.trim() || rsdToPara(s.cena || "0") > 0)
    .map((s) => {
      const kolicina = rsdToPara(s.kolicina || "0");
      const cena = rsdToPara(s.cena || "0");
      return {
        naziv: s.naziv,
        jedinicaMere: s.jedinicaMere || "kom",
        kolicina,
        cena,
        ukupno: stavkaUkupno(kolicina, cena),
      };
    });
  const previewData: FakturaPreviewData = {
    company,
    broj: brojNum,
    godina,
    datum,
    valuta,
    kupac: {
      naziv: kupac.naziv,
      adresa: kupac.adresa || null,
      mesto: kupac.mesto || null,
      pib: kupac.pib || null,
      maticniBroj: kupac.maticniBroj || null,
    },
    stavke: previewStavke,
    ukupno: previewStavke.reduce((sum, s) => sum + s.ukupno, 0),
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card className="self-start">
        <CardHeader>
          <CardTitle>Podaci fakture</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="broj">Broj fakture</Label>
                <Input
                  id="broj"
                  name="broj"
                  type="number"
                  min={1}
                  max={9999}
                  step={1}
                  value={broj}
                  onChange={(e) => setBroj(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Prikaz: {formatBrojFakture(brojNum, godina)}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="datum">Datum fakture</Label>
                <Input
                  id="datum"
                  name="datum"
                  type="date"
                  value={datum}
                  onChange={(e) => onDatumChange(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Važi i za promet dobara
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="valuta">Valuta plaćanja</Label>
                <Input
                  id="valuta"
                  name="valuta"
                  type="date"
                  value={valuta}
                  onChange={(e) => {
                    setValuta(e.target.value);
                    setValutaTouched(true);
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Automatski +7 dana
                </p>
              </div>
            </div>

            <fieldset className="flex flex-col gap-4 rounded-md border p-4">
              <legend className="px-1 text-sm font-medium">Kupac</legend>
              <div className="flex flex-col gap-2">
                <Label htmlFor="kupacNaziv">Naziv</Label>
                <Input
                  id="kupacNaziv"
                  name="kupacNaziv"
                  list="kupac-suggestions"
                  placeholder="npr. Go2 Event doo"
                  autoComplete="off"
                  value={kupac.naziv}
                  onChange={(e) => onKupacNazivChange(e.target.value)}
                  required
                />
                <datalist id="kupac-suggestions">
                  {clients.map((c) => (
                    <option key={c.naziv} value={c.naziv} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="kupacAdresa">Adresa</Label>
                  <Input
                    id="kupacAdresa"
                    name="kupacAdresa"
                    placeholder="npr. Strahinjića Bana 36"
                    value={kupac.adresa}
                    onChange={(e) => setKupac((k) => ({ ...k, adresa: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="kupacMesto">Mesto</Label>
                  <Input
                    id="kupacMesto"
                    name="kupacMesto"
                    placeholder="npr. 11000 Beograd"
                    value={kupac.mesto}
                    onChange={(e) => setKupac((k) => ({ ...k, mesto: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="kupacPib">PIB</Label>
                  <Input
                    id="kupacPib"
                    name="kupacPib"
                    inputMode="numeric"
                    placeholder="npr. 106848247"
                    value={kupac.pib}
                    onChange={(e) => setKupac((k) => ({ ...k, pib: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="kupacMaticniBroj">Matični broj</Label>
                  <Input
                    id="kupacMaticniBroj"
                    name="kupacMaticniBroj"
                    inputMode="numeric"
                    placeholder="npr. 20692049"
                    value={kupac.maticniBroj}
                    onChange={(e) =>
                      setKupac((k) => ({ ...k, maticniBroj: e.target.value }))
                    }
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-3 rounded-md border p-4">
              <legend className="px-1 text-sm font-medium">Stavke</legend>
              {stavke.map((stavka, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 items-end gap-2 border-b pb-3 last:border-b-0 sm:grid-cols-[1fr_80px_90px_110px_110px_36px]"
                >
                  <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                    <Label htmlFor={`stavkaNaziv-${i}`} className="text-xs">
                      Naziv robe / usluge
                    </Label>
                    <Input
                      id={`stavkaNaziv-${i}`}
                      name="stavkaNaziv"
                      placeholder="npr. Uslužna štampa na platnu"
                      value={stavka.naziv}
                      onChange={(e) => setStavka(i, { naziv: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`stavkaJedinica-${i}`} className="text-xs">
                      Jed. mere
                    </Label>
                    <Input
                      id={`stavkaJedinica-${i}`}
                      name="stavkaJedinica"
                      value={stavka.jedinicaMere}
                      onChange={(e) => setStavka(i, { jedinicaMere: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`stavkaKolicina-${i}`} className="text-xs">
                      Količina
                    </Label>
                    <Input
                      id={`stavkaKolicina-${i}`}
                      name="stavkaKolicina"
                      type="text"
                      inputMode="decimal"
                      placeholder="1,00"
                      value={stavka.kolicina}
                      onChange={(e) => setStavka(i, { kolicina: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`stavkaCena-${i}`} className="text-xs">
                      Cena
                    </Label>
                    <Input
                      id={`stavkaCena-${i}`}
                      name="stavkaCena"
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={stavka.cena}
                      onChange={(e) => setStavka(i, { cena: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Ukupno</span>
                    <span className="flex h-9 items-center justify-end text-sm tabular-nums">
                      {formatAmount(
                        stavkaUkupno(
                          rsdToPara(stavka.kolicina || "0"),
                          rsdToPara(stavka.cena || "0")
                        )
                      )}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    disabled={stavke.length === 1}
                    onClick={() =>
                      setStavke((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Ukloni stavku</span>
                  </Button>
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStavke((prev) => [...prev, { ...praznaStavka }])}
                >
                  <Plus className="size-4" />
                  Dodaj stavku
                </Button>
              </div>
            </fieldset>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Čuvanje…" : "Sačuvaj fakturu"}
              </Button>
              {state?.error ? (
                <p className="text-sm text-destructive" role="alert">
                  {state.error}
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="self-start xl:sticky xl:top-6">
        <FakturaPreview data={previewData} />
      </div>
    </div>
  );
}
