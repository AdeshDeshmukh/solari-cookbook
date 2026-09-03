export type GeoCode = "us" | "gb" | "de" | "jp" | "in";

export const GEO_LABELS: Record<GeoCode, string> = {
  us: "United States",
  gb: "United Kingdom",
  de: "Germany",
  jp: "Japan",
  in: "India",
};

export const GEO_FLAGS: Record<GeoCode, string> = {
  us: "🇺🇸",
  gb: "🇬🇧",
  de: "🇩🇪",
  jp: "🇯🇵",
  in: "🇮🇳",
};

export interface PricingTier {
  name: string;
  price: string;
  billingPeriod: string;
  features: string[];
}

export interface ScanJob {
  product: string;
  geo: GeoCode;
}

export interface ScanResult {
  product: string;
  geo: GeoCode;
  geoLabel: string;
  status: "success" | "error";
  price?: string;
  planName?: string;
  currency?: string;
  tiers?: PricingTier[];
  replayUrl?: string;
  durationMs?: number;
  error?: string;
  scrapedAt: string;
}

export interface ScanBenchmark {
  parallelDurationMs: number;
  estimatedSequentialMs: number;
  speedupFactor: number;
  totalJobs: number;
  successCount: number;
  errorCount: number;
}
