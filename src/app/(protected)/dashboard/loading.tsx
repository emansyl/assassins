export default function DashboardLoading() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 animate-pulse">
      <div className="text-center space-y-2">
        <div className="text-terminal-green/40 text-xs tracking-widest">
          LOADING OPERATIVE DATA...
        </div>
        <div className="h-6 bg-terminal-dim/20 w-48 mx-auto" />
      </div>
      <div className="h-12 border border-terminal-dim/30" />
      <div className="h-48 border border-terminal-dim/30" />
      <div className="h-20 border border-terminal-dim/30" />
    </div>
  );
}
