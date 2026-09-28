import { NextResponse } from "next/server";
import { getCmcOverview } from "@/lib/cmc";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const scope = new URL(request.url).searchParams.get("scope") === "core" ? "core" : "all";
    if (request.headers.get("accept")?.includes("application/x-ndjson")) {
      const encoder = new TextEncoder();
      let cancelled = false;
      const stream = new ReadableStream({
        async start(controller) {
          const send = (value: unknown) => { if (!cancelled) controller.enqueue(encoder.encode(JSON.stringify(value) + "\n")); };
          try {
            const data = await getCmcOverview(scope, data => send({ data, done: false }));
            send({ data, done: true });
          } catch { send({ error: "Market data could not be loaded. Try again.", done: true }); }
          if (!cancelled) controller.close();
        },
        cancel() { cancelled = true; },
      });
      return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
    }
    const data = await getCmcOverview(scope);
    return NextResponse.json(data, {
      status: data.health === "unavailable" ? 503 : 200,
      headers: { "Cache-Control": data.health === "healthy" ? "private, max-age=30" : "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CoinMarketCap data is unavailable" },
      { status: 502 },
    );
  }
}
