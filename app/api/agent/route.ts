import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { AgentError, DEFAULT_GEMINI_MODEL, requestGemini } from "@/lib/gemini-agent";
import { parseWorkspaceBoard } from "@/lib/workspace";
import { parseBoard, WIDGET_IDS } from "@/lib/plan3-board";
import { getCmcOverview } from "@/lib/cmc";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
// Best-effort per-isolate guard, not a distributed billing ceiling. Provider quotas
// remain the hard cost control; no automatic retries or background model calls.
const usage = new Map<string, { until: number; count: number; active: boolean }>();
async function agentUser(request: Request) {
  const user = await getChatGPTUser();
  if (user) return user;
  // The portable localhost preview has no Sites dispatcher. Never allow this in
  // production, even when a caller supplies a loopback-looking Host header.
  if (process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname)) return { userId: "local-development" };
  return null;
}

export async function GET(request: Request) {
  if (!await agentUser(request)) return json({ error: "Sign in to use the research agent." }, 401);
  return json({ configured: !!process.env.GEMINI_API_KEY?.trim(), model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL });
}

export async function POST(request: Request) {
  const user = await agentUser(request);
  if (!user) return json({ error: "Sign in to use the research agent." }, 401);
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) return json({ error: "Send agent requests from this Plan3 workspace." }, 403);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return json({ error: "Gemini is not connected yet. Add GEMINI_API_KEY to the server environment, then retry." }, 503);
  let input: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Enter a question and include the current board." }, 400);
    let size = 0, raw = "";
    const decoder = new TextDecoder();
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 150_000) { await reader.cancel(); return json({ error: "This board is too large for one agent request. Use a smaller research board." }, 413); }
      raw += decoder.decode(part.value, { stream: true });
    }
    input = JSON.parse(raw + decoder.decode());
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error();
  } catch { return json({ error: "Invalid agent request. Your board is unchanged." }, 400); }
  const prompt = input.prompt;
  const board = parseWorkspaceBoard(input.board, WIDGET_IDS, parseBoard);
  if (typeof prompt !== "string" || prompt.trim().length < 8 || prompt.length > 2000 || !board) return json({ error: "Use a question between 8 and 2,000 characters and a valid board." }, 400);
  const now = Date.now();
  for (const [id, entry] of usage) if (entry.until < now && !entry.active) usage.delete(id);
  const entry = usage.get(user.userId) ?? { until: now + 60_000, count: 0, active: false };
  if (entry.active || entry.count >= 6) return json({ error: "An agent request is running or the request limit was reached. Wait a minute before trying again." }, 429);
  entry.active = true; entry.count++; usage.set(user.userId, entry);
  try {
    const data = await getCmcOverview();
    const result = await requestGemini({ apiKey, model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL, prompt: prompt.trim(), board, data, signal: request.signal });
    return json(result);
  } catch (error) {
    return error instanceof AgentError ? json({ error: error.message }, error.status) : json({ error: "The research agent could not finish. Your board is unchanged; please retry." }, 502);
  } finally { entry.active = false; }
}
