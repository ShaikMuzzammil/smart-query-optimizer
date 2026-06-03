export default function Loading() {
  return (
    <div className="min-h-screen pt-28 pb-20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Quantum orb placeholder */}
        <div className="relative w-20 h-20">
          <div className="quantum-orb" />
          <div className="absolute inset-0 rounded-full border-2 border-[rgba(0,212,255,0.2)] animate-spin-slow" />
        </div>
        <div className="text-[#8899bb] text-sm font-mono animate-pulse">
          Loading optimizer…
        </div>
      </div>
    </div>
  );
}
