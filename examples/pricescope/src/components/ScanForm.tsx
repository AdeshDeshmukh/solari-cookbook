"use client";

import { useState } from "react";
import { GeoCode, GEO_FLAGS } from "@/lib/types";

const GEO_OPTIONS: { code: GeoCode; label: string; flag: string }[] = [
  { code: "us", label: "United States", flag: "🇺🇸" },
  { code: "gb", label: "United Kingdom", flag: "🇬🇧" },
  { code: "de", label: "Germany", flag: "🇩🇪" },
  { code: "jp", label: "Japan", flag: "🇯🇵" },
  { code: "in", label: "India", flag: "🇮🇳" },
];

const PRODUCT_SUGGESTIONS = ["Notion", "Linear", "Vercel", "Figma", "Slack", "Retool"];

interface ScanFormProps {
  onScan: (products: string[], geos: GeoCode[]) => void;
  scanning: boolean;
}

export default function ScanForm({ onScan, scanning }: ScanFormProps) {
  const [productInput, setProductInput] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>(["Notion", "Linear"]);
  const [selectedGeos, setSelectedGeos] = useState<GeoCode[]>(["us", "gb", "in"]);

  const addProduct = (name: string) => {
    const cleaned = name.trim();
    if (cleaned && !selectedProducts.some((p) => p.toLowerCase() === cleaned.toLowerCase()) && selectedProducts.length < 3) {
      setSelectedProducts((p) => [...p, cleaned]);
      setProductInput("");
    }
  };

  const toggleGeo = (geo: GeoCode) => {
    setSelectedGeos((prev) =>
      prev.includes(geo)
        ? prev.length > 1 ? prev.filter((g) => g !== geo) : prev
        : prev.length < 5
        ? [...prev, geo]
        : prev
    );
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-slate-800 shadow-2xl">
      {/* Product selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Target SaaS Products (Max 3)
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedProducts.map((p) => (
            <span
              key={p}
              className="bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 px-3.5 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5"
            >
              {p}
              <button
                type="button"
                onClick={() => setSelectedProducts((prev) => prev.filter((x) => x !== p))}
                className="hover:text-white ml-1 text-slate-400 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={productInput}
            onChange={(e) => setProductInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addProduct(productInput);
              }
            }}
            placeholder="Type a product (e.g. Vercel) and press Enter"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => addProduct(productInput)}
            disabled={!productInput.trim() || selectedProducts.length >= 3}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span className="text-xs text-slate-500">Quick add:</span>
          {PRODUCT_SUGGESTIONS.filter((s) => !selectedProducts.some((p) => p.toLowerCase() === s.toLowerCase())).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => addProduct(s)}
                disabled={selectedProducts.length >= 3}
                className="text-xs text-slate-400 hover:text-indigo-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg px-2.5 py-1 transition-colors"
              >
                + {s}
              </button>
            )
          )}
        </div>
      </div>

      {/* Geo selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Target Geographies (Residential Proxies)
        </label>
        <div className="flex flex-wrap gap-2.5">
          {GEO_OPTIONS.map(({ code, label, flag }) => (
            <button
              key={code}
              type="button"
              onClick={() => toggleGeo(code)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
                selectedGeos.includes(code)
                  ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              }`}
            >
              <span>{flag}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Run Scan Button */}
      <button
        type="button"
        onClick={() => onScan(selectedProducts, selectedGeos)}
        disabled={scanning || selectedProducts.length === 0 || selectedGeos.length === 0}
        className="w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-xl shadow-indigo-500/20 text-base flex items-center justify-center gap-2"
      >
        {scanning ? (
          <>
            <span className="animate-spin text-lg">⚡</span>
            <span>
              Scanning {selectedProducts.length * selectedGeos.length} pages across {selectedGeos.length} countries...
            </span>
          </>
        ) : (
          <>
            <span>🔍 Launch Solari Cloud Fleet</span>
            <span className="text-indigo-200 text-sm font-normal">
              ({selectedProducts.length * selectedGeos.length} scans)
            </span>
          </>
        )}
      </button>
    </div>
  );
}
