import type { Request, Response } from 'express';

const MAS_API_BASE_URL =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610ora/exchange_rates_end_of_period_daily/views/exchange_rates_end_of_period_daily';

// Helper to determine the latest business day formatted as YYYY-MM-DD in Singapore Time
export function getLatestBusinessDaySGT(): string {
  try {
    const now = new Date();
    // Use Singapore timezone
    const sgDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const [year, month, day] = sgDateStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    
    // If today is Sunday (0), go back 2 days to Friday; if Saturday (6), go back 1 day to Friday
    const dayOfWeek = dateObj.getUTCDay();
    if (dayOfWeek === 0) {
      dateObj.setUTCDate(dateObj.getUTCDate() - 2);
    } else if (dayOfWeek === 6) {
      dateObj.setUTCDate(dateObj.getUTCDate() - 1);
    } else {
      // For current day, MAS updates at end of day, so default to previous business day
      dateObj.setUTCDate(dateObj.getUTCDate() - 1);
      if (dateObj.getUTCDay() === 0) {
        dateObj.setUTCDate(dateObj.getUTCDate() - 2);
      }
    }

    return dateObj.toISOString().split('T')[0];
  } catch {
    return '2026-10-14';
  }
}

/**
 * Normalizes MAS field names (e.g. usd_sgd, myr_sgd_100, jpy_sgd_100)
 * into standard rates per 1 SGD
 */
export function normalizeMasRates(masRecord: Record<string, any>): Record<string, number> {
  const normalized: Record<string, number> = {};

  for (const [key, rawVal] of Object.entries(masRecord)) {
    const val = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal);
    if (isNaN(val) || val <= 0) continue;

    // Direct 1 Unit: Currency per SGD or SGD per Currency
    // MAS Monthly Statistical Bulletin quotes rates as:
    // Units of SGD per 1 unit of foreign currency (e.g. usd_sgd = 1.3135 -> 1 USD = 1.3135 SGD)
    // Or per 100 units of foreign currency (e.g. myr_sgd_100 = 30.08 -> 100 MYR = 30.08 SGD)
    const lowerKey = key.toLowerCase();

    // Check for "per 100 units" fields (e.g., jpy_sgd_100, myr_sgd_100, idr_sgd_100)
    const match100 = lowerKey.match(/^([a-z]{3})_sgd_100$/);
    if (match100) {
      const code = match100[1].toUpperCase();
      const sgdPerSingleForeignUnit = val / 100;
      // 1 SGD = (1 / sgdPerSingleForeignUnit) Foreign Units
      normalized[code] = Number((1 / sgdPerSingleForeignUnit).toFixed(6));
      continue;
    }

    // Check for "per 1 unit" fields (e.g., usd_sgd, eur_sgd, gbp_sgd, aud_sgd)
    const matchUnit = lowerKey.match(/^([a-z]{3})_sgd$/);
    if (matchUnit) {
      const code = matchUnit[1].toUpperCase();
      const sgdPerForeignUnit = val;
      normalized[code] = Number((1 / sgdPerForeignUnit).toFixed(6));
      continue;
    }

    // Check for inverse quotation (e.g., sgd_myr)
    const matchInverse = lowerKey.match(/^sgd_([a-z]{3})$/);
    if (matchInverse) {
      const code = matchInverse[1].toUpperCase();
      normalized[code] = Number(val.toFixed(6));
      continue;
    }
  }

  return normalized;
}

export interface FetchMASOptions {
  endOfDay?: string;
  limit?: number;
}

/**
 * Core function to query the MAS API Catalogue endpoint
 */
export async function fetchFromMasApi(options: FetchMASOptions = {}) {
  // Retrieve API Key strictly from environment variable - never hardcoded
  const masKeyId = process.env.MAS_KEY_ID || process.env.MAS_API_KEY_ID;

  if (!masKeyId) {
    throw new Error(
      'MAS_KEY_ID is not configured in server environment. Please set MAS_KEY_ID in your environment secrets.'
    );
  }

  const endOfDay = options.endOfDay || getLatestBusinessDaySGT();
  const url = new URL(MAS_API_BASE_URL);
  url.searchParams.set('end_of_day', endOfDay);
  if (options.limit) {
    url.searchParams.set('limit', options.limit.toString());
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'KeyId': masKeyId,
      'Accept': 'application/json',
      'User-Agent': 'SingaForex-Applet/1.0',
    },
  });

  const responseText = await response.text();

  if (!response.ok) {
    let errorDetail = `MAS API returned status ${response.status} (${response.statusText})`;
    try {
      const parsed = JSON.parse(responseText);
      if (parsed.message || parsed.error) {
        errorDetail = parsed.message || parsed.error;
      }
    } catch {
      // XML or plain text error
      if (responseText.includes('fault:MessageBlocked') || response.status === 401) {
        errorDetail = 'Invalid or unauthorized KeyId for MAS API Catalogue endpoint.';
      }
    }
    throw new Error(errorDetail);
  }

  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error('Failed to parse MAS API response as JSON.');
  }

  // Extract records
  const records = data?.result?.records || data?.records || [];
  const latestRecord = records.length > 0 ? records[0] : null;
  const normalizedRates = latestRecord ? normalizeMasRates(latestRecord) : {};

  return {
    source: 'MAS Official API Catalogue (Statistical Bulletin)',
    endpoint: MAS_API_BASE_URL,
    endOfDay,
    totalRecords: records.length,
    latestRecord,
    ratesPerSGD: normalizedRates,
    raw: data,
    retrievedAt: new Date().toISOString(),
  };
}

/**
 * Serverless / Express handler for GET /api/exchangerates
 */
export default async function handler(req: Request, res: Response) {
  // Set CORS and headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  const endOfDayParam = (req.query?.end_of_day as string) || (req.query?.date as string);
  const masKeyId = process.env.MAS_KEY_ID || process.env.MAS_API_KEY_ID;

  if (!masKeyId) {
    return res.status(401).json({
      status: 'error',
      code: 'MISSING_MAS_KEY_ID',
      message:
        'MAS_KEY_ID is missing from environment variables. Configure MAS_KEY_ID in the environment to connect to the live MAS API catalogue.',
      endpointRequested: MAS_API_BASE_URL,
      help: 'Register at eservices.mas.gov.sg/apimg-gw to obtain a valid KeyId, then set MAS_KEY_ID in your environment variables.',
      endOfDayRequested: endOfDayParam || getLatestBusinessDaySGT(),
    });
  }

  try {
    const data = await fetchFromMasApi({
      endOfDay: endOfDayParam,
    });
    return res.status(200).json({
      status: 'success',
      ...data,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error during MAS API fetch';
    return res.status(502).json({
      status: 'error',
      code: 'MAS_GATEWAY_ERROR',
      message: errorMsg,
      endpointRequested: MAS_API_BASE_URL,
      endOfDayRequested: endOfDayParam || getLatestBusinessDaySGT(),
      timestamp: new Date().toISOString(),
    });
  }
}
