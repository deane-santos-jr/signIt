export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-serif text-[1.35rem] leading-none tracking-tight ${className}`}>
      sign<span className="italic">It</span>
    </span>
  );
}
