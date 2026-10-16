import React, { useState, useMemo } from 'react';
import { LiveRate } from '../types/exchange';
import { Plane, ShieldAlert, Wallet, CreditCard, ChevronRight } from 'lucide-react';

interface TravelPlannerProps {
  rates: Record<string, LiveRate>;
  onSelectCurrencyForChart: (code: string) => void;
}

interface DestinationPreset {
  id: string;
  name: string;
  country: string;
  currencyCode: string;
  flag: string;
  cashRecommendedPercent: number;
  typicalDailySGD: number;
  popularDurationDays: number;
  customsWarning?: string;
}

const DESTINATIONS: DestinationPreset[] = [
  {
    id: 'jb_malaysia',
    name: 'Johor Bahru / KL',
    country: 'Malaysia',
    currencyCode: 'MYR',
    flag: '🇲🇾',
    cashRecommendedPercent: 40,
    typicalDailySGD: 80,
    popularDurationDays: 1,
    customsWarning: 'Day trip <48 hours: S$100 GST relief threshold at Woodlands/Tuas Checkpoints.',
  },
  {
    id: 'tokyo_japan',
    name: 'Tokyo / Osaka',
    country: 'Japan',
    currencyCode: 'JPY',
    flag: '🇯🇵',
    cashRecommendedPercent: 30,
    typicalDailySGD: 200,
    popularDurationDays: 7,
    customsWarning: 'Trip ≥48 hours: S$500 GST import relief per traveller at Changi Airport.',
  },
  {
    id: 'bangkok_thailand',
    name: 'Bangkok / Phuket',
    country: 'Thailand',
    currencyCode: 'THB',
    flag: '🇹🇭',
    cashRecommendedPercent: 45,
    typicalDailySGD: 120,
    popularDurationDays: 4,
    customsWarning: 'Trip ≥48 hours: S$500 GST relief threshold.',
  },
  {
    id: 'bali_indonesia',
    name: 'Bali / Batam / Bintan',
    country: 'Indonesia',
    currencyCode: 'IDR',
    flag: '🇮🇩',
    cashRecommendedPercent: 40,
    typicalDailySGD: 90,
    popularDurationDays: 3,
    customsWarning: 'Batam/Bintan day trips <48h subject to S$100 GST threshold.',
  },
  {
    id: 'seoul_korea',
    name: 'Seoul / Busan',
    country: 'South Korea',
    currencyCode: 'KRW',
    flag: '🇰🇷',
    cashRecommendedPercent: 15,
    typicalDailySGD: 180,
    popularDurationDays: 6,
  },
  {
    id: 'london_uk',
    name: 'London / Edinburgh',
    country: 'United Kingdom',
    currencyCode: 'GBP',
    flag: '🇬🇧',
    cashRecommendedPercent: 5,
    typicalDailySGD: 250,
    popularDurationDays: 8,
  },
  {
    id: 'sydney_australia',
    name: 'Sydney / Melbourne',
    country: 'Australia',
    currencyCode: 'AUD',
    flag: '🇦🇺',
    cashRecommendedPercent: 5,
    typicalDailySGD: 220,
    popularDurationDays: 7,
  },
  {
    id: 'taipei_taiwan',
    name: 'Taipei / Kaohsiung',
    country: 'Taiwan',
    currencyCode: 'TWD',
    flag: '🇹🇼',
    cashRecommendedPercent: 40,
    typicalDailySGD: 130,
    popularDurationDays: 5,
  },
];

