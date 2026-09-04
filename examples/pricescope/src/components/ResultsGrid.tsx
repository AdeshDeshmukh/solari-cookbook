"use client";

import { ScanResult, GeoCode, GEO_FLAGS } from "@/lib/types";

interface ScanJob {
  product: string;
  geo: GeoCode;
}

interface ResultsGridProps {
  jobs: ScanJob[];
  results: Map<string, ScanResult>;
  scanning: boolean;
}

export default function ResultsGrid({ jobs, results, scanning }: ResultsGridProps) {
  const products = [...new Set(jobs.map((j) => j.product))];
  const geos = [...new Set(jobs.map((j) => j.geo))] as GeoCode[];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>Live Results Grid</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-mono font-normal">
            Streaming via SSE
          </span>
        </h2>

        {products.map((product) => (
          <div key={product} className="mb-8">
            <h3 className="text-lg font-semibold text-slate-100 mb-3 capitalize flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>{product}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {geos.map((geo) => {
                const key = `${product}-${geo}`;
                const result = results.get(key);

                return (
                  <ResultCard
                    key={key}
                    product={product}
                    geo={geo}
                    result={result}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Price Discrepancy Matrix */}
      {results.size > 0 && (
        <DiscrepancyTable products={products} geos={geos} results={results} />
      )}
    </div>
  );
}

function ResultCard({
  product,
  geo,
  result,
}: {
  product: string;
  geo: GeoCode;
  result?: ScanResult;
}) {
  const isPending = !result;
  const isError = result?.status === "error";

  return (
    <div
      className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
        isPending
          ? "border-slate-800 bg-slate-900/60 animate-pulse"
          : isError
          ? "border-rose-900/50 bg-rose-950/20"
          : "border-slate-800 bg-slate-900/80 shadow-lg"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{GEO_FLAGS[geo]}</span>
          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
              isPending
                ? "bg-slate-800 text-slate-400"
                : isError
                ? "bg-rose-900/50 text-rose-300"
                : "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
            }`}
          >
            {isPending ? "PROBING" : isError ? "ERROR" : "EXTRACTED"}
          </span>
        </div>

        <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">
          {result?.geoLabel ?? geo.toUpperCase()}
        </div>

        {isPending && (
          <div className="text-sm text-slate-500 py-3 flex items-center gap-2">
            <span className="animate-spin text-indigo-400">⟳</span>
            <span>Launching browser...</span>
          </div>
        )}

        {isError && (
          <div className="text-xs text-rose-400 py-2 leading-relaxed">
            {result.error?.slice(0, 90) || "Scrape failed"}
          </div>
        )}

        {result?.status === "success" && (
          <div className="py-1">
            <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-0.5">
              {result.planName || "Tier"}
            </div>
            <div className="text-2xl font-bold text-slate-100 tracking-tight">
              {result.price || "N/A"}
            </div>
            <div className="text-xs text-slate-400 mt-1 font-medium flex items-center justify-between">
              <span>Currency: <strong className="text-indigo-300">{result.currency}</strong></span>
              {result.tiers && result.tiers.length > 1 && (
                <span className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
                  {result.tiers.length} plans
                </span>
              )}
            </div>

            {result.tiers && result.tiers.length > 1 && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                {result.tiers.slice(0, 3).map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md"
                  >
                    {t.name}: {t.price}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-3 mt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
        {result?.durationMs ? (
          <span className="text-slate-500 font-mono text-[11px]">
            {(result.durationMs / 1000).toFixed(1)}s
          </span>
        ) : (
          <span className="text-slate-600">-</span>
        )}

        {result?.replayUrl ? (
          <a
            href={result.replayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline flex items-center gap-1"
          >
            <span>🎥 Replay</span>
          </a>
        ) : (
          <span className="text-slate-600 text-[11px]">No replay</span>
        )}
      </div>
    </div>
  );
}

function DiscrepancyTable({
  products,
  geos,
  results,
}: {
  products: string[];
  geos: GeoCode[];
  results: Map<string, ScanResult>;
}) {
  const exportCSV = () => {
    const headers = ["Product", ...geos.map((g) => g.toUpperCase())];
    const rows = products.map((p) => [
      p,
      ...geos.map((g) => {
        const r = results.get(`${p}-${g}`);
        return r?.tiers?.[0]?.price ?? r?.price ?? "N/A";
      }),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pricescope-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>💡 Cross-Geography Price Discrepancy Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pricing differences captured across residential egress endpoints.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <span>📥</span>
          <span>Export CSV Matrix</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] tracking-wider border-b border-slate-800 font-mono">
            <tr>
              <th className="py-3 px-4">Product</th>
              {geos.map((geo) => (
                <th key={geo} className="py-3 px-4 text-center">
                  {GEO_FLAGS[geo]} {geo.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {products.map((product) => {
              const usPrice = results.get(`${product}-us`)?.price;

              return (
                <tr key={product} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-200 capitalize flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span>{product}</span>
                  </td>
                  {geos.map((geo) => {
                    const r = results.get(`${product}-${geo}`);
                    const price = r?.price ?? "—";
                    const isDiscrepant = geo !== "us" && r?.currency && r.currency !== "USD";

                    return (
                      <td key={geo} className="py-3.5 px-4 text-center font-medium text-slate-300">
                        <div className="font-semibold text-slate-100 flex items-center justify-center gap-1">
                          <span>{price}</span>
                          {isDiscrepant && (
                            <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1 rounded font-mono">
                              {r.currency}
                            </span>
                          )}
                        </div>
                        {r?.planName && <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">{r.planName}</div>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
