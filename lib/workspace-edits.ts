import type { Block, Connection, WorkspaceBoard } from "./workspace";

const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Content fingerprint for stale-proposal detection, never an authentication token. */
export function boardRevision(board: WorkspaceBoard): string {
  let hash = 2166136261;
  const value = JSON.stringify(board);
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return `${board.id}:${value.length}:${(hash >>> 0).toString(16)}`;
}

/** Three-way merge: disjoint edits survive; competing edits never silently win. */
export function mergeBoard(base: WorkspaceBoard, local: WorkspaceBoard, remote: WorkspaceBoard) {
  const conflicts: string[] = [];
  function merge(a: unknown, l: unknown, r: unknown, path: string): unknown {
    if (equal(l, a)) return r;
    if (equal(r, a) || equal(l, r)) return l;
    if (a && l && r && typeof a === "object" && typeof l === "object" && typeof r === "object" && !Array.isArray(a) && !Array.isArray(l) && !Array.isArray(r)) {
      const aa = a as Record<string, unknown>, ll = l as Record<string, unknown>, rr = r as Record<string, unknown>;
      return Object.fromEntries([...new Set([...Object.keys(aa), ...Object.keys(ll), ...Object.keys(rr)])].map(key => [key, merge(aa[key], ll[key], rr[key], `${path}.${key}`)]));
    }
    conflicts.push(path);
    return l;
  }
  function entities<T extends { id: string }>(a: T[], l: T[], r: T[], name: string): T[] {
    const common = new Set(a.filter(x => l.some(y => y.id === x.id) && r.some(y => y.id === x.id)).map(x => x.id));
    const order = (items: T[]) => items.filter(x => common.has(x.id)).map(x => x.id);
    const localReordered = !equal(order(a), order(l));
    if (localReordered && !equal(order(a), order(r)) && !equal(order(l), order(r))) conflicts.push(`${name}.order`);
    const ids = [...new Set((localReordered ? [...l, ...r] : [...r, ...l]).map(x => x.id))];
    return ids.map(id => merge(a.find(x => x.id === id), l.find(x => x.id === id), r.find(x => x.id === id), `${name}.${id}`)).filter(Boolean) as T[];
  }
  const blocks = entities(base.blocks, local.blocks, remote.blocks, "widgets");
  const connections = entities(base.connections, local.connections, remote.connections, "links");
  const valid = new Set(blocks.map(b => b.id));
  const merged = {
    ...local,
    name: merge(base.name, local.name, remote.name, "name") as string,
    asset: merge(base.asset, local.asset, remote.asset, "asset") as string,
    legacy: merge(base.legacy, local.legacy, remote.legacy, "legacy") as WorkspaceBoard["legacy"],
    blocks,
    connections: connections.filter(c => valid.has(c.from) && valid.has(c.to)),
  };
  if (blocks.length > 100 || connections.length > 200) conflicts.push("board capacity");
  return { board: merged, conflicts };
}

/** Apply only properties changed in the inspector, retaining newer canvas edits. */
export function applyDraft(current: WorkspaceBoard, original: Block, draft: Block, links: Connection[], originalLinks: Connection[]) {
  const unrelated = current.connections.filter(c => c.from !== draft.id && c.to !== draft.id);
  const base = { ...current, blocks: current.blocks.map(b => b.id === draft.id ? original : b), connections: [...unrelated, ...originalLinks] };
  const local = { ...current, blocks: current.blocks.map(b => b.id === draft.id ? draft : b), connections: [...unrelated, ...links] };
  return mergeBoard(base, local, current).board;
}

