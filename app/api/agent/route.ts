import { NextResponse } from "next/server";
import { createBoardProposal } from "@/lib/agent";
import { getCmcOverview } from "@/lib/cmc";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let input: unknown;
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "Enter a question for the analyst." }, { status: 400 }); }
  const prompt = input && typeof input === "object" ? (input as Record<string, unknown>).prompt : null;
  if (typeof prompt !== "string" || prompt.trim().length < 8 || prompt.length > 500) {
    return NextResponse.json({ error: "Use a question between 8 and 500 characters." }, { status: 400 });
  }
  try {
    const data = await getCmcOverview();
    if (!data.assets.length) return NextResponse.json({ error: "CMC quotes are unavailable. Try again shortly." }, { status: 503 });
    return NextResponse.json({ proposal: createBoardProposal(prompt, data) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The analyst could not load current CMC data. Try again." }, { status: 502 });
  }
}
