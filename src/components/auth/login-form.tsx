"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isValidHBSEmail } from "@/lib/constants";
import { toE164 } from "@/lib/utils/phone-format";
import { TerminalInput } from "@/components/ui/terminal-input";
import { TerminalButton } from "@/components/ui/terminal-button";
import { OtpVerification } from "./otp-verification";
import { lookupEmail, linkPhoneToSeed } from "@/app/(auth)/actions";

type Step = "email" | "confirm" | "otp";

export function LoginForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [isReturning, setIsReturning] = useState(false);
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
    const result = await lookupEmail(email);
    setLoading(false);

    if (result.status === "returning") {
      // Known player — send OTP and go straight to verification
      setIsReturning(true);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase(),
      });
      if (otpError) {
        setError(`TRANSMISSION FAILURE: ${otpError.message}`);
        return;
      }
      setStep("otp");
    } else if (result.status === "new_player") {
      // Found in seeds — show identity confirmation
      setFullName(result.fullName);
      setStep("confirm");
    } else {
      setError("OPERATIVE NOT FOUND IN DATABASE. CONTACT COMMAND FOR ACCESS.");
    }
  }

  async function handleConfirmSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("VALID PHONE NUMBER REQUIRED FOR OPERATIVE RECORDS");
      return;
    }

    setLoading(true);

    // Link phone to seed so the trigger can populate it
    const { success } = await linkPhoneToSeed(email, phone);
    if (!success) {
      setLoading(false);
      setError("FAILED TO REGISTER SECURE LINE. TRY AGAIN.");
      return;
    }

    // Send email OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
    });

    setLoading(false);

    if (otpError) {
      setError(`TRANSMISSION FAILURE: ${otpError.message}`);
      return;
    }

    setStep("otp");
  }

  if (step === "otp") {
    return (
      <OtpVerification
        email={email.toLowerCase()}
        onBack={() => setStep(isReturning ? "email" : "confirm")}
      />
    );
  }

  if (step === "confirm") {
    return (
      <form onSubmit={handleConfirmSubmit} className="space-y-4 w-full max-w-sm mx-auto p-4">
        <div className="text-terminal-green text-sm text-center mb-2">
          IDENTITY CONFIRMED
        </div>

        <div className="flex flex-col items-center gap-3 border border-terminal-green/30 p-4">
          <div className="text-terminal-green text-sm font-mono text-center">
            {fullName.toUpperCase()}
          </div>
          <div className="text-terminal-dim text-sm text-center">
            {email.toLowerCase()}
          </div>
        </div>

        <div className="text-terminal-amber text-sm text-center">
          PROVIDE YOUR SECURE LINE TO COMPLETE REGISTRATION
        </div>

        <TerminalInput
          label="Secure Line (Phone)"
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />

        {error && (
          <div className="text-terminal-red text-sm border border-terminal-red/30 p-2">
            {error}
          </div>
        )}

        <TerminalButton type="submit" loading={loading} className="w-full">
          Confirm Identity & Request Code
        </TerminalButton>

        <TerminalButton
          variant="ghost"
          onClick={() => { setStep("email"); setError(""); }}
          className="w-full"
        >
          Back
        </TerminalButton>
      </form>
    );
  }

  // Step: email (default)
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
