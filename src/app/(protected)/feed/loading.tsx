export default function FeedLoading() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-3 animate-pulse">
      <div className="text-center text-terminal-green/40 text-xs tracking-widest">
        LOADING KILL FEED...
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 border border-terminal-dim/30" />
      ))}
    </div>
  );
}
