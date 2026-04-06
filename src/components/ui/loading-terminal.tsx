export function LoadingTerminal({ message = "ACCESSING DATABASE" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-terminal-green text-sm">
        {message}
        <span className="animate-cursor-blink">...</span>
      </div>
    </div>
  );
}
