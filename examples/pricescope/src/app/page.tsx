"use client";

import { useState, useCallback } from "react";
import ScanForm from "@/components/ScanForm";
import ResultsGrid from "@/components/ResultsGrid";
import BenchmarkBadge from "@/components/BenchmarkBadge";
import { ScanResult, GeoCode, ScanBenchmark } from "@/lib/types";

interface ScanJob {
  product: string;
  geo: GeoCode;
}

export default function Home() {
  const [jobs, setJobs] = useState<ScanJob[]>([]);
  const [results, setResults] = useState<Map<string, ScanResult>>(new Map());
  const [scanning, setScanning] = useState(false);
  const [benchmark, setBenchmark] = useState<ScanBenchmark | null>(null);

  const handleScan = useCallback(async (products: string[], geos: GeoCode[]) => {
    setScanning(true);
    setResults(new Map());
    setBenchmark(null);
    setJobs([]);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, geos }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to start scan stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "init") {
              setJobs(event.jobs);
            } else if (event.type === "result") {
              setResults((prev) => {
                const next = new Map(prev);
                const key = `${event.result.product}-${event.result.geo}`;
                next.set(key, event.result);
                return next;
              });
            } else if (event.type === "done") {
              setBenchmark(event.benchmark);
              setScanning(false);
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      console.error(err);
      setScanning(false);
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-700/40 px-3.5 py-1.5 rounded-full text-xs text-indigo-300 font-mono mb-4">
            <span>⚡ Powered by Solari Cloud Browser Swarm</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Price<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Scope</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Real-time SaaS pricing intelligence across 5 global geographies simultaneously.
            Auditable session replays, residential proxy egress, and anti-bot stealth.
          </p>
        </header>

        {/* Scan Form */}
        <ScanForm onScan={handleScan} scanning={scanning} />

        {/* Benchmark Banner */}
        {benchmark && <BenchmarkBadge benchmark={benchmark} />}

        {/* Live Streaming Results */}
        {jobs.length > 0 && (
          <ResultsGrid jobs={jobs} results={results} scanning={scanning} />
        )}
      </div>
    </main>
  );
}
