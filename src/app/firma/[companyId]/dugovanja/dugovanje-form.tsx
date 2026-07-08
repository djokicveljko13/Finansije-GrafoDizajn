"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createDebt } from "@/lib/dugovanja-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Čuvanje…" : "Dodaj dug"}
    </Button>
  );
}

export function DugovanjeForm({
  companyId,
  clientNames,
}: {
  companyId: string;
  clientNames: string[];
}) {
  const action = createDebt.bind(null, companyId);
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
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="flex flex-col gap-2 lg:col-span-2">
        <Label htmlFor="klijent">Klijent</Label>
        <Input
          id="klijent"
          name="klijent"
          list="debt-client-suggestions"
          placeholder="Naziv klijenta"
          autoComplete="off"
          required
        />
        <datalist id="debt-client-suggestions">
          {clientNames.map((naziv) => (
            <option key={naziv} value={naziv} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2 lg:col-span-1">
        <Label htmlFor="iznos">Iznos duga</Label>
        <Input
          id="iznos"
          name="iznos"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0,00"
          required
        />
      </div>

      <div className="flex items-end gap-3 lg:col-span-1">
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
