"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/app/(admin)/admin/actions";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initialState);
  return (
    <form action={action} className="mt-8 space-y-5">
      <label className="block text-sm font-medium">
        Email address
        <input name="email" type="email" required autoComplete="username" className="mt-2 w-full rounded-xl border border-[#e6e0eb] bg-white px-4 py-3 outline-none transition focus:border-[#8b5bc7] focus:ring-4 focus:ring-purple-100" />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-[#e6e0eb] bg-white px-4 py-3 outline-none transition focus:border-[#8b5bc7] focus:ring-4 focus:ring-purple-100" />
      </label>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-full bg-[#55239a] px-5 py-3.5 font-semibold text-white transition hover:bg-[#35115f] disabled:cursor-wait disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
