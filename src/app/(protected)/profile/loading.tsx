export default function ProfileLoading() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-20 animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <div className="w-24 h-24 rounded-full bg-terminal-dim/20" />
        <div className="h-5 w-40 bg-terminal-dim/20" />
        <div className="h-3 w-24 bg-terminal-dim/20" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-terminal-dim/10 border border-terminal-dim/20" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-terminal-dim/10 border border-terminal-dim/20" />
        ))}
      </div>
    </div>
  );
}
