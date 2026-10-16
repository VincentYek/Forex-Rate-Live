export type CurrencyCategory = 'asean' | 'g10' | 'asia_pacific' | 'americas' | 'all';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
  category: 'asean' | 'g10' | 'asia_pacific' | 'americas' | 'other';
  commonDenominator?: number; // e.g. 100 JPY or 100 IDR (standard Singapore money changer quotation)
  popularForSG?: boolean;
}

export interface LiveRate {
  code: string;
  ratePerSGD: number; // 1 SGD = X Foreign Currency
  inverseRate: number; // 1 Foreign Currency = Y SGD
  change24hPercent: number;
  change24hPoints: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
  sparkline: number[];
}

export interface ChartDataPoint {
  date: string;
  rate: number;
  formattedDate: string;
}

export interface ProviderSpread {
  id: string;
  name: string;
  category: 'bank' | 'money_changer' | 'fintech';
  description: string;
  markupPercent: number; // relative to mid-market
  fixedFeeSGD: number;
  location?: string;
  badge?: string;
}

export interface RateAlert {
  id: string;
  targetCurrency: string;
  condition: 'above' | 'below';
  targetRate: number;
  createdAt: string;
  active: boolean;
}
