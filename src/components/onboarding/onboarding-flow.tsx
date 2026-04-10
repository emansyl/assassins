"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalCard } from "@/components/ui/terminal-card";
import { acceptRules, completeOnboarding } from "@/app/(protected)/onboarding/actions";

type Step = "rules" | "confirm" | "spoon";

export function OnboardingFlow({ playerName }: { playerName: string }) {
  const [step, setStep] = useState<Step>("rules");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConfirmRules() {
    setLoading(true);
    await acceptRules();
    setLoading(false);
    setStep("spoon");
  }

  async function handleSpoonChoice(hasSpoon: boolean) {
    setLoading(true);
    const result = await completeOnboarding(hasSpoon);
    if (!result.success) {
      setLoading(false);
      // Force a full page reload to get a fresh session
      window.location.href = "/onboarding";
      return;
    }
    // Full navigation to ensure server re-renders with updated data
    window.location.href = "/dashboard";
  }

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-terminal-green text-xs tracking-widest">
          OPERATIVE BRIEFING
        </div>
        <div className="text-terminal-text text-lg font-bold">
          WELCOME, {playerName.toUpperCase()}
        </div>
        <div className="text-terminal-dim text-xs">
          COMPLETE BRIEFING TO ACCESS OPERATIONS
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 text-[10px]">
        {["RULES", "CONFIRM", "SPOON"].map((label, i) => {
          const stepIndex = ["rules", "confirm", "spoon"].indexOf(step);
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <span className="text-terminal-dim">—</span>}
              <span className={
                isActive ? "text-terminal-green glow-green" :
                isDone ? "text-terminal-green" :
                "text-terminal-dim"
              }>
                {isDone ? "[x]" : isActive ? "[>]" : "[ ]"} {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step 1: Rules Summary */}
      {step === "rules" && (
        <TerminalCard title="Mission Briefing">
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <div className="text-terminal-amber font-bold">OBJECTIVE</div>
              <div className="text-terminal-text">
                Eliminate your assigned target by touching them with your spoon.
                When you eliminate someone, they reveal their target — who becomes
                your new target. Last operative standing wins.
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-terminal-amber font-bold">HOW TO ELIMINATE</div>
              <div className="text-terminal-text">
                Touch your target with your spoon. The touch must be clear and
                undeniable. After eliminating them, take a selfie together and
                post it to the group chat.
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-terminal-amber font-bold">SPOON RULES</div>
              <div className="text-terminal-text">
                You are only safe if your spoon is in your hand. If your spoon is
                in your pocket, bag, or you&apos;ve set it down — you are vulnerable.
                Always keep your spoon ready.
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-terminal-amber font-bold">SAFE ZONES</div>
              <div className="text-terminal-text">
                Class time and your bedroom are safe zones. Everywhere else is
                fair game — hallways, dining, gym, library, outdoors.
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-terminal-amber font-bold">KILL CONFIRMATION</div>
              <div className="text-terminal-text">
                After eliminating your target, ask them: &quot;Who is your target?&quot;
                You&apos;ll need to identify their target correctly in this app to
                confirm the kill. You have 3 attempts — 3 wrong guesses and
                you&apos;re auto-eliminated.
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-terminal-amber font-bold">HONOR SYSTEM</div>
              <div className="text-terminal-text">
                Be honest. No excessive force or aggression. This is a game —
                keep it fun and fair for everyone.
              </div>
            </div>

            <TerminalButton
              onClick={() => setStep("confirm")}
              className="w-full mt-4"
            >
              I Have Read The Rules
            </TerminalButton>
          </div>
        </TerminalCard>
      )}

      {/* Step 2: Confirm Rules */}
      {step === "confirm" && (
        <TerminalCard title="Rules Confirmation">
          <div className="space-y-4">
            <div className="text-terminal-amber text-xs text-center">
              CONFIRM YOU UNDERSTAND THE RULES OF ENGAGEMENT
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 border border-terminal-dim hover:border-terminal-green transition-colors">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 accent-green-500"
              />
              <span className="text-terminal-text text-xs">
                I confirm I have read and understand the rules of engagement.
                I agree to play with honor and respect for all operatives.
              </span>
            </label>

            <TerminalButton
              onClick={handleConfirmRules}
              disabled={!confirmed}
              loading={loading}
              className="w-full"
            >
              Confirm & Continue
            </TerminalButton>

            <TerminalButton
              variant="ghost"
              onClick={() => setStep("rules")}
              className="w-full"
            >
              Back to Rules
            </TerminalButton>
          </div>
        </TerminalCard>
      )}

      {/* Step 3: Spoon Collection */}
      {step === "spoon" && (
        <TerminalCard title="Spoon Collection">
          <div className="space-y-4">
            <div className="text-terminal-amber text-xs text-center">
              HAVE YOU COLLECTED YOUR SPOON FROM COMMAND?
            </div>

            <div className="text-terminal-dim text-[10px] text-center border border-terminal-dim/30 p-3">
              YOUR SPOON IS YOUR WEAPON AND YOUR SHIELD.
              <br />
              YOU CANNOT BE ELIMINATED UNTIL YOU HAVE ONE —
              <br />
              BUT YOUR ASSASSIN WILL KNOW.
            </div>

            <div className="space-y-2">
              <TerminalButton
                onClick={() => handleSpoonChoice(true)}
                loading={loading}
                className="w-full"
              >
                Yes — I Have My Spoon
              </TerminalButton>

              <TerminalButton
                variant="warning"
                onClick={() => handleSpoonChoice(false)}
                loading={loading}
                className="w-full"
              >
                Not Yet — I&apos;ll Collect It Later
              </TerminalButton>
            </div>

            <div className="text-terminal-red text-[10px] text-center">
              NOTE: YOUR ASSASSIN CANNOT ELIMINATE YOU UNTIL YOU HAVE A SPOON
            </div>
          </div>
        </TerminalCard>
      )}
    </div>
  );
}
