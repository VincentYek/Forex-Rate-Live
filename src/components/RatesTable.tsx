import React, { useState, useMemo } from 'react';
import { Search, Star, ArrowUpRight, ArrowDownRight, ArrowRightLeft, SlidersHorizontal } from 'lucide-react';
import { CurrencyInfo, LiveRate } from '../types/exchange';
import { SUPPORTED_CURRENCIES } from '../data/currencies';

interface RatesTableProps {
  rates: Record<string, LiveRate>;
  watchlist: string[];
  onToggleWatchlist: (code: string) => void;
  onSelectCurrency: (code: string) => void;
  onViewChart: (code: string) => void;
}

type TabType = 'all' | 'asean' | 'g10' | 'asia_pacific' | 'watchlist';
type SortField = 'code' | 'rate' | 'change' | 'popularity';

export const RatesTable: React.FC<RatesTableProps> = ({
  rates,
  watchlist,
  onToggleWatchlist,
  onSelectCurrency,
  onViewChart,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('popularity');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filter list
  const filteredCurrencies = useMemo(() => {
    let list = [...SUPPORTED_CURRENCIES];

    // Filter by tab
    if (activeTab === 'watchlist') {
      list = list.filter((c) => watchlist.includes(c.code));
    } else if (activeTab === 'asean') {
      list = list.filter((c) => c.category === 'asean');
    } else if (activeTab === 'g10') {
      list = list.filter((c) => c.category === 'g10');
    } else if (activeTab === 'asia_pacific') {
      list = list.filter((c) => c.category === 'asia_pacific');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      const rateA = rates[a.code]?.ratePerSGD ?? 0;
      const rateB = rates[b.code]?.ratePerSGD ?? 0;
      const changeA = rates[a.code]?.change24hPercent ?? 0;
      const changeB = rates[b.code]?.change24hPercent ?? 0;

      let diff = 0;
      if (sortField === 'code') {
        diff = a.code.localeCompare(b.code);
      } else if (sortField === 'rate') {
        diff = rateA - rateB;
      } else if (sortField === 'change') {
        diff = changeA - changeB;
      } else if (sortField === 'popularity') {
        const popA = a.popularForSG ? 1 : 0;
        const popB = b.popularForSG ? 1 : 0;
        diff = popB - popA;
      }

      return sortAsc ? diff : -diff;
    });

    return list;
  }, [activeTab, searchQuery, sortField, sortAsc, rates, watchlist]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl">
      {/* Title & Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-semibold text-rose-500 tracking-wider uppercase">
            Market Board
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
            SGD Exchange Rates Matrix
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Live interbank bid/ask mid-market quotes against the Singapore Dollar (SGD).
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search currency, country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Segmented Controls (Tab Filters) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Currencies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('asean')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'asean'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ASEAN & Causeway
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('g10')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'g10'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            G10 Majors
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('asia_pacific')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'asia_pacific'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Asia-Pacific
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'watchlist'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="h-3 w-3" />
            <span>Watchlist ({watchlist.length})</span>
          </button>
        </div>

        {/* Quick sorting indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Sort by:</span>
          <button
            onClick={() => handleSort('popularity')}
            className={`hover:text-slate-300 ${sortField === 'popularity' ? 'text-rose-400 font-semibold' : ''}`}
          >
            Popular
          </button>
          <span>·</span>
          <button
            onClick={() => handleSort('change')}
            className={`hover:text-slate-300 ${sortField === 'change' ? 'text-rose-400 font-semibold' : ''}`}
          >
            24h Change
          </button>
          <span>·</span>
          <button
            onClick={() => handleSort('code')}
            className={`hover:text-slate-300 ${sortField === 'code' ? 'text-rose-400 font-semibold' : ''}`}
          >
            Code
          </button>
        </div>
      </div>

      {/* High-density Data Table */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-medium">
              <th className="py-3 px-4 w-10 text-center">Pin</th>
              <th
                onClick={() => handleSort('code')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                Currency
              </th>
              <th
                onClick={() => handleSort('rate')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white"
              >
                1 SGD Buys
              </th>
              <th className="py-3 px-4 text-right">
                Cost of 1 Unit (SGD)
              </th>
              <th
                onClick={() => handleSort('change')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white"
              >
                24h Change
              </th>
              <th className="py-3 px-4 text-center hidden lg:table-cell">
                24h Intraday Range
              </th>
              <th className="py-3 px-4 text-center hidden sm:table-cell">
                7D Trend
              </th>
              <th className="py-3 px-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCurrencies.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  {activeTab === 'watchlist'
                    ? 'Your watchlist is empty. Click the star icon next to any currency to pin it here.'
                    : 'No matching currencies found.'}
                </td>
              </tr>
            ) : (
              filteredCurrencies.map((curr) => {
                const live = rates[curr.code];
                const isPinned = watchlist.includes(curr.code);
                const rateVal = live?.ratePerSGD ?? 0;
                const inverseVal = live?.inverseRate ?? 0;
                const change = live?.change24hPercent ?? 0;
                const high = live?.high24h ?? rateVal;
                const low = live?.low24h ?? rateVal;
                const spark = live?.sparkline ?? [];

                // Format decimals based on scale
                const rateDecimals = rateVal >= 1000 ? 0 : rateVal >= 10 ? 2 : 4;
                const inverseDecimals = inverseVal < 0.001 ? 6 : inverseVal < 1 ? 4 : 2;

                return (
                  <tr
                    key={curr.code}
                    className="hover:bg-slate-900/50 transition-colors group"
                  >
                    {/* Pin button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleWatchlist(curr.code)}
                        aria-label={`Pin ${curr.code}`}
                        className="text-slate-600 hover:text-amber-400 transition-colors"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            isPinned ? 'fill-amber-400 text-amber-400' : ''
                          }`}
                        />
                      </button>
                    </td>

                    {/* Currency Name & Flag */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl shrink-0" aria-hidden="true">{curr.flag}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white font-tabular">{curr.code}</span>
                            <span className="text-slate-400 hidden sm:inline">· {curr.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">{curr.country}</span>
                        </div>
                      </div>
                    </td>

                    {/* 1 SGD buys */}
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-semibold font-tabular text-white">
                        {rateVal.toLocaleString(undefined, {
                          minimumFractionDigits: rateDecimals,
                          maximumFractionDigits: rateDecimals,
                        })}{' '}
                        <span className="text-xs text-slate-500">{curr.code}</span>
                      </span>
                    </td>

                    {/* Cost of 1 unit in SGD */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-tabular text-slate-300">
                        S${' '}
                        {inverseVal.toLocaleString(undefined, {
                          minimumFractionDigits: inverseDecimals,
                          maximumFractionDigits: inverseDecimals,
                        })}
                      </span>
                    </td>

                    {/* 24h Change */}
                    <td className="py-3 px-4 text-right">
                      <div
                        className={`inline-flex items-center gap-0.5 font-tabular font-medium ${
                          change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {change >= 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        <span>{change >= 0 ? `+${change}%` : `${change}%`}</span>
                      </div>
                    </td>

                    {/* Intraday Range Mini Bar */}
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <div className="w-36 mx-auto">
                        <div className="flex justify-between text-[10px] text-slate-500 font-tabular mb-1">
                          <span>{low.toFixed(rateVal > 100 ? 0 : 2)}</span>
                          <span>{high.toFixed(rateVal > 100 ? 0 : 2)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-slate-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(15, ((rateVal - low) / (high - low || 1)) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 7D Trend Mini Sparkline */}
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center">
                        {spark.length > 0 && (
                          <svg className="w-20 h-6 overflow-visible" viewBox="0 0 70 20">
                            {(() => {
                              const sMin = Math.min(...spark);
                              const sMax = Math.max(...spark);
                              const range = sMax - sMin || 1;
                              const pointsStr = spark
                                .map((val, idx) => {
                                  const x = (idx / (spark.length - 1)) * 70;
                                  const y = 18 - ((val - sMin) / range) * 16;
                                  return `${x},${y}`;
                                })
                                .join(' ');
                              return (
                                <polyline
                                  fill="none"
                                  stroke={change >= 0 ? '#34d399' : '#f87171'}
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={pointsStr}
                                />
                              );
                            })()}
                          </svg>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectCurrency(curr.code)}
                          title="Convert this currency"
                          className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewChart(curr.code)}
                          title="View historical trend chart"
                          className="px-2 py-1 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-[11px] font-medium text-slate-300 hover:text-white transition-colors"
                        >
                          Chart
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
