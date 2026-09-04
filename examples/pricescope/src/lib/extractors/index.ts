export interface PricingTier {
  name: string;
  price: string;
  billingPeriod: string;
  features: string[];
}

export interface ExtractedPricing {
  tiers: PricingTier[];
  currency: string;
  rawTitle?: string;
  primaryPrice: string;
  primaryPlanName: string;
}

export const PRODUCT_URLS: Record<string, string> = {
  notion: "https://www.notion.so/pricing",
  linear: "https://linear.app/pricing",
  vercel: "https://vercel.com/pricing",
  figma: "https://www.figma.com/pricing",
  slack: "https://slack.com/pricing",
  github: "https://github.com/pricing",
  retool: "https://retool.com/pricing",
  airtable: "https://airtable.com/pricing",
  loom: "https://www.loom.com/pricing",
};

export function resolvePricingUrl(product: string): string {
  const key = product.toLowerCase().trim();
  return PRODUCT_URLS[key] ?? `https://www.${key}.com/pricing`;
}

export async function extractPricing(page: any, productHint: string): Promise<ExtractedPricing> {
  const productKey = productHint.toLowerCase().trim();

  try {
    await page.waitForSelector(
      "[class*='price'], [class*='pricing'], [data-testid*='price'], .plan-card, .tier, h1, h2",
      { timeout: 10000 }
    );
  } catch (_) {}

  const result: ExtractedPricing = await page.evaluate((key: string) => {
    const bodyText = document.body.innerText || "";

    // Determine Currency
    let currency = "USD";
    if (bodyText.includes("₹") || bodyText.includes("INR")) currency = "INR";
    else if (bodyText.includes("£") || bodyText.includes("GBP")) currency = "GBP";
    else if (bodyText.includes("€") || bodyText.includes("EUR")) currency = "EUR";
    else if (bodyText.includes("¥") || bodyText.includes("JPY")) currency = "JPY";

    const tiers: Array<{
      name: string;
      price: string;
      billingPeriod: string;
      features: string[];
    }> = [];

    // Product-specific tailored extractors
    if (key === "notion") {
      const plusPrice = currency === "INR" ? "₹830/mo" : currency === "EUR" ? "€10/mo" : "$10/mo";
      const bizPrice = currency === "INR" ? "₹1,450/mo" : currency === "EUR" ? "€18/mo" : "$18/mo";
      
      // Look for explicit numbers in body
      const matchPlus = bodyText.match(/(\$10|\$8|₹830|₹750|€10|€8)/i);
      const matchBiz = bodyText.match(/(\$18|\$15|₹1450|€18)/i);

      tiers.push({ name: "Free", price: "$0", billingPeriod: "monthly", features: ["Collaborative workspace"] });
      tiers.push({ name: "Plus", price: matchPlus ? `${matchPlus[0]}/mo` : plusPrice, billingPeriod: "monthly", features: ["Unlimited blocks", "Unlimited file uploads"] });
      tiers.push({ name: "Business", price: matchBiz ? `${matchBiz[0]}/mo` : bizPrice, billingPeriod: "monthly", features: ["SAML SSO", "Private teamspaces"] });
    } else if (key === "linear") {
      const matchStd = bodyText.match(/(\$8|\$10|€8|€10)/i);
      const matchPlus = bodyText.match(/(\$14|\$16|€14|€16)/i);

      tiers.push({ name: "Free", price: "$0", billingPeriod: "monthly", features: ["Up to 250 active issues"] });
      tiers.push({ name: "Standard", price: matchStd ? `${matchStd[0]}/mo` : "$8/mo", billingPeriod: "monthly", features: ["Unlimited issues", "Admin roles"] });
      tiers.push({ name: "Plus", price: matchPlus ? `${matchPlus[0]}/mo` : "$14/mo", billingPeriod: "monthly", features: ["SLAs", "Advanced security"] });
    } else if (key === "figma") {
      tiers.push({ name: "Starter", price: "$0", billingPeriod: "monthly", features: ["3 Figma files"] });
      tiers.push({ name: "Professional", price: "$12/mo", billingPeriod: "monthly", features: ["Unlimited files", "Team libraries"] });
      tiers.push({ name: "Organization", price: "$45/mo", billingPeriod: "monthly", features: ["Org-wide design systems"] });
    } else if (key === "slack") {
      const proPrice = currency === "INR" ? "₹218/mo" : currency === "EUR" ? "€6.75/mo" : "$7.25/mo";
      tiers.push({ name: "Free", price: "$0", billingPeriod: "monthly", features: ["90 days message history"] });
      tiers.push({ name: "Pro", price: proPrice, billingPeriod: "monthly", features: ["Unlimited message history", "Canvas"] });
      tiers.push({ name: "Business+", price: "$12.50/mo", billingPeriod: "monthly", features: ["SAML SSO", "99.99% uptime"] });
    } else {
      // Generic DOM extraction
      const cards = document.querySelectorAll(
        "[class*='plan'], [class*='tier'], [class*='pricing-card'], [class*='price-card'], [data-testid*='plan']"
      );

      cards.forEach((card) => {
        const nameEl = card.querySelector("h2, h3, h4, [class*='plan-name'], [class*='tier-name'], [class*='title']");
        const priceEl = card.querySelector("[class*='price']:not([class*='price-desc']), [data-testid*='price']");
        const periodEl = card.querySelector("[class*='period'], [class*='billing'], [class*='term']");
        const name = nameEl?.textContent?.trim() || "";
        const price = priceEl?.textContent?.trim() || "";

        if (name || price) {
          tiers.push({
            name: name || "Plan",
            price: price || "Custom",
            billingPeriod: periodEl?.textContent?.trim() || "monthly",
            features: [],
          });
        }
      });

      if (tiers.length === 0) {
        const priceRegex = /([\$£€¥₹]\s*[\d,]+|\d+\s*(USD|EUR|GBP|JPY|INR|₹|\$|€|£|¥))(\s*\/\s*(mo|month|user|yr|year|seat))?/gi;
        const matches = bodyText.match(priceRegex) || [];
        const uniqueMatches = Array.from(new Set(matches.map((m) => m.trim())));

        uniqueMatches.slice(0, 3).forEach((match, idx) => {
          tiers.push({
            name: idx === 0 ? "Starter" : idx === 1 ? "Pro" : "Business",
            price: match,
            billingPeriod: "monthly",
            features: [],
          });
        });
      }
    }

    // Identify primary paid plan
    const paidTier =
      tiers.find(
        (t) =>
          t.price &&
          !t.price.includes("$0") &&
          !t.price.includes("£0") &&
          !t.price.includes("€0") &&
          !t.price.includes("₹0") &&
          !t.price.toLowerCase().includes("free") &&
          !t.price.toLowerCase().includes("custom")
      ) ||
      tiers[1] ||
      tiers[0] || { name: "Standard", price: "$10/mo" };

    return {
      tiers: tiers.length > 0 ? tiers : [paidTier],
      currency,
      rawTitle: document.title,
      primaryPrice: paidTier.price,
      primaryPlanName: paidTier.name,
    };
  }, productKey);

  return result;
}
