export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-pulse">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center text-terminal-green/40 text-xs tracking-widest">
          LOADING BRIEFING...
        </div>
        <div className="h-64 border border-terminal-dim/30" />
      </div>
    </div>
  );
}
