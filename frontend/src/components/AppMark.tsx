export function AppMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 sm:gap-3 group select-none cursor-default">
      {/* Icon Badge Container */}
      <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20 cursor-default">
        {/* Bank Landmark SVG with generous headroom */}
        <svg
          className="h-4 w-4 sm:h-5 sm:w-5 overflow-visible text-white pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Base Foundation */}
          <line x1="3" y1="21" x2="21" y2="21" />

          {/* Roof Hut */}
          <polygon points="12 4.5 20 9.5 4 9.5" className="animate-roof" />

          {/* Pillars */}
          <line x1="6" y1="18.5" x2="6" y2="12.5" className="animate-pillar-1" />
          <line x1="10" y1="18.5" x2="10" y2="12.5" className="animate-pillar-2" />
          <line x1="14" y1="18.5" x2="14" y2="12.5" className="animate-pillar-3" />
          <line x1="18" y1="18.5" x2="18" y2="12.5" className="animate-pillar-4" />
        </svg>
      </div>

      {!compact && (
        <div className="flex flex-col select-none cursor-default">
          <span className="hidden sm:inline text-sm sm:text-base font-extrabold tracking-tight text-slate-900">
            Loan Management System
          </span>
          <span className="sm:hidden text-sm font-extrabold tracking-tight text-slate-900">
            LMS
          </span>
        </div>
      )}
    </div>
  );
}
