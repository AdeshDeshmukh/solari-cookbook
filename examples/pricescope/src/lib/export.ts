import { GeoCode, ScanResult } from "./types";

/**
 * Generates and downloads a structured CSV price matrix report for the scanned products across all geos.
 */
export function exportMatrixToCSV(
  products: string[],
  geos: GeoCode[],
  results: Map<string, ScanResult>
): void {
  if (typeof window === "undefined") return;

  const headers = ["Product", ...geos.map((g) => g.toUpperCase()), "Export Timestamp"];
  const rows = products.map((p) => [
    `"${p}"`,
    ...geos.map((g) => {
      const r = results.get(`${p}-${g}`);
      const price = r?.price ?? "N/A";
      const plan = r?.planName ? ` (${r.planName})` : "";
      return `"${price}${plan}"`;
    }),
    `"${new Date().toISOString()}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `pricescope-report-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
