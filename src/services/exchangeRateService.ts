import { ChartDataPoint, LiveRate } from '../types/exchange';
import { BASELINE_RATES_SGD, SUPPORTED_CURRENCIES } from '../data/currencies';

const STORAGE_KEY_RATES = 'singaforex_live_rates_v1';
const STORAGE_KEY_LAST_FETCH = 'singaforex_last_fetch_timestamp';

// Helper to get formatted Singapore Time
export function getSingaporeTimeString(date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-SG', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date) + ' SGT';
  } catch {
    return date.toLocaleTimeString() + ' SGT';
  }
}

// Generate realistic 7-point sparkline for a given base rate and 24h change
function generateSparkline(baseRate: number, changePercent: number): number[] {
  const points = 7;
  const startRate = baseRate / (1 + changePercent / 100);
  const result: number[] = [startRate];

  for (let i = 1; i < points - 1; i++) {
    const progress = i / (points - 1);
    const noise = (Math.sin(i * 1.8) * 0.4 + (Math.random() - 0.5) * 0.3) * (baseRate * 0.005);
    const interpolated = startRate + (baseRate - startRate) * progress + noise;
    result.push(Number(interpolated.toFixed(4)));
  }
  result.push(Number(baseRate.toFixed(4)));
  return result;
}

// Build standard rate object
export function buildRateRecord(
  code: string,
  rawRate: number,
  changePercent?: number
): LiveRate {
  const baseEntry = BASELINE_RATES_SGD[code] || { rate: rawRate, change24h: 0.1 };
  const effectiveChange = changePercent !== undefined ? changePercent : baseEntry.change24h;
  
  // Calculate high/low
  const spread = Math.abs(rawRate * 0.0065);
  const high = rawRate + spread * 0.7;
  const low = rawRate - spread * 0.6;
  const pointsDelta = rawRate - (rawRate / (1 + effectiveChange / 100));

  return {
    code,
    ratePerSGD: rawRate,
    inverseRate: rawRate > 0 ? 1 / rawRate : 0,
    change24hPercent: Number(effectiveChange.toFixed(2)),
    change24hPoints: Number(pointsDelta.toFixed(4)),
    high24h: Number(high.toFixed(4)),
    low24h: Number(low.toFixed(4)),
    lastUpdated: getSingaporeTimeString(),
    sparkline: generateSparkline(rawRate, effectiveChange),
  };
}

// Fallback rates using baseline
export function getBaselineRates(): Record<string, LiveRate> {
  const map: Record<string, LiveRate> = {};
  for (const curr of SUPPORTED_CURRENCIES) {
    const baseline = BASELINE_RATES_SGD[curr.code];
    const rate = baseline ? baseline.rate : 1.0;
    const change = baseline ? baseline.change24h : 0.0;
    map[curr.code] = buildRateRecord(curr.code, rate, change);
  }
  return map;
}

// Fetch live rates from open API with fallback
export async function fetchLiveRates(): Promise<{
  rates: Record<string, LiveRate>;
  source: 'live-api' | 'cached' | 'fallback';
  timestamp: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch('https://open.er-api.com/v6/latest/SGD', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        const ratesMap: Record<string, LiveRate> = {};
        for (const curr of SUPPORTED_CURRENCIES) {
          const apiRate = data.rates[curr.code];
          if (apiRate && typeof apiRate === 'number') {
            const baseline = BASELINE_RATES_SGD[curr.code];
            const change = baseline ? baseline.change24h : (Math.random() - 0.45) * 0.5;
            ratesMap[curr.code] = buildRateRecord(curr.code, apiRate, change);
          } else {
            // fallback for this specific currency if missing
            const baseline = BASELINE_RATES_SGD[curr.code] || { rate: 1, change24h: 0 };
            ratesMap[curr.code] = buildRateRecord(curr.code, baseline.rate, baseline.change24h);
          }
        }
        
        const timestamp = getSingaporeTimeString();
        try {
          localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(ratesMap));
          localStorage.setItem(STORAGE_KEY_LAST_FETCH, timestamp);
        } catch {
          // ignore storage error
        }

        return { rates: ratesMap, source: 'live-api', timestamp };
      }
    }
  } catch {
    // Network failed or offline or aborted
  }

  // Try cached rates
  try {
    const cached = localStorage.getItem(STORAGE_KEY_RATES);
    const cachedTime = localStorage.getItem(STORAGE_KEY_LAST_FETCH);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        rates: parsed,
        source: 'cached',
        timestamp: cachedTime || getSingaporeTimeString(),
      };
    }
  } catch {
    // ignore
  }

  // Fallback to baseline
  return {
    rates: getBaselineRates(),
    source: 'fallback',
    timestamp: getSingaporeTimeString(),
  };
}

