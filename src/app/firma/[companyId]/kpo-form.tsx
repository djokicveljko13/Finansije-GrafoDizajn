"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createKpoEntry } from "@/lib/kpo-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Čuvanje…" : "Dodaj u KPO knjigu"}
    </Button>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function KpoForm({
  companyId,
  clientNames,
}: {
  companyId: string;
  clientNames: string[];
}) {
  const action = createKpoEntry.bind(null, companyId);
  const [state, formAction] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const lastState = useRef(state);

  useEffect(() => {
    if (lastState.current !== state && !state?.error) {
      formRef.current?.reset();
    }
    lastState.current = state;
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <div className="flex flex-col gap-2 lg:col-span-1">
        <Label htmlFor="datumNaplate">Datum naplate</Label>
        <Input
          id="datumNaplate"
          name="datumNaplate"
          type="date"
          defaultValue={todayIso()}
          required
        />
      </div>

      <div className="flex flex-col gap-2 lg:col-span-1">
        <Label htmlFor="brojIsprave">Broj isprave</Label>
        <Input id="brojIsprave" name="brojIsprave" placeholder="npr. 15/24" />
      </div>

      <div className="flex flex-col gap-2 lg:col-span-2">
        <Label htmlFor="opis">Opis knjiženja</Label>
        <Input id="opis" name="opis" placeholder="npr. Izrada vizuelnog identiteta" />
      </div>

      <div className="flex flex-col gap-2 lg:col-span-2">
        <Label htmlFor="clientNaziv">Klijent</Label>
        <Input
          id="clientNaziv"
          name="clientNaziv"
          list="client-suggestions"
          placeholder="Naziv klijenta"
          autoComplete="off"
        />
        <datalist id="client-suggestions">
          {clientNames.map((naziv) => (
            <option key={naziv} value={naziv} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2 lg:col-span-1">
        <Label htmlFor="prihodProizvodi">Prihod od proizvoda</Label>
        <Input
          id="prihodProizvodi"
          name="prihodProizvodi"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0,00"
        />
      </div>

      <div className="flex flex-col gap-2 lg:col-span-1">
        <Label htmlFor="prihodUsluge">Prihod od usluga</Label>
        <Input
          id="prihodUsluge"
          name="prihodUsluge"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0,00"
        />
      </div>

      <div className="flex items-end gap-3 lg:col-span-2">
        <SubmitButton />
        {state?.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