export type BoardChange = { key: string; label: string; before: string; after: string; category: "widget" | "link" | "context"; id?: string };
function describe(block: Block) {
  return `${block.title} · ${block.kind} · ${block.config.asset} · ${block.config.metric}${block.kind === "rule" ? ` ${block.config.operator} ${block.config.threshold}` : ""}`;
}
function changedSummary(before: Block, after: Block) {
  const labels: Record<string, string> = { asset: "Asset", metric: "Calculation", symbols: "Assets", limit: "Rows", ascending: "Ascending", operator: "Comparison", threshold: "Threshold", text: "Text", url: "Source", columns: "Columns", minimum: "Minimum value", historyDays: "Daily observations" };
  const fields: Array<[string, unknown, unknown]> = [["Title", before.title, after.title], ["Type", before.kind, after.kind], ["Position locked", before.locked ?? false, after.locked ?? false]];
  for (const key of ["x", "y", "w", "h"] as const) fields.push([key.toUpperCase(), before.rect[key], after.rect[key]]);
  for (const key of new Set([...Object.keys(before.config), ...Object.keys(after.config)])) fields.push([labels[key] ?? key, before.config[key as keyof Block["config"]], after.config[key as keyof Block["config"]]]);
  const changed = fields.filter(([, a, b]) => !equal(a, b));
  const display = (value: unknown) => value === undefined || value === null ? "Default" : Array.isArray(value) ? value.join(", ") : String(value);
  return { before: changed.map(([label, value]) => `${label}: ${display(value)}`).join(" · ").slice(0, 500), after: changed.map(([label, , value]) => `${label}: ${display(value)}`).join(" · ").slice(0, 500) };
}
export function boardChanges(base: WorkspaceBoard, next: WorkspaceBoard): BoardChange[] {
  const changes: BoardChange[] = [];
  for (const field of ["name", "asset"] as const) if (base[field] !== next[field]) changes.push({ key: field, label: field === "asset" ? "Board asset" : "Board name", before: base[field], after: next[field], category: "context" });
  for (const id of new Set([...base.blocks.map(b => b.id), ...next.blocks.map(b => b.id)])) {
    const before = base.blocks.find(b => b.id === id), after = next.blocks.find(b => b.id === id);
    if (!equal(before, after)) changes.push({ key: `widget:${id}`, id, category: "widget", label: `${!before ? "Add" : !after ? "Remove" : "Update"} ${after?.title ?? before?.title}`, ...(before && after ? changedSummary(before, after) : { before: before ? describe(before) : "Not on this board", after: after ? describe(after) : "Remove from this board" }) });
  }
  for (const id of new Set([...base.connections.map(c => c.id), ...next.connections.map(c => c.id)])) {
    const before = base.connections.find(c => c.id === id), after = next.connections.find(c => c.id === id);
    const describeLink = (c: Connection | undefined, b: WorkspaceBoard) => c ? `${b.blocks.find(w => w.id === c.from)?.title} → ${c.relation} → ${b.blocks.find(w => w.id === c.to)?.title}` : "No relationship";
    if (!equal(before, after)) changes.push({ key: `link:${id}`, id, category: "link", label: `${after ? "Connect" : "Disconnect"} evidence`, before: describeLink(before, base), after: describeLink(after, next) });
  }
  return changes;
}
export function applyChanges(current: WorkspaceBoard, proposed: WorkspaceBoard, selected: string[]) {
  const next = structuredClone(current);
  const keys = new Set(selected);
  if (keys.has("name")) next.name = proposed.name;
  if (keys.has("asset")) next.asset = proposed.asset;
  for (const change of boardChanges(current, proposed)) {
    if (!keys.has(change.key)) continue;
    if (change.category === "widget") {
      const block = proposed.blocks.find(b => b.id === change.id);
      const index = next.blocks.findIndex(b => b.id === change.id);
      if (block && index >= 0) next.blocks[index] = structuredClone(block);
      else if (block) next.blocks.push(structuredClone(block));
      else next.blocks = next.blocks.filter(b => b.id !== change.id);
    }
    if (change.category === "link") {
      next.connections = next.connections.filter(c => c.id !== change.id);
      const link = proposed.connections.find(c => c.id === change.id);
      if (link) next.connections.push(structuredClone(link));
    }
  }
  next.connections = next.connections.filter(c => next.blocks.some(b => b.id === c.from) && next.blocks.some(b => b.id === c.to));
  return next;
}
