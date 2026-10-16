import type { Request, Response } from 'express';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: string;
  timestamp: string;
  singaporeTime: string;
  uptime: number;
  masApi: {
    configured: boolean;
    endpoint: string;
  };
}

export async function getHealthStatus(): Promise<HealthResponse> {
  const masKeyConfigured = Boolean(process.env.MAS_KEY_ID || process.env.MAS_API_KEY_ID);
  
  let singaporeTime = '';
  try {
    singaporeTime = new Intl.DateTimeFormat('en-SG', {
      timeZone: 'Asia/Singapore',
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(new Date());
  } catch {
    singaporeTime = new Date().toISOString();
  }

  return {
    status: 'ok',
    service: 'SingaForex MAS API Connector',
    timestamp: new Date().toISOString(),
    singaporeTime,
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    masApi: {
      configured: masKeyConfigured,
      endpoint: 'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610ora/exchange_rates_end_of_period_daily/views/exchange_rates_end_of_period_daily',
    },
  };
}

/**
 * Serverless / Express handler for GET /api/health
 */
export default async function handler(req: Request, res: Response) {
  try {
    const health = await getHealthStatus();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).json(health);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return res.status(500).json({
      status: 'error',
      message: errorMsg,
      timestamp: new Date().toISOString(),
    });
  }
}
