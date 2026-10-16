import React, { useState, useMemo } from 'react';
import { TimePeriod, getHistoricalData } from '../services/exchangeRateService';
import { SUPPORTED_CURRENCIES } from '../data/currencies';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

interface HistoricalChartProps {
  selectedCurrency: string;
  onSelectCurrency: (code: string) => void;
}

const PERIODS: TimePeriod[] = ['24H', '7D', '1M', '3M', '1Y', '5Y'];

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  selectedCurrency,
  onSelectCurrency,
}) => {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('1M');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const currInfo = useMemo(() => {
    return SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];
  }, [selectedCurrency]);

  const history = useMemo(() => {
    return getHistoricalData(selectedCurrency, activePeriod);
  }, [selectedCurrency, activePeriod]);

  // Chart geometry
  const width = 800;
  const height = 280;
  const padTop = 20;
  const padBottom = 30;
  const padLeft = 10;
  const padRight = 50;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const yMin = history.min * 0.998;
  const yMax = history.max * 1.002;
  const yRange = yMax - yMin || 1;

  // Generate SVG coordinates
  const pointsCoords = useMemo(() => {
    const pts = history.points;
    if (pts.length === 0) return [];

    return pts.map((p, idx) => {
      const x = padLeft + (idx / (pts.length - 1)) * innerW;
      const y = padTop + innerH - ((p.rate - yMin) / yRange) * innerH;
      return { x, y, ...p };
    });
  }, [history.points, innerW, innerH, padLeft, padTop, yMin, yRange]);

  const pathD = useMemo(() => {
    if (pointsCoords.length === 0) return '';
    return pointsCoords.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  }, [pointsCoords]);

  const areaD = useMemo(() => {
    if (pointsCoords.length === 0) return '';
    const firstX = pointsCoords[0].x;
    const lastX = pointsCoords[pointsCoords.length - 1].x;
    const bottomY = padTop + innerH;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathD, pointsCoords, padTop, innerH]);

  const isPositive = history.pctChange >= 0;
  const activePoint = hoverIndex !== null ? pointsCoords[hoverIndex] : pointsCoords[pointsCoords.length - 1];

  return (
    <section className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl">
      {/* Header with pair selector & period tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-semibold text-rose-500 tracking-wider uppercase">
            Market Analytics
          </span>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{currInfo.flag}</span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              SGD / {currInfo.code} Trend
            </h2>
            <select
              value={selectedCurrency}
              onChange={(e) => onSelectCurrency(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Historical exchange rate of 1 Singapore Dollar into {currInfo.name}.
          </p>
        </div>

        {/* Time period segmented control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setActivePeriod(p);
                setHoverIndex(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activePeriod === p
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Metric highlight strip */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/50">
          <span className="text-xs text-slate-500">
            {hoverIndex !== null ? 'Selected Spot' : 'Latest Spot'}
          </span>
          <div className="mt-1 text-lg sm:text-xl font-bold font-tabular text-white">
            {activePoint ? activePoint.rate.toFixed(4) : history.endRate.toFixed(4)}{' '}
            <span className="text-xs text-slate-400">{currInfo.code}</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {activePoint?.formattedDate || 'Current'}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/50">
          <span className="text-xs text-slate-500">{activePeriod} Net Change</span>
          <div
            className={`mt-1 flex items-center gap-1 text-lg sm:text-xl font-bold font-tabular ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span>{isPositive ? `+${history.pctChange}%` : `${history.pctChange}%`}</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {(history.endRate - history.startRate).toFixed(4)} pts
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/50">
          <span className="text-xs text-slate-500">{activePeriod} Range Low</span>
          <div className="mt-1 text-lg sm:text-xl font-semibold font-tabular text-slate-300">
            {history.min.toFixed(4)}
          </div>
          <span className="text-[11px] text-slate-500">Floor level</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/50">
          <span className="text-xs text-slate-500">{activePeriod} Range High</span>
          <div className="mt-1 text-lg sm:text-xl font-semibold font-tabular text-slate-300">
            {history.max.toFixed(4)}
          </div>
          <span className="text-[11px] text-slate-500">Ceiling level</span>
        </div>
      </div>

      {/* Interactive SVG Area Chart */}
      <div className="mt-6 relative rounded-xl border border-slate-800/80 bg-slate-950 p-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-64 sm:h-72 cursor-crosshair select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.clientX - rect.left;
            const normX = (clientX / rect.width) * width;
            // find nearest point
            let closestIdx = 0;
            let closestDist = Infinity;
            pointsCoords.forEach((pt, i) => {
              const d = Math.abs(pt.x - normX);
              if (d < closestDist) {
                closestDist = d;
                closestIdx = i;
              }
            });
            setHoverIndex(closestIdx);
          }}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={width - padRight}
            y2={padTop}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={padLeft}
            y1={padTop + innerH / 2}
            x2={width - padRight}
            y2={padTop + innerH / 2}
            stroke="#1e293b"
            strokeDasharray="4 4"
          />
          <line
            x1={padLeft}
            y1={padTop + innerH}
            x2={width - padRight}
            y2={padTop + innerH}
            stroke="#1e293b"
          />

          {/* Axis labels */}
          <text
            x={width - padRight + 6}
            y={padTop + 4}
            fill="#64748b"
            fontSize="10"
            className="font-tabular"
          >
            {yMax.toFixed(2)}
          </text>
          <text
            x={width - padRight + 6}
            y={padTop + innerH / 2 + 3}
            fill="#64748b"
            fontSize="10"
            className="font-tabular"
          >
            {((yMax + yMin) / 2).toFixed(2)}
          </text>
          <text
            x={width - padRight + 6}
            y={padTop + innerH}
            fill="#64748b"
            fontSize="10"
            className="font-tabular"
          >
            {yMin.toFixed(2)}
          </text>

          {/* Area fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover crosshair & point */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padTop}
                x2={activePoint.x}
                y2={padTop + innerH}
                stroke="#fda4af"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill="#e11d48"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Dynamic Tooltip */}
        {activePoint && hoverIndex !== null && (
          <div
            className="absolute top-6 left-6 pointer-events-none rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
          >
            <div className="text-slate-400">{activePoint.formattedDate}</div>
            <div className="font-bold text-white font-tabular text-sm">
              1 SGD = {activePoint.rate.toFixed(4)} {currInfo.code}
            </div>
          </div>
        )}
      </div>

      {/* MAS Monetary Policy Framework Note */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
        <Info className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-200">
            Monetary Authority of Singapore (MAS) Policy Context:
          </span>
          <p>
            Unlike most global central banks that manage domestic interest rates, MAS conducts monetary policy through the Singapore Dollar Nominal Effective Exchange Rate (S$NEER). The currency is managed against a trade-weighted basket within an undisclosed policy band to ensure medium-term price stability.
          </p>
        </div>
      </div>
    </section>
  );
};
