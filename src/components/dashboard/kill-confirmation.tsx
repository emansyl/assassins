"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createUntypedClient } from "@/lib/supabase/untyped-client";
import { TerminalButton } from "@/components/ui/terminal-button";
import { TerminalCard } from "@/components/ui/terminal-card";
import type { Player } from "@/types";

export function KillConfirmation({
  target,
  assassinId,
}: {
  target: Player;
  assassinId: string;
}) {
  const [open, setOpen] = useState(false);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createUntypedClient();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelfie(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  async function handleConfirm() {
    if (!selfie) {
      setError("VISUAL CONFIRMATION REQUIRED — UPLOAD ELIMINATION SELFIE");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload selfie to storage
      const ext = selfie.name.split(".").pop();
      const path = `${assassinId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("kill-selfies")
        .upload(path, selfie);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("kill-selfies")
        .getPublicUrl(path);

      // Call the confirm_kill RPC
      const { data, error: rpcError } = await supabase.rpc("confirm_kill", {
        p_assassin_id: assassinId,
        p_target_id: target.id,
        p_selfie_url: urlData.publicUrl,
        p_confirmed_by: "app",
        p_notes: notes || null,
      });

      if (rpcError) throw new Error(rpcError.message);

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || "Kill confirmation failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "SYSTEM ERROR");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <TerminalCard title="Confirmation" variant="danger">
        <div className="text-center py-6 space-y-2">
          <div className="text-terminal-red text-lg glow-red">
            TARGET NEUTRALIZED
          </div>
          <div className="text-terminal-dim text-xs">
            NEW ASSIGNMENT INCOMING...
          </div>
        </div>
      </TerminalCard>
    );
  }

  if (!open) {
    return (
      <TerminalButton
        variant="danger"
        onClick={() => setOpen(true)}
        className="w-full py-3"
      >
        Confirm Elimination
      </TerminalButton>
    );
  }

  return (
    <TerminalCard title="Kill Confirmation" variant="danger">
      <div className="space-y-4">
        <div className="text-terminal-red text-xs text-center">
          CONFIRM ELIMINATION OF TARGET: {target.full_name}
        </div>

        {/* Selfie upload */}
        <div className="space-y-2">
          <div className="text-terminal-dim text-xs uppercase">
            Visual Confirmation (Required)
          </div>

          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Kill selfie"
                className="w-full h-48 object-cover border border-terminal-red/50"
              />
              <button
                onClick={() => {
                  setSelfie(null);
                  setPreview(null);
                }}
                className="absolute top-1 right-1 text-terminal-red text-xs border border-terminal-red/50 bg-terminal-bg px-2 py-0.5"
              >
                X
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-32 border border-dashed border-terminal-dim flex flex-col items-center justify-center gap-2 hover:border-terminal-red/50 transition-colors"
            >
              <span className="text-terminal-dim text-2xl">[+]</span>
              <span className="text-terminal-dim text-xs">
                TAP TO CAPTURE ELIMINATION SELFIE
              </span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <div className="text-terminal-dim text-xs uppercase">
            Field Notes (Optional)
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Mission details..."
            rows={2}
            className="w-full bg-terminal-bg border border-terminal-dim p-2 text-sm text-terminal-text font-mono placeholder:text-terminal-dim/50 outline-none focus:border-terminal-green resize-none"
          />
        </div>

        {error && (
          <div className="text-terminal-red text-xs border border-terminal-red/30 p-2">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <TerminalButton
            variant="ghost"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Abort
          </TerminalButton>
          <TerminalButton
            variant="danger"
            onClick={handleConfirm}
            loading={loading}
            className="flex-1"
          >
            Confirm Kill
          </TerminalButton>
        </div>
      </div>
    </TerminalCard>
  );
}
