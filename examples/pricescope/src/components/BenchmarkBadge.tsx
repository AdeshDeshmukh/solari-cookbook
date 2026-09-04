"use client";

import { ScanBenchmark } from "@/lib/types";

export default function BenchmarkBadge({ benchmark }: { benchmark: ScanBenchmark }) {
  const parallelSec = (benchmark.parallelDurationMs / 1000).toFixed(1);
  const seqSec = (benchmark.estimatedSequentialMs / 1000).toFixed(0);

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 mb-8 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-bold text-slate-100">
            Solari Fleet Performance Benchmark
          </h3>
        </div>
        <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2.5 py-0.5 rounded-full font-mono">
          Parallel vs Sequential
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
          <div className="text-2xl font-bold text-indigo-400">{parallelSec}s</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Solari Fleet Time</div>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
          <div className="text-2xl font-bold text-slate-400">~{seqSec}s</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sequential Est.</div>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
          <div className="text-2xl font-bold text-emerald-400">{benchmark.speedupFactor}×</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Speedup Factor</div>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
          <div className="text-2xl font-bold text-slate-100">{benchmark.totalJobs}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total Pages</div>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
          <div className="text-2xl font-bold text-emerald-400">{benchmark.successCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Succeeded</div>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
          <div className={`text-2xl font-bold ${benchmark.errorCount > 0 ? "text-rose-400" : "text-slate-500"}`}>
            {benchmark.errorCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Failed</div>
        </div>
      </div>
    </div>
  );
}
