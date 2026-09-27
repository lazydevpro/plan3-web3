import { NextResponse } from "next/server";
import { getCmcOverview } from "@/lib/cmc";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const scope = new URL(request.url).searchParams.get("scope") === "core" ? "core" : "all";
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
