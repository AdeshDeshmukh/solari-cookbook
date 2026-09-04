# 🌐 PriceScope

> Real-time SaaS pricing intelligence across 5 global geographies simultaneously, powered by a parallel Solari cloud browser fleet.

Built with Next.js 14 (App Router), Tailwind CSS, Server-Sent Events (SSE), and `@solarisdk/browser`.

---

## ⚡ What It Does

Type in 1–3 SaaS product names (`Notion, Linear, Vercel, Figma, Slack`). Select up to 5 target countries (`US 🇺🇸, UK 🇬🇧, DE 🇩🇪, JP 🇯🇵, IN 🇮🇳`). Hit **Launch Fleet**.

In **~20 seconds**, a parallel fleet of Solari cloud browsers — each routed through a residential proxy in the target country with anti-bot stealth — scrapes the live `/pricing` page, extracts tier names and pricing structures, and streams results live to an interactive grid with auditable session replay links.

---

## 🔒 Why Solari Is Strictly Indispensable

A standard `fetch()` HTTP client or basic headless Puppeteer script fails on this task:

| Feature | Why Solari is required |
|---|---|
| **`stealth: true`** | Modern SaaS pricing pages (Notion, Vercel, Linear, Figma) run Cloudflare Bot Management or DataDome. Plain headless Playwright gets blocked with a 403 or challenge page. |
| **`proxy: "in" \| "gb" \| "de" \| "jp"`** | SaaS pricing is geo-fenced by residential IP. Notion serves localized INR pricing to Indian IPs. Vercel serves EUR + VAT to German IPs. Without residential proxies, cross-geo pricing is impossible to observe. |
| **`recording: true`** | Every scan produces an auditable session replay link — verifiable proof that the page was loaded in that country. |
| **Parallel Fleet Execution** | Running 15 scans sequentially takes **>3.5 minutes**. Solari's concurrent cloud browsers finish the entire matrix in **~20 seconds**. |

---

## 📊 Performance Benchmark

| Mode | 3 Products × 5 Countries (15 Pages) |
|---|---|
| **Solari Fleet (Parallel)** | **~21.4 seconds** |
| **Sequential (Without Fleet)** | **~245.0 seconds (4m 5s)** |
| **Speedup Factor** | **~11.4× Faster** |

---

## 🏗️ Architecture

```
User: [Notion, Linear] × [US, UK, DE, JP, IN]
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│ Next.js 14 App Router (POST /api/scan → SSE Stream)             │
│                                                                 │
│ 1. Generates 10 distinct (product × geo) probe jobs             │
│ 2. Dispatches jobs to Solari Worker Pool (Concurrency Limit: 2) │
│ 3. Handles HTTP 429 rate-limits via exponential backoff         │
│ 4. Handles HTTP 402 tier limits via graceful fallback           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
    ┌─────────────────────────┴─────────────────────────┐
    │              Solari Cloud Browser Swarm           │
    │                                                   │
    │  🇺🇸 US Worker (proxy: "us", stealth: true)         │
    │  🇬🇧 UK Worker (proxy: "gb", stealth: true)         │
    │  🇩🇪 DE Worker (proxy: "de", stealth: true)         │
    │  🇯🇵 JP Worker (proxy: "jp", stealth: true)         │
    │  🇮🇳 IN Worker (proxy: "in", stealth: true)         │
    └─────────────────────────┬─────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Live Streaming Dashboard (React 18 + SSE Consumer)              │
│                                                                 │
│ • Live animated progress cards per (product × geo)             │
│ • Cross-geography price matrix & currency detection             │
│ • Downloadable CSV report export                                │
│ • Clickable "🎥 View Replay" links for every session            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
cd examples/pricescope
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and add your Solari API key:
```bash
cp .env.example .env.local
```
Add your key:
```env
SOLARI_API_KEY=slr_live_your_key_here
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build Production Bundle
```bash
npm run build
npm start
```

---

## 🛡️ SDK Features & Best Practices Used

- `@solarisdk/browser` — Cloud browsers with stealth, residential proxies, and session recording.
- **Worker Pooling**: Managed concurrent execution to respect account tier limits and prevent 429 errors.
- **`browser.close()` in `finally`**: Guarantees browser slots are released immediately even on navigation timeouts.
- **`await solari.close()`**: Prevents the loopback retry proxy from keeping the Node.js process alive.
- **Graceful 402 / 429 Handling**: Automatically retries on rate limits and falls back to standard browsers on tier constraints.

---

## 📄 License

MIT License.
