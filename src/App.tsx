/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Converter } from './components/Converter';
import { RatesTable } from './components/RatesTable';
import { HistoricalChart } from './components/HistoricalChart';
import { SingaporeSpreads } from './components/SingaporeSpreads';
import { TravelPlanner } from './components/TravelPlanner';
import { RateAlertModal } from './components/RateAlertModal';
import { Footer } from './components/Footer';
import { fetchLiveRates, getBaselineRates, getSingaporeTimeString } from './services/exchangeRateService';
import { LiveRate, RateAlert } from './types/exchange';
import { Bell, ShieldCheck, ArrowUpRight, TrendingUp } from 'lucide-react';

const STORAGE_KEY_WATCHLIST = 'singaforex_watchlist';
const STORAGE_KEY_ALERTS = 'singaforex_alerts';

export default function App() {
  const [rates, setRates] = useState<Record<string, LiveRate>>(() => getBaselineRates());
  const [lastUpdated, setLastUpdated] = useState<string>(() => getSingaporeTimeString());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('converter');

  // Conversion selection state
  const [fromCurrency, setFromCurrency] = useState<string>('SGD');
  const [toCurrency, setToCurrency] = useState<string>('MYR');
  const [chartCurrency, setChartCurrency] = useState<string>('MYR');

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WATCHLIST);
      return saved ? JSON.parse(saved) : ['MYR', 'JPY', 'USD', 'THB', 'EUR'];
    } catch {
      return ['MYR', 'JPY', 'USD', 'THB', 'EUR'];
    }
  });

  // Rate alerts state
  const [alerts, setAlerts] = useState<RateAlert[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ALERTS);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'sample-1',
              targetCurrency: 'MYR',
              condition: 'above',
              targetRate: 3.35,
              createdAt: new Date().toISOString(),
              active: true,
            },
          ];
    } catch {
      return [];
    }
  });
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);

  // Section element refs for smooth scrolling
  const converterRef = useRef<HTMLDivElement>(null);
  const ratesRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const spreadsRef = useRef<HTMLDivElement>(null);
  const travelRef = useRef<HTMLDivElement>(null);

  // Load live rates
  const loadRates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchLiveRates();
      setRates(result.rates);
      setLastUpdated(result.timestamp);
    } catch {
      // Keep existing rates
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
    // Auto-refresh interval (every 45s)
    const interval = setInterval(() => {
      loadRates();
    }, 45000);
    return () => clearInterval(interval);
  }, [loadRates]);

  // Persist watchlist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(watchlist));
    } catch {
      // ignore
    }
  }, [watchlist]);

  // Persist alerts
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
    } catch {
      // ignore
    }
  }, [alerts]);

  const handleToggleWatchlist = (code: string) => {
    setWatchlist((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleAddAlert = (alertData: Omit<RateAlert, 'id' | 'createdAt'>) => {
    const newAlert: RateAlert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    let targetRef: React.RefObject<HTMLDivElement | null> | null = null;
    if (section === 'converter') targetRef = converterRef;
    if (section === 'rates') targetRef = ratesRef;
    if (section === 'chart') targetRef = chartRef;
    if (section === 'spreads') targetRef = spreadsRef;
    if (section === 'travel') targetRef = travelRef;

    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleViewChart = (code: string) => {
    setChartCurrency(code);
    scrollToSection('chart');
  };

  const handleSelectCurrencyForConverter = (code: string) => {
    setFromCurrency('SGD');
    setToCurrency(code);
    scrollToSection('converter');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={loadRates}
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Market Highlights Ticker Strip (Singapore Focus) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { code: 'MYR', flag: '🇲🇾', name: 'Ringgit' },
            { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
            { code: 'JPY', flag: '🇯🇵', name: 'Yen' },
            { code: 'THB', flag: '🇹🇭', name: 'Baht' },
            { code: 'CNY', flag: '🇨🇳', name: 'Yuan' },
            { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
          ].map((item) => {
            const r = rates[item.code];
            const rateVal = r?.ratePerSGD ?? 0;
            const change = r?.change24hPercent ?? 0;
            const isPos = change >= 0;

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelectCurrencyForConverter(item.code)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 transition-all text-left"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span aria-hidden="true">{item.flag}</span>
                    <span className="font-semibold text-slate-200">SGD/{item.code}</span>
                  </div>
                  <div className="text-sm font-bold font-tabular text-white mt-0.5">
                    {rateVal.toLocaleString(undefined, {
                      minimumFractionDigits: rateVal > 100 ? 1 : 3,
                      maximumFractionDigits: rateVal > 100 ? 1 : 4,
                    })}
                  </div>
                </div>

                <div
                  className={`text-[11px] font-tabular font-medium flex items-center ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <ArrowUpRight
                    className={`h-3 w-3 ${!isPos ? 'rotate-90' : ''}`}
                  />
                  <span>{isPos ? `+${change}%` : `${change}%`}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Section 1: Core Converter (Anchor) */}
        <div ref={converterRef}>
          <Converter
            rates={rates}
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            onFromChange={setFromCurrency}
            onToChange={setToCurrency}
            onViewChart={handleViewChart}
          />
        </div>

        {/* Action strip: Set Rate Alerts modal button & MAS policy quick badge */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200">MAS Benchmark Reference:</span>
              <span className="ml-1">
                Rates calibrated against official trade-weighted S$NEER basket & live interbank feeds.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAlertModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors shrink-0 border border-slate-700"
          >
            <Bell className="h-3.5 w-3.5 text-rose-400" />
            <span>Set Target Rate Alert ({alerts.length})</span>
          </button>
        </div>

        {/* Section 2: High-Density Live Rates Matrix */}
        <div ref={ratesRef}>
          <RatesTable
            rates={rates}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectCurrency={handleSelectCurrencyForConverter}
            onViewChart={handleViewChart}
          />
        </div>

        {/* Section 3: Interactive Historical Trend Chart */}
        <div ref={chartRef}>
          <HistoricalChart
            selectedCurrency={chartCurrency}
            onSelectCurrency={setChartCurrency}
          />
        </div>

        {/* Section 4: Singapore Bank vs Money Changer vs Fintech Spreads */}
        <div ref={spreadsRef}>
          <SingaporeSpreads
            rates={rates}
            selectedCurrency={chartCurrency}
            onSelectCurrency={setChartCurrency}
            onConvertCurrency={handleSelectCurrencyForConverter}
          />
        </div>

        {/* Section 5: Travel Cash & Customs Import Relief Planner */}
        <div ref={travelRef}>
          <TravelPlanner
            rates={rates}
            onSelectCurrencyForChart={handleViewChart}
          />
        </div>
      </main>

      {/* Rate Alert Modal */}
      <RateAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        rates={rates}
        alerts={alerts}
        onAddAlert={handleAddAlert}
        onDeleteAlert={handleDeleteAlert}
      />

      {/* Footer */}
      <Footer onNavigate={scrollToSection} />
    </div>
  );
}
