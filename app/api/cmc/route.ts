import { NextResponse } from "next/server";
import { getCmcOverview } from "@/lib/cmc";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getCmcOverview();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CoinMarketCap data is unavailable" },
      { status: 502 },
    );
  }
}
