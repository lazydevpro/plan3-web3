"use client";

import { ExternalLink, Link2, Pin, ShieldAlert } from "lucide-react";
import type { CmcOverview } from "@/lib/cmc";
import { useClock } from "@/hooks/use-clock";
import { ExchangeWidget } from "./exchange-widget";
import {
  assetsFrom,
  evaluateRule,
  formatMetric,
  METRICS,
  metricValue,
  safeSource,
  type Block,
  type WorkspaceBoard,
} from "@/lib/workspace";

export function BuilderWidget({
  block,
  board,
  data,
  failed = false,
  loading = false,
  preview = false,
}: {
  block: Block;
  board: WorkspaceBoard;
  data: CmcOverview | null;
  failed?: boolean;
  loading?: boolean;
  preview?: boolean;
}) {
  const now = useClock();
  if (block.kind === "jupiter" || block.kind === "lifi") return <ExchangeWidget key={block.kind} provider={block.kind} preview={preview} />;
  const c = block.config;
  const symbol = c.asset === "$asset" ? board.asset : c.asset;
  const assets = assetsFrom(data);
  const asset = assets.find((a) => a.symbol === symbol);
  const value = metricValue(asset, c.metric);
  const rows = (
    block.kind === "table"
      ? assets.filter((a) => c.symbols.includes(a.symbol))
      : assets
  )
    .filter((a) => block.kind === "table" || metricValue(a, c.metric) != null)
    .filter(a => c.minimum == null || (metricValue(a, c.metric) != null && metricValue(a, c.metric)! >= c.minimum))
    .sort((a, b) => {
      const av = metricValue(a, c.metric),
        bv = metricValue(b, c.metric);
      return av == null
        ? 1
        : bv == null
          ? -1
          : (av - bv) * (c.ascending ? 1 : -1);
    })
    .slice(0, c.limit);
  const source = safeSource(c.url);
  const history =
    data?.history
      .find((s) => s.symbol === symbol)
      ?.points.filter((p) => Number.isFinite(p.price)).slice(-(c.historyDays ?? 14)) ?? [];
  const prices = history.map((p) => p.price);
  const low = prices.length ? Math.min(...prices) : 0;
  const high = prices.length ? Math.max(...prices) : 0;
  const path = prices
    .map(
      (p, i) =>
        `${i ? "L" : "M"}${20 + (i / Math.max(1, prices.length - 1)) * 560},${145 - ((p - low) / (high - low || 1)) * 125}`,
    )
    .join(" ");
  const state = evaluateRule(block, board, data, now, failed);
  const feed = data?.assets.some(a => a.symbol === symbol) ? "assets" : "listings";
  const requiredFeeds = ["note", "source"].includes(block.kind) ? [] : block.kind === "chart" ? [feed, "history"] : ["table", "ranking"].includes(block.kind) ? ["listings", "assets"] : [feed];
  const pending = requiredFeeds.some(name => data?.feeds?.[name]?.status === "pending");
  const stale =
    failed ||
    requiredFeeds.some(name => data?.feeds?.[name]?.status === "error") ||
    data?.health === "unavailable" ||
    (["metric", "rule", "chart"].includes(block.kind) && (!asset || !asset.lastUpdated || !Number.isFinite(Date.parse(asset.lastUpdated)) || now - Date.parse(asset.lastUpdated) > 600000)) ||
    (block.kind === "chart" && (!history.length || data?.feeds?.history?.status === "error")) ||
    (["table", "ranking"].includes(block.kind) && (!rows.length || rows.some(a => !a.lastUpdated || !Number.isFinite(Date.parse(a.lastUpdated)) || now - Date.parse(a.lastUpdated) > 600000))) ||
    !data ||
    !Number.isFinite(Date.parse(data.retrievedAt)) ||
    now - Date.parse(data.retrievedAt) > 180000;
  const bound = !["note", "source", "table", "ranking"].includes(block.kind);
  const columns = block.kind === "table" ? c.columns ?? [...new Set([c.metric, "price" as const])] : [c.metric];
  const watched = board.connections.filter(link => link.to === block.id && link.relation === "watches").map(link => board.blocks.find(b => b.id === link.from)).filter((b): b is Block => b?.kind === "rule");
  const triggered = watched.filter(rule => evaluateRule(rule, board, data, now, failed) === "met");
  if ((loading || pending) && !["note", "source"].includes(block.kind)) return <div className="instrument instrument-loading" role="status" aria-label="Loading market data"><span>Loading this feed…</span><i /><i /><i /><small>Your board remains editable.</small></div>;
  return (
    <div className={`instrument instrument-${block.kind}`}>
      <div className="instrument-meta">
        <span>
          {block.kind === "rule"
            ? "CONDITION"
            : block.kind === "note"
              ? "HUMAN CONTEXT"
              : block.kind === "source"
                ? "REFERENCE"
                : "CMC / USD"}
        </span>
        {bound && (
          <span
            title={
              c.asset === "$asset"
                ? "Follows the board asset"
                : "Pinned independently of board asset"
            }
          >
            {c.asset === "$asset" ? <Link2 /> : <Pin />}
            {symbol}
          </span>
        )}
      </div>
      {block.kind === "metric" && (
        <>
          <strong className="instrument-value">
            {formatMetric(value, c.metric)}
          </strong>
          <span className="instrument-label">{METRICS[c.metric].label}</span>
          <div className="instrument-formula">{METRICS[c.metric].formula}</div>
        </>
      )}
      {block.kind === "chart" && (
        <>
          <div className="instrument-chart-title">
            <strong>{formatMetric(asset?.price ?? null, "price")}</strong>
            <span
              className={
                (asset?.change24h ?? 0) >= 0 ? "is-positive" : "is-negative"
              }
            >
              {formatMetric(asset?.change24h ?? null, "change24h")}{" "}
              <small>24h</small>
            </span>
          </div>
          {history.length > 1 ? (
            <div className="instrument-chart">
              <div className="chart-range">
                <span>{formatMetric(high, "price")}</span>
                <span>{formatMetric(low, "price")}</span>
              </div>
              <svg
                viewBox="0 0 600 165"
                role="img"
                aria-label={`${symbol} daily price chart from ${history[0].timestamp} to ${history.at(-1)?.timestamp}`}
              >
                <path
                  d="M20 20 H580 M20 82 H580 M20 145 H580"
                  stroke="currentColor"
                  opacity=".12"
                  fill="none"
                />
                <path
                  d={path}
                  stroke="var(--teal)"
                  strokeWidth="2.5"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="chart-dates">
                <span>{history[0].timestamp.slice(0, 10)}</span>
                <span>{history.length} daily observations</span>
                <span>{history.at(-1)?.timestamp.slice(0, 10)}</span>
              </div>
              <details className="chart-data"><summary>Read chart values</summary><table><caption>{symbol} daily USD prices</caption><thead><tr><th scope="col">Date</th><th scope="col">Price</th></tr></thead><tbody>{history.map(point => <tr key={point.timestamp}><th scope="row">{point.timestamp.slice(0, 10)}</th><td>{formatMetric(point.price, "price")}</td></tr>)}</tbody></table></details>
            </div>
          ) : (
            <div className="instrument-empty">
              History unavailable for {symbol}. This connector currently
              requests BTC, ETH and SOL.
            </div>
          )}
        </>
      )}
      {(block.kind === "table" || block.kind === "ranking") && (
        <div className="instrument-table">
          <table aria-label={block.title}><thead><tr className="instrument-row instrument-table-head">
            <th scope="col">Asset</th>
            {columns.map(metric => <th scope="col" key={metric}>{METRICS[metric].label}</th>)}
          </tr></thead><tbody>
          {rows.map((a, i) => (
            <tr className="instrument-row" key={a.id}>
              <th scope="row">
                <small>{String(i + 1).padStart(2, "0")}</small>
                {a.symbol}
              </th>
              {columns.map(metric => <td key={metric}
                className={
                  METRICS[metric].unit === "%"
                    ? (metricValue(a, metric) ?? 0) >= 0
                      ? "is-positive"
                      : "is-negative"
                    : ""
                }
              >
                {formatMetric(metricValue(a, metric), metric)}
              </td>)}
            </tr>
          ))}
          </tbody></table>
          {!rows.length && (
            <div className="instrument-empty">
              No matching assets in the current CMC response.
            </div>
          )}
          <p className="instrument-formula">
            {block.kind === "ranking"
              ? "Universe: returned top-market listings"
              : `${c.symbols.join(", ")} · selected assets`}{" "}
            · {c.ascending ? "ascending" : "descending"}
          </p>
        </div>
      )}
      {block.kind === "rule" && (
        <>
          <div
            className={`condition-state condition-${state.replace(" ", "-")}`}
          >
            <ShieldAlert />
            <strong>
              {state === "met"
                ? "Condition met"
                : state === "not met"
                  ? "Condition not met"
                  : "Unknown — data unavailable"}
            </strong>
          </div>
          <p className="condition-expression">
            {symbol} · {METRICS[c.metric].label}
            <br />
            <strong>
              {c.operator === "gt" ? "above" : "below"}{" "}
              {formatMetric(c.threshold, c.metric)}
            </strong>
          </p>
          <div className="instrument-formula">
            Current: {formatMetric(value, c.metric)}
            <br />
            {METRICS[c.metric].formula}
          </div>
          <p className="condition-disclaimer">
            Evaluated on refresh while this page is open. No background alerts
            or trade execution.
          </p>
        </>
      )}
      {block.kind === "note" && <p className="instrument-note">{c.text}</p>}
      {block.kind === "source" && (
        <>
          <p className="instrument-note">{c.text}</p>
          {source ? (
            <a
              className="source-link"
              href={source}
              target="_blank"
              rel="noopener noreferrer"
            >
              {new URL(source).hostname}
              <ExternalLink />
            </a>
          ) : (
            <p className="instrument-empty">
              Add an http(s) source URL in the editor.
            </p>
          )}
          <p className="condition-disclaimer">
            Reference link only. Content is not fetched or verified.
          </p>
        </>
      )}
      {!["note", "source"].includes(block.kind) && (
        <footer className="instrument-source">
          <span className={stale ? "is-negative" : "is-positive"}>
            {stale ? "Data unavailable / stale" : "● CoinMarketCap"}
          </span>
          <span>
            {data
              ? `Retrieved ${new Date(data.retrievedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Waiting for data"}
          </span>
        </footer>
      )}
      {watched.length > 0 && <div className={`instrument-evidence ${triggered.length ? "needs-review" : ""}`} role="status"><strong>{triggered.length ? "Thesis needs review" : "Linked conditions"}</strong><p>{triggered.length ? triggered.map(rule => rule.title).join(", ") + " — condition met. Revisit this thesis; this is not a trade instruction." : watched.map(rule => `${rule.title}: ${evaluateRule(rule, board, data, now, failed)}`).join(" · ")}</p></div>}
    </div>
  );
}