// Generate historical chart points for any period
export type TimePeriod = '24H' | '7D' | '1M' | '3M' | '1Y' | '5Y';

export function getHistoricalData(currencyCode: string, period: TimePeriod): {
  points: ChartDataPoint[];
  min: number;
  max: number;
  startRate: number;
  endRate: number;
  pctChange: number;
} {
  const baseline = BASELINE_RATES_SGD[currencyCode]?.rate || 1.0;
  const points: ChartDataPoint[] = [];

  let count = 24;
  let intervalMs = 3600 * 1000; // 1 hour for 24H
  let trendSlope = 0.0002;
  let volatility = 0.002;

  // Domain calibration per currency
  if (currencyCode === 'MYR') {
    trendSlope = 0.0012; // SGD appreciating against MYR historically
    volatility = 0.003;
  } else if (currencyCode === 'JPY') {
    trendSlope = 0.0025; // Significant JPY moves in recent periods
    volatility = 0.006;
  } else if (currencyCode === 'USD') {
    trendSlope = -0.0003; // Stable range
    volatility = 0.0025;
  } else if (currencyCode === 'IDR') {
    volatility = 0.004;
    trendSlope = 0.001;
  }

  switch (period) {
    case '24H':
      count = 24;
      intervalMs = 3600 * 1000;
      volatility = 0.0015;
      break;
    case '7D':
      count = 28;
      intervalMs = (7 * 24 * 3600 * 1000) / count;
      volatility = 0.0035;
      break;
    case '1M':
      count = 30;
      intervalMs = (30 * 24 * 3600 * 1000) / count;
      volatility = 0.007;
      break;
    case '3M':
      count = 45;
      intervalMs = (90 * 24 * 3600 * 1000) / count;
      volatility = 0.012;
      break;
    case '1Y':
      count = 52;
      intervalMs = (365 * 24 * 3600 * 1000) / count;
      volatility = 0.025;
      break;
    case '5Y':
      count = 60;
      intervalMs = (5 * 365 * 24 * 3600 * 1000) / count;
      volatility = 0.05;
      break;
  }

  const now = Date.now();
  const startTime = now - count * intervalMs;
  let currentVal = baseline * (1 - trendSlope * count * 0.6);

  for (let i = 0; i <= count; i++) {
    const t = new Date(startTime + i * intervalMs);
    const progress = i / count;
    // Harmonic wave + seeded random noise
    const wave = Math.sin(progress * Math.PI * 3.5) * (baseline * volatility * 0.4);
    const microJitter = (Math.sin(i * 13.7) * 0.5 + Math.cos(i * 7.1) * 0.5) * (baseline * volatility * 0.25);
    const stepVal = currentVal + (baseline - currentVal) * progress + wave + microJitter;

    let formattedDate = '';
    if (period === '24H') {
      formattedDate = t.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (period === '7D' || period === '1M') {
      formattedDate = t.toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
    } else {
      formattedDate = t.toLocaleDateString('en-SG', { month: 'short', year: '2-digit' });
    }

    points.push({
      date: t.toISOString(),
      rate: Number(stepVal.toFixed(4)),
      formattedDate,
    });
  }

  // Ensure last point aligns with current baseline rate
  if (points.length > 0) {
    points[points.length - 1].rate = baseline;
  }

  const rates = points.map((p) => p.rate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const startRate = rates[0];
  const endRate = rates[rates.length - 1];
  const pctChange = Number((((endRate - startRate) / startRate) * 100).toFixed(2));

  return { points, min, max, startRate, endRate, pctChange };
}
