import { TerminalCard } from "@/components/ui/terminal-card";
import type { Player } from "@/types";

export function TargetDossier({ target, spoonCollected }: { target: Player | null; spoonCollected: boolean }) {
  if (!target) {
    return (
      <TerminalCard title="Current Assignment">
        <div className="text-center py-8">
          <div className="text-terminal-amber text-sm glow-amber">
            STAND BY FOR ASSIGNMENT
          </div>
          <div className="text-terminal-dim text-xs mt-2">
            Awaiting orders from Command
          </div>
        </div>
      </TerminalCard>
    );
  }

  return (
    <TerminalCard title="Target Dossier" variant="danger">
      <div className="space-y-4">
        {/* Target photo */}
        <div className="flex justify-center">
          {target.photo_url ? (
            <img
              src={target.photo_url}
              alt="Target"
              className="w-24 h-24 object-cover border border-terminal-red/50 grayscale"
            />
          ) : (
            <div className="w-24 h-24 border border-terminal-dim flex items-center justify-center">
              <span className="text-terminal-dim text-3xl">?</span>
            </div>
          )}
        </div>

        {/* Target info */}
        <div className="text-center space-y-2">
          <div className="text-terminal-red text-lg font-bold glow-red">
            {target.full_name}
          </div>
          {target.nickname && (
            <div className="text-terminal-muted text-xs">
              AKA &quot;{target.nickname}&quot;
            </div>
          )}
        </div>

        {/* Dossier details */}
        <div className="border-t border-terminal-dim pt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-terminal-dim">STATUS:</span>
            <span className="text-terminal-green">ACTIVE</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-terminal-dim">SPOON:</span>
            <span className={spoonCollected ? "text-terminal-green" : "text-terminal-amber"}>
              {spoonCollected ? "COLLECTED" : "NOT COLLECTED"}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-terminal-dim">CLASSIFICATION:</span>
            <span className={spoonCollected ? "text-terminal-amber" : "text-terminal-dim"}>
              {spoonCollected ? "ELIMINATE ON SIGHT" : "NOT YET ELIGIBLE"}
            </span>
          </div>
        </div>
      </div>
    </TerminalCard>
  );
}
