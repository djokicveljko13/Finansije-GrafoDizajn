"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Prijavljivanje…" : "Prijavi se"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Šifra</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Šifra"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
