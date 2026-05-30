"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enrollWithCode } from "./actions";

export function EnrollForm({ code }: { code: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const password = String(fd.get("password") ?? "");
    setError(null);
    startTransition(async () => {
      const res = await enrollWithCode({ code, name, email, password });
      if (!res.ok) {
        setError(
          res.error === "email already in use"
            ? "That email already has an account. Log in instead."
            : res.error === "code already used"
            ? "This code has already been claimed."
            : "Could not create your account. Check the form and try again."
        );
        return;
      }
      // Auto-login
      const signinRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!signinRes || signinRes.error) {
        // Account was created; ask user to log in.
        router.push("/login");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" required className="mt-1.5" placeholder="Aarati Sharma" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-1.5"
          placeholder="min 6 characters"
        />
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Join the course
      </Button>
    </form>
  );
}