export const TravelPlanner: React.FC<TravelPlannerProps> = ({
  rates,
  onSelectCurrencyForChart,
}) => {
  const [selectedDestId, setSelectedDestId] = useState<string>('jb_malaysia');
  const [days, setDays] = useState<number>(3);
  const [dailyBudgetSGD, setDailyBudgetSGD] = useState<number>(150);

  const dest = useMemo(() => {
    return DESTINATIONS.find((d) => d.id === selectedDestId) || DESTINATIONS[0];
  }, [selectedDestId]);

  const handleSelectPreset = (d: DestinationPreset) => {
    setSelectedDestId(d.id);
    setDays(d.popularDurationDays);
    setDailyBudgetSGD(d.typicalDailySGD);
  };

  const totalBudgetSGD = days * dailyBudgetSGD;
  const rate = rates[dest.currencyCode]?.ratePerSGD || 1.0;
  const totalForeign = totalBudgetSGD * rate;

  const cashAmountSGD = totalBudgetSGD * (dest.cashRecommendedPercent / 100);
  const cardAmountSGD = totalBudgetSGD - cashAmountSGD;

  const cashForeign = cashAmountSGD * rate;
  const cardForeign = cardAmountSGD * rate;

  const isUnder48h = days < 2;
  const gstReliefSGD = isUnder48h ? 100 : 500;

  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl">
      {/* Title */}
      <div className="border-b border-slate-800 pb-6">
        <span className="text-xs font-semibold text-rose-500 tracking-wider uppercase">
          Singapore Holiday & Commute Planner
        </span>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
          Travel Cash & Card Allocation
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Calculate foreign currency needs, cash vs multi-currency card split, and Singapore Customs GST import relief rules.
        </p>
      </div>

      {/* Destination presets list */}
      <div className="mt-6">
        <label className="text-xs font-medium text-slate-400 mb-2 block">
          Choose destination:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => handleSelectPreset(d)}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                selectedDestId === d.id
                  ? 'border-rose-500 bg-rose-950/40 text-white shadow-sm'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="text-2xl mb-1" aria-hidden="true">{d.flag}</div>
              <div className="text-xs font-semibold truncate">{d.name}</div>
              <div className="text-[10px] text-slate-500">{d.currencyCode}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Inputs & Calculation grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Duration and Budget inputs */}
        <div className="lg:col-span-5 space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plane className="h-4 w-4 text-rose-500" />
            <span>Trip Parameters</span>
          </h3>

          <div>
            <label className="text-xs text-slate-400">Trip Length (Days):</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <span className="w-12 text-right font-tabular font-bold text-white text-sm">
                {days}d
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400">Daily Spending Budget (SGD per day):</label>
            <div className="mt-1 flex rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">
              <span className="text-slate-400 mr-2 text-sm font-semibold">S$</span>
              <input
                type="number"
                min="10"
                step="10"
                value={dailyBudgetSGD}
                onChange={(e) => setDailyBudgetSGD(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-transparent font-tabular text-sm font-bold text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Total Trip Outlay:</span>
              <span className="text-base font-bold font-tabular text-white">
                S$ {totalBudgetSGD.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 mt-1">
              <span>Current Spot FX:</span>
              <span className="font-tabular text-slate-300">
                1 SGD = {rate.toFixed(4)} {dest.currencyCode}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Cash vs Card breakdown & Singapore customs advice */}
        <div className="lg:col-span-7 space-y-4">
          {/* Output Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cash note box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Wallet className="h-4 w-4 text-amber-400" />
                  <span>Physical Cash ({dest.cashRecommendedPercent}%)</span>
                </span>
                <span className="text-[11px] text-slate-500">Night markets, hawkers</span>
              </div>
              <div className="text-xl font-bold font-tabular text-amber-400">
                {cashForeign.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                <span className="text-xs text-slate-400">{dest.currencyCode}</span>
              </div>
              <div className="text-xs font-tabular text-slate-500 mt-1">
                ≈ S$ {cashAmountSGD.toFixed(2)} (Exchange at The Arcade or Mustafa)
              </div>
            </div>

            {/* Multi currency card box */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <CreditCard className="h-4 w-4 text-cyan-400" />
                  <span>Multi-Currency Card ({100 - dest.cashRecommendedPercent}%)</span>
                </span>
                <span className="text-[11px] text-slate-500">YouTrip / Revolut</span>
              </div>
              <div className="text-xl font-bold font-tabular text-cyan-400">
                {cardForeign.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                <span className="text-xs text-slate-400">{dest.currencyCode}</span>
              </div>
              <div className="text-xs font-tabular text-slate-500 mt-1">
                ≈ S$ {cardAmountSGD.toFixed(2)} (Load into wallet before departure)
              </div>
            </div>
          </div>

          {/* Singapore Customs GST Import Relief Reminder */}
          <div className="rounded-xl border border-slate-800/90 bg-slate-950/50 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <ShieldAlert className="h-4 w-4" />
              <span>Singapore Customs GST Import Relief Guidelines</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              For goods purchased overseas and brought into Singapore for personal use, GST (9%) is exempt up to:{' '}
              <strong className="text-white">
                {isUnder48h ? 'S$100 (for trips <48 hours)' : 'S$500 (for trips ≥48 hours)'}
              </strong>
              . This applies to Singapore citizens, PRs, and tourists entering via Changi Airport, Seletar, or Woodlands/Tuas causeways.
            </p>
            {dest.customsWarning && (
              <p className="text-amber-400 font-medium">
                Note for {dest.name}: {dest.customsWarning}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
