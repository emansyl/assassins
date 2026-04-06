"use client";

import { useState, useCallback } from "react";
import { BootSequence } from "@/components/auth/boot-sequence";
import { LoginForm } from "@/components/auth/login-form";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";

export default function Home() {
  const [booted, setBooted] = useState(false);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-screen">
      <ScanlineOverlay />

      {!booted ? (
        <BootSequence onComplete={handleBootComplete} />
      ) : (
        <div className="w-full animate-[fadeIn_0.5s_ease-in]">
          <LoginForm />
        </div>
      )}
    </main>
  );
}
