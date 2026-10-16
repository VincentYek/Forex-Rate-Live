import React, { useState } from 'react';
import { Bell, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { RateAlert, LiveRate } from '../types/exchange';
import { SUPPORTED_CURRENCIES } from '../data/currencies';

interface RateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: Record<string, LiveRate>;
  alerts: RateAlert[];
  onAddAlert: (alert: Omit<RateAlert, 'id' | 'createdAt'>) => void;
  onDeleteAlert: (id: string) => void;
}

export const RateAlertModal: React.FC<RateAlertModalProps> = ({
  isOpen,
  onClose,
  rates,
  alerts,
  onAddAlert,
  onDeleteAlert,
}) => {
  const [targetCurrency, setTargetCurrency] = useState<string>('MYR');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetRate, setTargetRate] = useState<string>('3.35');
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentRate = rates[targetCurrency]?.ratePerSGD || 1.0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(targetRate);
    if (isNaN(parsed) || parsed <= 0) return;

    onAddAlert({
      targetCurrency,
      condition,
      targetRate: parsed,
      active: true,
    });

    setSimulationStatus(`Alert armed! You will be notified when 1 SGD is ${condition} ${parsed} ${targetCurrency}`);
    setTimeout(() => setSimulationStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-white">SGD Rate Trigger Alerts</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form to create alert */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Currency</label>
              <select
                value={targetCurrency}
                onChange={(e) => {
                  setTargetCurrency(e.target.value);
                  const newRate = rates[e.target.value]?.ratePerSGD || 1.0;
                  setTargetRate((newRate * 1.01).toFixed(4));
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="above">Rises Above (≥)</option>
                <option value="below">Falls Below (≤)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">Target Rate (per 1 SGD)</label>
              <span className="text-[11px] text-slate-500 font-tabular">
                Current: 1 SGD = {currentRate.toFixed(4)} {targetCurrency}
              </span>
            </div>
            <input
              type="text"
              value={targetRate}
              onChange={(e) => setTargetRate(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="e.g. 3.3500"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white font-tabular focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-semibold text-white transition-colors"
          >
            Arm Rate Alert
          </button>
        </form>

        {simulationStatus && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{simulationStatus}</span>
          </div>
        )}

        {/* Active alerts list */}
        <div className="mt-6 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Active Alerts ({alerts.length})
          </h4>

          {alerts.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">
              No rate alerts set yet. Create one above to track favourable buying opportunities.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {alerts.map((a) => {
                const live = rates[a.targetCurrency]?.ratePerSGD || 1.0;
                const isTriggered =
                  a.condition === 'above' ? live >= a.targetRate : live <= a.targetRate;

                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-tabular">{a.targetCurrency}</span>
                        <span className="text-slate-400">
                          {a.condition === 'above' ? '≥' : '≤'} {a.targetRate.toFixed(4)}
                        </span>
                        {isTriggered && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                            TRIGGERED
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-tabular">
                        Current: {live.toFixed(4)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteAlert(a.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove alert"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
