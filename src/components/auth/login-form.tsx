"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isValidHBSEmail } from "@/lib/constants";
import { TerminalInput } from "@/components/ui/terminal-input";
import { TerminalButton } from "@/components/ui/terminal-button";
import { OtpVerification } from "./otp-verification";

type Step = "email" | "otp";

export function LoginForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isValidHBSEmail(email)) {
      setError("ACCESS DENIED. VALID HBS EMAIL REQUIRED (@mba2026.hbs.edu or @mba2027.hbs.edu)");
      return;
    }

    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: { shouldCreateUser: false },
    });
    setLoading(false);

    if (otpError) {
      const msg = otpError.message.toLowerCase();
      if (msg.includes("signups not allowed") || msg.includes("not found") || msg.includes("not allowed")) {
        setError("OPERATIVE NOT FOUND IN DATABASE. CONTACT COMMAND FOR ACCESS.");
      } else {
        setError(`TRANSMISSION FAILURE: ${otpError.message}`);
      }
      return;
    }

    setStep("otp");
  }

  if (step === "otp") {
    return (
      <OtpVerification
        email={email.toLowerCase()}
        onBack={() => setStep("email")}
      />
    );
  }

  return (
    <form onSubmit={handleEmailSubmit} className="space-y-4 w-full max-w-sm mx-auto p-4">
      <div className="text-terminal-amber text-sm mb-6 text-center">
        IDENTIFY YOURSELF, OPERATIVE.
      </div>

      <TerminalInput
        label="HBS Email"
        type="email"
        placeholder="agent@mba2027.hbs.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      {error && (
        <div className="text-terminal-red text-sm border border-terminal-red/30 p-2">
          {error}
        </div>
      )}

      <TerminalButton type="submit" loading={loading} className="w-full">
        Access Network
      </TerminalButton>
    </form>
  );
}
