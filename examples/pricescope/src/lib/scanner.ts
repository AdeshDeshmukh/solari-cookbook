import { Solari } from "@solarisdk/browser";
import { extractPricing, resolvePricingUrl } from "./extractors";
import { GeoCode, GEO_LABELS, ScanJob, ScanResult, ScanBenchmark } from "./types";

async function launchWithRetry(
  solari: Solari,
  geo: GeoCode,
  maxRetries = 4
) {
  let useStealth = true;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const browser = await solari.launch({
        stealth: useStealth,
        proxy: useStealth ? geo : undefined,
        recording: true,
      });
      return browser;
    } catch (err: any) {
      const msg = err?.message || "";

      if (msg.includes("402") || msg.includes("requires a paid")) {
        useStealth = false;
        continue;
      }

      if (msg.includes("429") || msg.includes("Concurrent session")) {
        const delay = Math.pow(2, attempt) * 1500 + Math.random() * 500;
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

async function runPool<T>(
  tasks: (() => Promise<T>)[],
  poolSize: number,
  onResult: (result: T) => void
): Promise<void> {
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const taskIndex = index++;
      const result = await tasks[taskIndex]();
      onResult(result);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(poolSize, tasks.length) }, () => worker())
  );
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
