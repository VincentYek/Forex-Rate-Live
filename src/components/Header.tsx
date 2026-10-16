import React from 'react';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdated,
  isRefreshing,
  onRefresh,
  activeSection,
  onNavigate,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand wordmark (single element, clean display) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-base shadow-sm shadow-rose-900/40">
            S$
          </div>
          <button
            onClick={() => onNavigate('converter')}
            className="text-left text-lg font-bold tracking-tight text-white hover:text-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            SingaForex
          </button>
        </div>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            onClick={() => onNavigate('converter')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeSection === 'converter' ? 'text-white font-semibold' : ''
            }`}
          >
            Converter
          </button>
          <button
            onClick={() => onNavigate('rates')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeSection === 'rates' ? 'text-white font-semibold' : ''
            }`}
          >
            Live Rates
          </button>
          <button
            onClick={() => onNavigate('chart')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeSection === 'chart' ? 'text-white font-semibold' : ''
            }`}
          >
            Historical Trends
          </button>
          <button
            onClick={() => onNavigate('spreads')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeSection === 'spreads' ? 'text-white font-semibold' : ''
            }`}
          >
            Singapore Spreads
          </button>
          <button
            onClick={() => onNavigate('travel')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
              activeSection === 'travel' ? 'text-white font-semibold' : ''
            }`}
          >
            Travel Budget
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden lg:inline-block text-xs font-tabular text-slate-400">
            {lastUpdated}
          </span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-700/80 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white active:bg-slate-700 disabled:opacity-60 whitespace-nowrap shrink-0"
            title="Refresh real-time rates"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-rose-500 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
