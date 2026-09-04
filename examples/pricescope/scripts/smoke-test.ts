import { Solari } from "@solarisdk/browser";

async function smokeTest() {
  const apiKey = process.env.SOLARI_API_KEY;
  if (!apiKey) {
    console.error("❌ Error: SOLARI_API_KEY environment variable is not set.");
    process.exit(1);
  }

  console.log("🚀 Starting PriceScope smoke test with Solari SDK...");
  const solari = new Solari({ apiKey });

  let browser: any = null;
  try {
    browser = await solari.launch({
      stealth: false,
      recording: true,
    });

    console.log(`✅ Launched browser session: ${browser.id}`);
    const page = await browser.newPage();
    await page.goto("https://linear.app/pricing", { waitUntil: "domcontentloaded", timeout: 25000 });

    const title = await page.title();
    console.log(`✅ Successfully navigated to Linear pricing. Page title: "${title}"`);

    const recording = await browser.recording?.();
    console.log(`🎥 Session recording URL: ${recording?.url ?? "Processing..."}`);
  } catch (err: any) {
    console.error(`❌ Smoke test encountered an error:`, err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
    await solari.close();
    console.log("✅ Smoke test complete.");
  }
}

smokeTest().catch(console.error);
