import React from 'react';

interface FooterProps {
  onNavigate: (section: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 mt-16 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">SingaForex</span>
            <span aria-hidden="true">·</span>
            <span>Singapore Dollar FX Exchange Engine</span>
          </div>
          <p className="leading-relaxed">
            Exchange rates provided are wholesale mid-market indicative quotes for informational purposes. Singapore retail money changers and commercial banks (DBS, OCBC, UOB) apply customary bid/ask spreads. Monetary Authority of Singapore (MAS) operates an exchange-rate-based monetary policy band (S$NEER).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-slate-400 shrink-0">
          <button
            onClick={() => onNavigate('converter')}
            className="hover:text-white transition-colors"
          >
            Converter
          </button>
          <button
            onClick={() => onNavigate('rates')}
            className="hover:text-white transition-colors"
          >
            Live Rates
          </button>
          <button
            onClick={() => onNavigate('chart')}
            className="hover:text-white transition-colors"
          >
            Historical Trends
          </button>
          <button
            onClick={() => onNavigate('spreads')}
            className="hover:text-white transition-colors"
          >
            Singapore Spreads
          </button>
          <button
            onClick={() => onNavigate('travel')}
            className="hover:text-white transition-colors"
          >
            Travel Budget
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-600">
        <span>© {new Date().getFullYear()} SingaForex. Republic of Singapore (UTC+08:00).</span>
        <span>MAS S$NEER Reference Framework · Real-time Interbank Feed</span>
      </div>
    </footer>
  );
};
