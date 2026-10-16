import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Copy, Check, Search, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { CurrencyInfo, LiveRate } from '../types/exchange';
import { SUPPORTED_CURRENCIES } from '../data/currencies';

interface ConverterProps {
  rates: Record<string, LiveRate>;
  fromCurrency: string;
  toCurrency: string;
  onFromChange: (code: string) => void;
  onToChange: (code: string) => void;
  onViewChart: (code: string) => void;
}

const QUICK_AMOUNTS = [50, 100, 500, 1000, 5000, 10000];

export const Converter: React.FC<ConverterProps> = ({
  rates,
  fromCurrency,
  toCurrency,
  onFromChange,
  onToChange,
  onViewChart,
}) => {
  const [amount, setAmount] = useState<string>('1000');
  const [copied, setCopied] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const numAmount = useMemo(() => {
    const val = parseFloat(amount.replace(/,/g, ''));
    return isNaN(val) || val < 0 ? 0 : val;
  }, [amount]);

  // Currency metadata
  const fromInfo = useMemo(() => {
    if (fromCurrency === 'SGD') {
      return {
        code: 'SGD',
        name: 'Singapore Dollar',
        symbol: 'S$',
        flag: '🇸🇬',
        country: 'Singapore',
        category: 'asean' as const,
      };
    }
    return SUPPORTED_CURRENCIES.find((c) => c.code === fromCurrency) || SUPPORTED_CURRENCIES[0];
  }, [fromCurrency]);

  const toInfo = useMemo(() => {
    if (toCurrency === 'SGD') {
      return {
        code: 'SGD',
        name: 'Singapore Dollar',
        symbol: 'S$',
        flag: '🇸🇬',
        country: 'Singapore',
        category: 'asean' as const,
      };
    }
    return SUPPORTED_CURRENCIES.find((c) => c.code === toCurrency) || SUPPORTED_CURRENCIES[0];
  }, [toCurrency]);

  // Calculate rate from -> to
  // If from === 'SGD', rate = rates[toCurrency]?.ratePerSGD
  // If to === 'SGD', rate = 1 / rates[fromCurrency]?.ratePerSGD
  // If cross rate (e.g. MYR -> JPY), rate = rates[to]?.ratePerSGD / rates[from]?.ratePerSGD
  const exchangeRate = useMemo(() => {
    if (fromCurrency === toCurrency) return 1.0;
    if (fromCurrency === 'SGD') {
      return rates[toCurrency]?.ratePerSGD || 1.0;
    }
    if (toCurrency === 'SGD') {
      const fromRate = rates[fromCurrency]?.ratePerSGD;
      return fromRate && fromRate > 0 ? 1 / fromRate : 1.0;
    }
    // Cross rate
    const fromRate = rates[fromCurrency]?.ratePerSGD;
    const toRate = rates[toCurrency]?.ratePerSGD;
    if (fromRate && toRate && fromRate > 0) {
      return toRate / fromRate;
    }
    return 1.0;
  }, [fromCurrency, toCurrency, rates]);

  const inverseRate = useMemo(() => {
    return exchangeRate > 0 ? 1 / exchangeRate : 0;
  }, [exchangeRate]);

  const convertedResult = useMemo(() => {
    return numAmount * exchangeRate;
  }, [numAmount, exchangeRate]);

  // 24h change for the pair
  const change24h = useMemo(() => {
    if (fromCurrency === 'SGD') {
      return rates[toCurrency]?.change24hPercent ?? 0;
    }
    if (toCurrency === 'SGD') {
      return -(rates[fromCurrency]?.change24hPercent ?? 0);
    }
    return 0;
  }, [fromCurrency, toCurrency, rates]);

  const handleSwap = () => {
    const prevFrom = fromCurrency;
    onFromChange(toCurrency);
    onToChange(prevFrom);
  };

  const handleCopySummary = () => {
    const text = `${numAmount.toLocaleString()} ${fromCurrency} = ${convertedResult.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })} ${toCurrency} (1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency} via SingaForex SGT)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter currency list for search modal
  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const all = [
      {
        code: 'SGD',
        name: 'Singapore Dollar',
        symbol: 'S$',
        flag: '🇸🇬',
        country: 'Singapore',
        category: 'asean' as const,
        popularForSG: true,
      },
      ...SUPPORTED_CURRENCIES,
    ];

    if (!q) return all;
    return all.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Bank vs Midmarket comparison figures
  const bankMarkupRate = exchangeRate * 0.9855; // ~1.45% bank retail spread
  const bankReceived = numAmount * bankMarkupRate;
  const differenceTarget = convertedResult - bankReceived;

  return (
    <section className="relative w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-sm">
      {/* Editorial context header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="text-xs font-semibold text-rose-500 tracking-wider uppercase">
            Singapore Dollar FX Engine
          </span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Real-Time Currency Converter
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Wholesale interbank rates benchmarked against Monetary Authority of Singapore (MAS) reference levels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewChart(fromCurrency === 'SGD' ? toCurrency : fromCurrency)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors py-1.5 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/40"
          >
            <span>View Historical Chart</span>
            <ArrowRight className="h-3 w-3 text-rose-500" />
          </button>
        </div>
      </div>

      {/* Main Converter Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Input Amount & From Currency (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <label className="text-xs font-medium text-slate-400">You send</label>
          <div className="flex rounded-xl border border-slate-700 bg-slate-950 p-2 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500 transition-all">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setAmount(val);
              }}
              placeholder="0.00"
              className="w-full bg-transparent px-3 text-2xl sm:text-3xl font-semibold text-white font-tabular focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchModalOpen('from');
              }}
              className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-3.5 py-2 hover:bg-slate-800 transition-colors shrink-0"
            >
              <span className="text-xl" aria-hidden="true">{fromInfo.flag}</span>
              <span className="text-sm font-bold text-white tracking-wide">{fromInfo.code}</span>
            </button>
          </div>

          {/* Quick Amount presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-xs text-slate-500 mr-1">Quick:</span>
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                className={`text-xs font-tabular py-1 px-2.5 rounded-md border transition-colors ${
                  numAmount === amt
                    ? 'border-rose-500/80 bg-rose-950/40 text-rose-300'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {fromCurrency === 'SGD' ? `S$${amt.toLocaleString()}` : `${amt.toLocaleString()}`}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Swap Affordance (2 cols) */}
        <div className="lg:col-span-2 flex justify-center py-2 lg:py-0">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap currencies"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 hover:border-rose-500 hover:text-rose-400 hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <ArrowUpDown className="h-5 w-5" />
          </button>
        </div>

        {/* Right: Output Amount & To Currency (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <label className="text-xs font-medium text-slate-400">Recipient receives (Mid-Market)</label>
          <div className="flex rounded-xl border border-slate-700 bg-slate-950 p-2">
            <div className="w-full px-3 py-2 text-2xl sm:text-3xl font-semibold text-rose-400 font-tabular overflow-x-auto whitespace-nowrap">
              {convertedResult.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchModalOpen('to');
              }}
              className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-3.5 py-2 hover:bg-slate-800 transition-colors shrink-0"
            >
              <span className="text-xl" aria-hidden="true">{toInfo.flag}</span>
              <span className="text-sm font-bold text-white tracking-wide">{toInfo.code}</span>
            </button>
          </div>

          {/* Rate Formula & Inverse */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 px-1">
            <span className="font-tabular">
              1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
            </span>
            <span className="font-tabular text-slate-500">
              1 {toCurrency} = {inverseRate.toFixed(4)} {fromCurrency}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Banner & Fee Comparison Strip */}
      <div className="mt-8 rounded-xl border border-slate-800/80 bg-slate-950/70 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white">
                {numAmount.toLocaleString()} {fromCurrency} ={' '}
                <span className="text-rose-400 font-tabular font-bold">
                  {convertedResult.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {toCurrency}
                </span>
              </span>

              {change24h !== 0 && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-tabular ${
                    change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {change24h >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {change24h >= 0 ? `+${change24h}%` : `${change24h}%`} (24h)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Zero-margin interbank spot rate</span>
              <span aria-hidden="true">·</span>
              <span>
                Standard Singapore retail bank markup (~1.45%) yields{' '}
                <span className="font-tabular text-slate-300">
                  {bankReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency}
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-medium">
                Save ~{differenceTarget.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy Rate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Currency Selection Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                Select {searchModalOpen === 'from' ? 'Source' : 'Target'} Currency
              </h3>
              <button
                type="button"
                onClick={() => setSearchModalOpen(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                Close
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search by code or country (e.g. MYR, Malaysia, Yen)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Currencies Grid List */}
            <div className="mt-4 max-h-80 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-800/40">
              {filteredCurrencies.map((c) => {
                const isSelected =
                  searchModalOpen === 'from' ? fromCurrency === c.code : toCurrency === c.code;

                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      if (searchModalOpen === 'from') {
                        onFromChange(c.code);
                      } else {
                        onToChange(c.code);
                      }
                      setSearchModalOpen(null);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'bg-rose-950/40 border border-rose-800/60'
                        : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden="true">{c.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-tabular">{c.code}</span>
                          <span className="text-xs text-slate-400">· {c.name}</span>
                        </div>
                        <div className="text-xs text-slate-500">{c.country}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {c.code !== 'SGD' && rates[c.code] && (
                        <div className="text-xs font-tabular text-slate-300">
                          1 SGD = {rates[c.code].ratePerSGD.toFixed(2)} {c.code}
                        </div>
                      )}
                      {isSelected && (
                        <span className="text-xs font-medium text-rose-400">Selected</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
