"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string } | undefined;

export async function authenticate(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/izbor-kompanije",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Pogrešan email ili šifra." };
    }
    // signIn baca NEXT_REDIRECT pri uspehu — mora se propagirati dalje.
    throw error;
  }
}
