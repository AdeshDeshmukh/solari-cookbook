import { Solari } from "@solarisdk/browser";
import { extractPricing, resolvePricingUrl } from "./extractors";
import { GeoCode, GEO_LABELS, ScanJob, ScanResult, ScanBenchmark } from "./types";

export interface BrowserEgressConfig {
  geo: GeoCode;
  stealth: boolean;
  recording: boolean;
}

export function buildBrowserLaunchOptions(config: BrowserEgressConfig) {
  return {
    stealth: config.stealth,
    proxy: config.stealth ? config.geo : undefined,
    recording: config.recording,
  };
}

export function isTierRestrictionError(err: any): boolean {
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("402") ||
    msg.includes("requires a paid") ||
    msg.includes("proxy not supported") ||
    msg.includes("upgrade your plan") ||
    msg.includes("tier restriction")
  );
}

export function isRateLimitError(err: any): boolean {
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("concurrent session") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests")
  );
}

async function launchWithRetry(
  solari: Solari,
  geo: GeoCode,
  maxRetries = 4
) {
  let useStealth = true;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const launchOptions = buildBrowserLaunchOptions({
        geo,
        stealth: useStealth,
        recording: true,
      });
      const browser = await solari.launch(launchOptions);
      return browser;
    } catch (err: any) {
      // Fallback for non-stealth on account tier restrictions
      if (isTierRestrictionError(err)) {
        console.warn(`[PriceScope] Account tier restriction encountered for geo ${geo}. Falling back to default cloud browser.`);
        useStealth = false;
        continue;
      }

      // Exponential backoff for concurrency limit
      if (isRateLimitError(err)) {
        const delay = calculateBackoffDelay(attempt);
        console.warn(`[PriceScope] Rate limit hit. Backing off for ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries}).`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw err;
    }
  }

  return await solari.launch({
    stealth: false,
    recording: false,
  });
}

async function scanOne(
  solari: Solari,
  job: ScanJob
): Promise<ScanResult> {
  const startMs = Date.now();
  const url = resolvePricingUrl(job.product);
  let browser: any = null;

  try {
    browser = await launchWithRetry(solari, job.geo);

    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    await new Promise((r) => setTimeout(r, 1500));

    const pricing = await extractPricing(page, job.product);

    let replayUrl: string | undefined;
    try {
      const rec = await browser.recording?.();
      replayUrl = rec?.url;
    } catch (_) {}

    return {
      product: job.product,
      geo: job.geo,
      geoLabel: GEO_LABELS[job.geo],
      status: "success",
      price: pricing.primaryPrice || pricing.tiers[0]?.price || "N/A",
      planName: pricing.primaryPlanName || "Standard",
      currency: pricing.currency,
      tiers: pricing.tiers,
      replayUrl,
      durationMs: Date.now() - startMs,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      product: job.product,
      geo: job.geo,
      geoLabel: GEO_LABELS[job.geo],
      status: "error",
      error: err.message ?? String(err),
      durationMs: Date.now() - startMs,
      scrapedAt: new Date().toISOString(),
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
  }
}

export function calculateBackoffDelay(attempt: number, baseMs = 1500): number {
  const exponential = Math.pow(2, attempt) * baseMs;
  const jitter = Math.random() * 500;
  return exponential + jitter;
}

export async function runPool<T>(
  tasks: (() => Promise<T>)[],
  poolSize: number,
  onResult: (result: T) => void
): Promise<void> {
  let index = 0;

  async function worker(workerId: number) {
    while (index < tasks.length) {
      const taskIndex = index++;
      try {
        const result = await tasks[taskIndex]();
        onResult(result);
      } catch (err) {
        console.error(`[Worker ${workerId}] Task ${taskIndex} failed:`, err);
      }
      // Pacing interval between worker launches
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  const activeWorkers = Array.from(
    { length: Math.min(poolSize, tasks.length) },
    (_, i) => worker(i + 1)
  );

  await Promise.all(activeWorkers);
}

export async function runScan(
  jobs: ScanJob[],
  onResult: (result: ScanResult) => void,
  poolSize = 2
): Promise<{ durationMs: number; successCount: number; errorCount: number }> {
  const apiKey = process.env.SOLARI_API_KEY || "";
  const solari = new Solari({ apiKey });
  const startMs = Date.now();
  let successCount = 0;
  let errorCount = 0;

  try {
    const tasks = jobs.map((job) => () => scanOne(solari, job));

    await runPool(tasks, poolSize, (result) => {
      if (result.status === "success") successCount++;
      else errorCount++;
      onResult(result);
    });
  } finally {
    try {
      await solari.close();
    } catch (_) {}
  }

  return {
    durationMs: Date.now() - startMs,
    successCount,
    errorCount,
  };
}
