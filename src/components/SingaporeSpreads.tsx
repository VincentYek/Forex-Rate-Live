import React, { useState, useMemo } from 'react';
import { SINGAPORE_PROVIDERS, SUPPORTED_CURRENCIES } from '../data/currencies';
import { LiveRate } from '../types/exchange';
import { Building2, CreditCard, Banknote, HelpCircle, ExternalLink, ArrowRight } from 'lucide-react';

interface SingaporeSpreadsProps {
  rates: Record<string, LiveRate>;
  selectedCurrency: string;
  onSelectCurrency: (code: string) => void;
  onConvertCurrency: (code: string) => void;
}

export const SingaporeSpreads: React.FC<SingaporeSpreadsProps> = ({
  rates,
  selectedCurrency,
  onSelectCurrency,
  onConvertCurrency,
}) => {
  const [exchangeAmountSGD, setExchangeAmountSGD] = useState<string>('1000');

  const curr = useMemo(() => {
    return SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];
  }, [selectedCurrency]);

  const numAmount = useMemo(() => {
    const val = parseFloat(exchangeAmountSGD.replace(/,/g, ''));
    return isNaN(val) || val < 0 ? 0 : val;
  }, [exchangeAmountSGD]);

  const midMarketRate = rates[selectedCurrency]?.ratePerSGD || 1.0;
  const benchmarkTotal = numAmount * midMarketRate;

  // Compute breakdown for each provider
  const providerCalculations = useMemo(() => {
    return SINGAPORE_PROVIDERS.map((provider) => {
      const effectiveRate = midMarketRate * (1 - provider.markupPercent / 100);
      const totalForeign = (numAmount - provider.fixedFeeSGD) * effectiveRate;
      const differenceForeign = benchmarkTotal - totalForeign;
      const lossSGD = midMarketRate > 0 ? differenceForeign / midMarketRate : 0;

      return {
        ...provider,
        effectiveRate,
        totalForeign,
        differenceForeign,
        lossSGD,
      };
    });
  }, [midMarketRate, numAmount, benchmarkTotal]);

  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-semibold text-rose-500 tracking-wider uppercase">
            Singapore Market Comparison
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Banks vs Money Changers vs Fintech
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Compare real spreads across The Arcade (Raffles Place), Mustafa Centre, YouTrip, and local retail banks.
          </p>
        </div>

        {/* Currency & Amount Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5">
            <span className="text-xs text-slate-400">Exchange Amount:</span>
            <span className="text-sm font-semibold text-white">S$</span>
            <input
              type="text"
              value={exchangeAmountSGD}
              onChange={(e) => setExchangeAmountSGD(e.target.value.replace(/[^0-9.]/g, ''))}
              className="w-24 bg-transparent font-tabular text-sm font-bold text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5">
            <span className="text-xs text-slate-400">Target:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => onSelectCurrency(e.target.value)}
              className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Grid Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {providerCalculations.map((p) => {
          const isMid = p.id === 'midmarket';
          const isFintech = p.category === 'fintech';
          const isChanger = p.category === 'money_changer';
          const isBank = p.category === 'bank';

          return (
            <div
              key={p.id}
              className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all ${
                isMid
                  ? 'border-rose-500/60 bg-rose-950/20'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header line with icon */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {isChanger && <Banknote className="h-4 w-4 text-amber-400" />}
                    {isFintech && <CreditCard className="h-4 w-4 text-cyan-400" />}
                    {isBank && <Building2 className="h-4 w-4 text-slate-400" />}
                    {isMid && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                    <h3 className="font-semibold text-white text-sm leading-tight">{p.name}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {p.description}
                </p>

                {/* Rates & Received Amount */}
                <div className="space-y-3 border-t border-slate-800/80 pt-3">
                  <div>
                    <span className="text-[11px] text-slate-500">Effective Rate</span>
                    <div className="text-sm font-bold font-tabular text-slate-200">
                      1 SGD = {p.effectiveRate.toFixed(4)} {curr.code}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500">
                      You Receive for S${numAmount.toLocaleString()}
                    </span>
                    <div className="text-lg font-bold font-tabular text-rose-400">
                      {p.totalForeign.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{' '}
                      <span className="text-xs font-normal text-slate-300">{curr.code}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Markup / Spread:</span>
                      <span className="font-tabular font-medium text-slate-300">
                        {p.markupPercent === 0 ? '0.00% (Spot)' : `+${p.markupPercent.toFixed(2)}%`}
                      </span>
                    </div>

                    {!isMid && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Spread Cost vs Spot:</span>
                        <span className="font-tabular text-rose-400">
                          -S${p.lossSGD.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer location / tag */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                <span>{p.location}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Local Insider Travel Money Tip */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-200 font-semibold mb-1">
          <HelpCircle className="h-4 w-4 text-rose-500" />
          <span>Singaporean Money Exchange Best Practices:</span>
        </div>
        <ul className="space-y-1 ml-6 list-disc text-slate-400">
          <li>
            <strong>Physical Cash:</strong> If heading to Malaysia (JB Causeway) or markets in Thailand/Indonesia, physical cash from The Arcade (Raffles Place MRT) or Mustafa Centre provides tight spreads (~0.3% - 0.5%).
          </li>
          <li>
            <strong>Card Spending:</strong> For retail and dining in Japan, Australia, Europe, or the US, multi-currency cards (YouTrip, Revolut, Trust Bank) avoid standard 3.25% bank foreign transaction fees.
          </li>
          <li>
            <strong>Traditional Banks:</strong> DBS/POSB, OCBC, and UOB are ideal for large telegraphic wire transfers (T/T), but counter cash note rates typically incorporate a 1.2% - 1.8% retail spread.
          </li>
        </ul>
      </div>
    </section>
  );
};
