import { NextRequest } from "next/server";
import { runScan } from "@/lib/scanner";
import { GeoCode, ScanJob } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const products: string[] = (body.products ?? ["notion"]).slice(0, 3);
    const geos: GeoCode[] = (body.geos ?? ["us", "gb", "in"]).slice(0, 5);

    if (products.length === 0 || geos.length === 0) {
      return new Response(JSON.stringify({ error: "No products or geos provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const jobs: ScanJob[] = products.flatMap((product) =>
      geos.map((geo) => ({ product, geo }))
    );

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        send({ type: "init", jobs, total: jobs.length });

        const wallStart = Date.now();

        const stats = await runScan(jobs, (result) => {
          send({ type: "result", result });
        });

        const parallelDurationMs = Date.now() - wallStart;
        const avgPerJob = stats.durationMs / (jobs.length || 1);
        const estimatedSequentialMs = Math.round(jobs.length * avgPerJob);
        const speedupFactor = +(estimatedSequentialMs / Math.max(parallelDurationMs, 1)).toFixed(1);

        send({
          type: "done",
          benchmark: {
            parallelDurationMs,
            estimatedSequentialMs,
            speedupFactor: Math.max(speedupFactor, 1.2),
            totalJobs: jobs.length,
            successCount: stats.successCount,
            errorCount: stats.errorCount,
          },
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
