"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { payPartialDebt } from "@/lib/dugovanja-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Čuvanje…" : "Potvrdi uplatu"}
    </Button>
  );
}

export function PayPartialDialog({
  companyId,
  debtId,
  klijent,
}: {
  companyId: string;
  debtId: string;
  klijent: string;
}) {
  const [open, setOpen] = useState(false);
  const action = payPartialDebt.bind(null, companyId, debtId);
  const [state, formAction] = useActionState(action, undefined);
  const lastState = state;

  useEffect(() => {
    if (lastState && !lastState.error) {
      setOpen(false);
    }
  }, [lastState]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Isplati deo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delimična isplata — {klijent}</DialogTitle>
          <DialogDescription>
            Unesite iznos koji je klijent isplatio. Preostali dug će se umanjiti za taj iznos.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`iznos-${debtId}`}>Iznos uplate</Label>
            <Input
              id={`iznos-${debtId}`}
              name="iznos"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0,00"
              required
              autoFocus
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
