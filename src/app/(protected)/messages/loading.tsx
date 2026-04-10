export default function MessagesLoading() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-3 animate-pulse">
      <div className="text-center text-terminal-green/40 text-xs tracking-widest">
        LOADING TRANSMISSIONS...
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 border border-terminal-dim/30" />
      ))}
    </div>
  );
}
