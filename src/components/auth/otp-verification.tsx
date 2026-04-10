"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TerminalButton } from "@/components/ui/terminal-button";

export function OtpVerification({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newCode.every((d) => d !== "") && value) {
      verifyOtp(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      verifyOtp(pasted);
    }
  }

  async function verifyOtp(token: string) {
    setError("");
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setLoading(false);

    if (verifyError) {
      setError(`VERIFICATION FAILED: ${verifyError.message}`);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }

    // Full page navigation ensures cookies are committed before the server
    // renders the dashboard. router.push() on iOS Chrome can navigate before
    // the auth cookies from verifyOtp are flushed, causing a redirect loop.
    window.location.href = "/dashboard";
  }

  async function resendCode() {
    setError("");
    const { error: resendError } = await supabase.auth.signInWithOtp({ email });
    if (resendError) {
      setError(`RETRANSMISSION FAILED: ${resendError.message}`);
    } else {
      setCountdown(60);
    }
  }

  return (
    <div className="space-y-6 w-full max-w-sm mx-auto p-4">
      <div className="text-center space-y-2">
        <div className="text-terminal-green text-sm">
          VERIFICATION CODE TRANSMITTED
        </div>
        <div className="text-terminal-dim text-sm">
          Enter the 6-digit code sent to your email
        </div>
      </div>

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {code.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-10 h-12 text-center text-lg font-mono bg-terminal-bg border border-terminal-dim text-terminal-green focus:border-terminal-green focus:outline-none"
          />
        ))}
      </div>

      {error && (
        <div className="text-terminal-red text-sm border border-terminal-red/30 p-2 text-center">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-terminal-green text-sm text-center animate-cursor-blink">
          VERIFYING IDENTITY...
        </div>
      )}

      <div className="flex flex-col gap-2">
        {countdown > 0 ? (
          <div className="text-terminal-dim text-sm text-center">
            RETRANSMISSION AVAILABLE IN {countdown}s
          </div>
        ) : (
          <TerminalButton variant="ghost" onClick={resendCode} className="w-full">
            Retransmit Code
          </TerminalButton>
        )}

        <TerminalButton variant="ghost" onClick={onBack} className="w-full">
          Back
        </TerminalButton>
      </div>
    </div>
  );
}
