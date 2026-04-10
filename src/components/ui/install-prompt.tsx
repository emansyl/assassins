"use client";

import { useState, useEffect } from "react";
import { TerminalButton } from "@/components/ui/terminal-button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed this session
    if (sessionStorage.getItem("install-dismissed")) {
      setDismissed(true);
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);

    // Listen for the install prompt (Chrome/Android/Edge)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("install-dismissed", "1");
  }

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;

  // Don't show if not iOS and no prompt available (already installed or unsupported)
  if (!isIos && !deferredPrompt) return null;

  return (
    <div className="border border-terminal-green/30 bg-terminal-green/5 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-terminal-green text-[10px] tracking-widest font-bold">
          INSTALL APP
        </div>
        <button
          onClick={handleDismiss}
          className="text-terminal-dim text-xs hover:text-terminal-text cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="text-terminal-dim text-[10px]">
        Add to your home screen for quick access — no app store needed.
      </div>

      {/* Android/Chrome — direct install */}
      {deferredPrompt && (
        <TerminalButton onClick={handleInstall} className="w-full">
          Add to Home Screen
        </TerminalButton>
      )}

      {/* iOS — show instructions */}
      {isIos && !deferredPrompt && (
        <>
          {!showIosGuide ? (
            <TerminalButton onClick={() => setShowIosGuide(true)} className="w-full">
              Add to Home Screen
            </TerminalButton>
          ) : (
            <div className="border border-terminal-dim/30 p-3 space-y-2 text-xs text-terminal-text">
              <div className="text-terminal-amber text-[10px] font-bold">INSTRUCTIONS:</div>
              <div className="space-y-1">
                <div>1. Tap the <span className="text-terminal-green font-bold">Share</span> button <span className="text-terminal-dim">(square with arrow)</span></div>
                <div>2. Scroll down and tap <span className="text-terminal-green font-bold">&quot;Add to Home Screen&quot;</span></div>
                <div>3. Tap <span className="text-terminal-green font-bold">&quot;Add&quot;</span></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
