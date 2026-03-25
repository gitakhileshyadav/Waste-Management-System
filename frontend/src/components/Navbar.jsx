import { Activity } from "lucide-react";

export default function Navbar({ isConnected }) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-30 px-6 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary)] flex items-center justify-center">
          <span className="text-white font-bold text-lg leading-none mt-[-2px]">S</span>
        </div>
        <span className="font-bold text-xl text-[var(--color-brand-primary)] tracking-tight">SwachhTech</span>
      </div>

      {/* Center (hidden on small screens) */}
      <div className="hidden md:block">
        <h1 className="text-sm font-semibold text-[var(--color-brand-text)] uppercase tracking-wider">
          Waste Intelligence Dashboard
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 bg-[var(--color-brand-surface)] px-3 py-1.5 rounded-full border border-gray-200">
        <div className="relative flex h-2.5 w-2.5">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
        </div>
        <span className="text-xs font-medium text-[var(--color-brand-text-secondary)]">
          {isConnected ? "Live Data" : "Disconnected"}
        </span>
      </div>
    </header>
  );
}
