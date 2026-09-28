"use client";
/* Browser storage hydration and WebMCP capability detection are external-system
   synchronization. Their effects intentionally publish state after hydration. */
/* eslint-disable react-hooks/set-state-in-effect */

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  Grip,
  Layers3,
  Link2,
  Minus,
  Plus,
  Redo2,
  RefreshCw,
  Search,
  Settings2,
  Share2,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";
import type { useCmcMarket } from "@/hooks/use-cmc-market";
import {
  BOARD_STORAGE_KEY,
  defaultBoard,
  decodeBoard,
  parseBoard,
  WIDGET_IDS,
  type WidgetId,
  type BoardState,
} from "@/lib/plan3-board";
import {
  assetsFrom,
  duplicateBlock,
  KINDS,
  makeBlock,
  METRICS,
  migrateBoard,
  parseWorkspaceBoard,
  removeBlock,
  templateBoard,
  uid,
  WORKSPACE_KEY,
  safeSource,
  type Block,
  type BlockKind,
  type Connection,
  type Metric,
  type Workspace,
  type WorkspaceBoard,
} from "@/lib/workspace";
import { BuilderWidget } from "./builder-widgets";
import Image from "next/image";
import { applyDraft, applyChanges, boardChanges, boardRevision, mergeBoard, contentEqual } from "@/lib/workspace-edits";
import { ResearchSetup } from "./research-setup";
import { WidgetBoundary } from "./widget-boundary";

type CatalogItem = {
  id: WidgetId;
  name: string;
  detail: string;
  access: string;
};
type Props = {
  market: ReturnType<typeof useCmcMarket>;
  catalog: CatalogItem[];
  renderPreset: (id: WidgetId, board: WorkspaceBoard, setProposal?: (status: "pending" | "accepted" | "rejected") => void) => ReactNode;
};
type History = {
  past: WorkspaceBoard[];
  present: WorkspaceBoard;
  future: WorkspaceBoard[];
};
type Panel = "library" | "edit" | "boards" | "agent" | "help" | "health" | null;
const kindLabels: Record<BlockKind, string> = {
  metric: "Metric",
  chart: "Price chart",
  table: "Watchlist",
  ranking: "Ranking",
  rule: "Condition",
  note: "Thesis / note",
  source: "Source link",
  preset: "CMC preset",
};

export function BuilderWorkspace({ market, catalog, renderPreset }: Props) {
  const [history, setHistory] = useState<History>(() => ({
    past: [],
    present: templateBoard(),
    future: [],
  }));
  const board = history.present;
  const [boards, setBoards] = useState<WorkspaceBoard[]>([]);
  const [ready, setReady] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [live, setLive] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [listView, setListView] = useState(false);
  const [libraryMode, setLibraryMode] = useState<"instruments" | "feeds">("instruments");
  const [setupComplete, setSetupComplete] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const panelTrigger = useRef<HTMLElement | null>(null);
  const [formError, setFormError] = useState("");
  const [compactScreen, setCompactScreen] = useState(false);
  useEffect(() => { const media = window.matchMedia("(max-width: 1100px)"); const update = () => setCompactScreen(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  const [selected, setSelected] = useState<string | null>(null);
  const [selection, setSelection] = useState<string[]>([]);
  const [draft, setDraft] = useState<Block | null>(null);
  const draftBase = useRef<Block | null>(null);
  const linkBase = useRef<Connection[]>([]);
  const [draftLinks, setDraftLinks] = useState<Connection[]>([]);
  const [legacyDraft, setLegacyDraft] = useState<BoardState>(defaultBoard);
  const legacyBase = useRef<BoardState>(defaultBoard);
  const savedBase = useRef(new Map<string, WorkspaceBoard>());
  const [saveState, setSaveState] = useState("Opening…");
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [revisions, setRevisions] = useState<Array<{ at: string; board: WorkspaceBoard }>>([]);
  const [proposalBase, setProposalBase] = useState<WorkspaceBoard | null>(null);
  const [acceptedKeys, setAcceptedKeys] = useState<string[]>([]);
  const [proposalMode, setProposalMode] = useState<"new" | "patch">("new");
  const [proposalReason, setProposalReason] = useState("");
  const [agentAvailable, setAgentAvailable] = useState(false);
  const shareDialog = useRef<HTMLDialogElement>(null);
  const agentScroll = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState(false);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [links, setLinks] = useState(true);
  const [notice, setNotice] = useState("");
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 9000); return () => window.clearTimeout(timer); }, [notice]);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [relation, setRelation] = useState<Connection["relation"]>("supports");
  const [target, setTarget] = useState("");
  const [proposed, setProposed] = useState<WorkspaceBoard | null>(null);
  const [prompt, setPrompt] = useState("");
  const [drag, setDrag] = useState<{ id: string; rect: Block["rect"]; group: Record<string, Block["rect"]> } | null>(
    null,
  );
  const viewport = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const gesture = useRef<{
    id: string;
    kind: "move" | "resize";
    x: number;
    y: number;
    scrollX: number;
    scrollY: number;
    start: Block["rect"];
    next: Block["rect"];
    group: Record<string, Block["rect"]>;
  } | null>(null);
  const pan = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const space = useRef(false);
  const latestContext = useRef({ board, data: market.data });
  useEffect(() => { latestContext.current = { board, data: market.data }; }, [board, market.data]);
  const assets = assetsFrom(market.data);
  const symbolOptions = [
    ...new Set([
      board.asset,
      "BTC",
      "ETH",
      "SOL",
      ...assets.map((a) => a.symbol),
    ]),
  ];
  const activeBlock = board.blocks.find((b) => b.id === selected);
  const editable = !readOnly && !live;
  const setExpanded = market.setExpanded;
  useEffect(() => { setExpanded(board.blocks.some(b => b.kind === "preset") || (panel === "library" && libraryMode === "feeds") || panel === "health"); }, [board.blocks, panel, libraryMode, setExpanded]);
  useEffect(() => {
    if (panel) {
      if (!panelTrigger.current?.isConnected && !panelRef.current?.contains(document.activeElement)) panelTrigger.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else if (panelTrigger.current?.isConnected) { panelTrigger.current.focus(); panelTrigger.current = null; }
  }, [panel, setupComplete]);
  const bounds = {
    w: Math.max(
      1320,
      ...board.blocks.map(
        (b) =>
          (drag?.id === b.id
            ? drag.rect.x + drag.rect.w
            : (drag?.group[b.id] ?? b.rect).x + b.rect.w) + 32,
      ),
    ),
    h: Math.max(
      740,
      ...board.blocks.map(
        (b) =>
          (drag?.id === b.id
            ? drag.rect.y + drag.rect.h
            : (drag?.group[b.id] ?? b.rect).y + b.rect.h) + 48,
      ),
    ),
  };

  function commit(
    next: WorkspaceBoard | ((current: WorkspaceBoard) => WorkspaceBoard),
  ) {
    if (readOnly) return;
    setHistory((h) => ({
      past: [...h.past.slice(-49), h.present],
      present: typeof next === "function" ? next(h.present) : next,
      future: [],
    }));
  }
  function undo() {
    if (!readOnly)
      setHistory((h) =>
        h.past.length
          ? {
              past: h.past.slice(0, -1),
              present: h.past.at(-1)!,
              future: [h.present, ...h.future],
            }
          : h,
      );
    setDraft(null);
    setSelected(null);
    if (panel === "edit") setPanel(null);
  }
  function redo() {
    if (!readOnly)
      setHistory((h) =>
        h.future.length
          ? {
              past: [...h.past, h.present],
              present: h.future[0],
              future: h.future.slice(1),
            }
          : h,
      );
    setDraft(null);
    setSelected(null);
    if (panel === "edit") setPanel(null);
  }
  function remove(id: string) {
    commit((b) => removeBlock(b, id));
    setSelected(null);
    setSelection(ids => ids.filter(i => i !== id));
    setPanel(null);
  }
  function duplicate(block: Block) {
    if (board.blocks.length >= 100)
      return setNotice("A board supports up to 100 widgets.");
    const copy = duplicateBlock(block);
    commit((b) => ({ ...b, blocks: [...b.blocks, copy] }));
    setSelected(copy.id);
    setNotice("Widget duplicated. Its configuration is independent.");
  }
  function openEditor(block: Block, isNew = false) {
    setFormError("");
    legacyBase.current = structuredClone(block.presetSettings ?? board.legacy ?? defaultBoard);
    setLegacyDraft(structuredClone(legacyBase.current));
    draftBase.current = structuredClone(block);
    linkBase.current = board.connections.filter(c => c.from === block.id || c.to === block.id);
    setDraftLinks(structuredClone(linkBase.current));
    setDraft(structuredClone(block));
    setCreating(isNew);
    setSelected(isNew ? null : block.id);
    setTarget("");
    setPanel("edit");
  }
  function add(block: Block) {
    if (board.blocks.length >= 100)
      return setNotice("A board supports up to 100 widgets.");
    const left = Math.round((viewport.current?.scrollLeft ?? 0) / zoom);
    const top = Math.round((viewport.current?.scrollTop ?? 0) / zoom);
    let position = { ...block.rect, x: left, y: top };
    for (let attempt = 0; attempt < 100 && board.blocks.some(b => position.x < b.rect.x + b.rect.w && position.x + position.w > b.rect.x && position.y < b.rect.y + b.rect.h && position.y + position.h > b.rect.y); attempt++) {
      position = { ...position, y: position.y + 48 };
    }
    const added = { ...block, rect: position };
    commit((b) => ({ ...b, blocks: [...b.blocks, added] }));
    setSelected(added.id);
    setPanel(null);
    setDraft(null);
    requestAnimationFrame(() =>
      viewport.current?.scrollTo({
        top: Math.max(0, position.y * zoom - 24),
      }),
    );
  }
  function switchBoard(next: WorkspaceBoard, newBoard = false) {
    setSelection([]);
    setBoards((all) => {
      const saved = all.filter(
        (b) => b.id !== board.id && (!newBoard || b.id !== next.id),
      );
      return [...saved, board, ...(newBoard ? [next] : [])];
    });
    setHistory({ past: [], present: next, future: [] });
    setSelected(null);
    setPanel(null);
    setZoom(1);
    viewport.current?.scrollTo(0, 0);
  }
  function remix() {
    const copy = {
      ...structuredClone(board),
      id: uid(),
      name: `${board.name} · remix`.slice(0, 100),
    };
    setReadOnly(false);
    setLive(false);
    window.history.replaceState({}, "", window.location.pathname);
    setHistory({ past: [], present: copy, future: [] });
    setBoards((all) => [...all, copy]);
    setNotice(
      "Editable local copy created. The original snapshot is unchanged.",
    );
  }
  function fit() {
    const width = viewport.current?.clientWidth ?? 1200,
      height = viewport.current?.clientHeight ?? 700;
    setZoom(
      Math.max(
        0.25,
        Math.min(1, (width - 24) / bounds.w, (height - 24) / bounds.h),
      ),
    );
    viewport.current?.scrollTo(0, 0);
  }
  function patchConfig(patch: Partial<Block["config"]>) {
    setDraft((d) => (d ? { ...d, config: { ...d.config, ...patch } } : d));
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(board, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${board.name.replace(/[^a-z0-9-]/gi, "-")}.plan3.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(
      "Board manifest exported. API keys and market responses are not included.",
    );
  }
  function share() {
    setCopied(false);
    try {
      const bytes = new TextEncoder().encode(JSON.stringify(board));
      const encoded = btoa(
        Array.from(bytes, (b) => String.fromCharCode(b)).join(""),
      );
      if (encoded.length > 60000)
        return setNotice(
          "This board is too large for a link. Use Export instead.",
        );
      setShareUrl(
        `${window.location.origin}${window.location.pathname}#workspace=${encodeURIComponent(encoded)}`,
      );
    } catch {
      setNotice("Could not create a link. Use Export instead.");
    }
  }

  function recoverStorage() {
    try {
      const original = localStorage.getItem(WORKSPACE_KEY);
      // Do not replace unreadable content unless a separate recovery copy succeeds.
      if (original) localStorage.setItem(`${WORKSPACE_KEY}.recovery.${Date.now()}`, original);
      const valid = [...boards.filter(b => b.id !== board.id), board].filter(b => parseWorkspaceBoard(b, WIDGET_IDS, parseBoard));
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify({ boards: valid, activeId: board.id }));
      savedBase.current.clear();
      for (const b of valid) savedBase.current.set(b.id, b);
      setStorageBlocked(false);
      setSaveState("Saved locally");
      setNotice("Local saving restored. The previous stored content was kept in a separate recovery backup in this browser.");
    } catch { setNotice("Storage is still unavailable or full. Export your board before closing this tab. No original stored content was deleted."); }
  }

  useEffect(() => {
    let next = templateBoard();
    let savedBoards: WorkspaceBoard[] = [];
    let shared = false;
    try {
      setListView(localStorage.getItem("plan3.reading-view") === "list" || window.matchMedia("(max-width: 680px)").matches);
      const stored = localStorage.getItem(WORKSPACE_KEY);
      if (stored) {
        const saved = JSON.parse(stored) as Workspace;
        if (!Array.isArray(saved.boards))
          throw new Error("Invalid saved workspace");
        savedBoards = saved.boards
          .map((b) => parseWorkspaceBoard(b, WIDGET_IDS, parseBoard))
          .filter((b): b is WorkspaceBoard => !!b);
        if (savedBoards.length !== saved.boards.length) throw new Error("Some saved boards could not be read. Export your current work before repairing storage");
        next =
          savedBoards.find((b) => b.id === saved.activeId) ??
          savedBoards[0] ??
          next;
      } else {
        const old = localStorage.getItem(BOARD_STORAGE_KEY);
        const parsed = old && parseBoard(JSON.parse(old));
        if (parsed) {
          next = migrateBoard(parsed);
          savedBoards = [next];
        }
      }
      const params = new URLSearchParams(window.location.search);
      const encoded = new URLSearchParams(window.location.hash.slice(1)).get("workspace") ?? params.get("workspace");
      const legacy = params.get("share");
      if (encoded) {
        if (encoded.length > 60000) throw new Error("Share link is too large");
        const parsed = parseWorkspaceBoard(
          JSON.parse(
            new TextDecoder().decode(
              Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
            ),
          ),
          WIDGET_IDS,
          parseBoard,
        );
        if (!parsed) throw new Error("Invalid shared board");
        next = parsed;
        shared = true;
      } else if (legacy) {
        const parsed = decodeBoard(legacy);
        if (!parsed) throw new Error("Invalid shared board");
        next = migrateBoard(parsed);
        shared = true;
      }
    } catch (error) {
      setStorageBlocked(true);
      setSaveState("Storage needs recovery · export");
      setNotice(
        `${error instanceof Error ? error.message : "Could not load saved board"}. Original browser storage has not been deleted.`,
      );
    }
    setBoards(savedBoards.length ? savedBoards : [next]);
    for (const b of savedBoards) savedBase.current.set(b.id, b);
    setHistory({ past: [], present: next, future: [] });
    setReadOnly(shared);
    setLive(shared);
    if (!shared && !savedBoards.length) setPanel("help");
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || readOnly || storageBlocked) return;
    let cancelled = false;
    setSaveState("Saving…");
    const save = () => {
      if (cancelled) return;
      try {
      const stored = localStorage.getItem(WORKSPACE_KEY);
      const prior = stored ? (JSON.parse(stored) as Workspace) : null;
      const merged = new Map(boards.map((b) => [b.id, b]));
      if (Array.isArray(prior?.boards))
        for (const candidate of prior.boards) {
          const valid = parseWorkspaceBoard(candidate, WIDGET_IDS, parseBoard);
          if (valid) merged.set(valid.id, valid);
        }
      const remote = merged.get(board.id);
      const base = savedBase.current.get(board.id);
      const result = base && remote ? mergeBoard(base, board, remote) : { board, conflicts: [] };
      let next = result.board;
      if (result.conflicts.length) {
        next = { ...board, id: uid(), name: `${board.name} · recovered edit`.slice(0, 100) };
        setNotice("Another tab changed the same fields. Both versions are safe: your changes are in a recovered board. Compare them in Boards.");
      } else if (!contentEqual(next, board)) {
        setNotice("Changes from another tab merged. Both sets of edits are preserved.");
      }
      merged.set(next.id, next);
      if (remote && !contentEqual(remote, next)) {
        const key = `${WORKSPACE_KEY}.history.${board.id}`;
        const old: Array<{ at: string; board: WorkspaceBoard }> = JSON.parse(localStorage.getItem(key) ?? "[]");
        localStorage.setItem(key, JSON.stringify([{ at: new Date().toISOString(), board: remote }, ...(Array.isArray(old) ? old : [])].slice(0, 12)));
      }
      localStorage.setItem(
        WORKSPACE_KEY,
        JSON.stringify({ activeId: next.id, boards: [...merged.values()] }),
      );
      savedBase.current.set(next.id, next);
      setSaveState("Saved locally");
      if (!contentEqual(next, board)) {
        setBoards([...merged.values()]);
        setHistory(h => h.present === board ? { past: [], present: next, future: [] } : h);
        setPanel(null);
      }
    } catch {
      setSaveState("Not saved · export now");
      setNotice(
        "Browser storage is full or unavailable. Export your board to keep it.",
      );
    }};
    // Web Locks serializes read/merge/write across tabs on this origin.
    if (navigator.locks) void navigator.locks.request(WORKSPACE_KEY, save);
    else { setSaveState("Autosave unsupported · export now"); setNotice("This browser cannot safely coordinate saves. Export your board, or use a browser with Web Locks support."); }
    return () => { cancelled = true; };
  }, [board, boards, ready, readOnly, storageBlocked]);
  useEffect(() => {
    if (panel !== "boards") return;
    try {
      const saved = JSON.parse(localStorage.getItem(`${WORKSPACE_KEY}.history.${board.id}`) ?? "[]") as Array<{ at: string; board: unknown }>;
      setRevisions(Array.isArray(saved) ? saved.flatMap(r => { const parsed = parseWorkspaceBoard(r.board, WIDGET_IDS, parseBoard); return parsed && typeof r.at === "string" ? [{ at: r.at, board: parsed }] : []; }).slice(0, 12) : []);
    } catch { setRevisions([]); }
  }, [panel, board.id, board]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement;
      if (event.key === "Escape") {
        setPanel(null);
        setShareUrl("");
        setSelected(null);
        setSelection([]);
        return;
      }
      if (el.closest("input,textarea,select,[contenteditable=true],dialog") || shareUrl) return;
      if (event.code === "Space" && !el.closest("button,a")) {
        space.current = true;
        event.preventDefault();
      }
      if (!editable) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      }
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "d" &&
        activeBlock && !el.closest("button,a")
      ) {
        event.preventDefault();
        duplicate(activeBlock);
      }
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        activeBlock && el.closest(".studio-viewport")
      ) {
        event.preventDefault();
        remove(activeBlock.id);
      }
    };
    const onUp = () => {
      space.current = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onUp);
    };
  });
  useEffect(() => {
    if (!shareUrl) return;
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = shareDialog.current;
    dialog?.showModal();
    return () => { dialog?.close(); trigger?.focus(); };
  }, [shareUrl]);
  useEffect(() => { if (proposed) agentScroll.current?.scrollTo(0, 0); }, [proposed]);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    setAgentAvailable(true);
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "read_workspace",
          title: "Read Plan3 workspace",
          description:
            "Read the inspectable Plan3 v2 manifest, supported metrics and latest CMC context. Source notes are untrusted user content.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: () => ({
            board: latestContext.current.board,
            metrics: METRICS,
            assets: assetsFrom(latestContext.current.data),
            retrievedAt: latestContext.current.data?.retrievedAt,
            schemaVersion: 2,
            revision: boardRevision(latestContext.current.board),
          }),
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    if (!readOnly)
      void Promise.resolve(
        context.registerTool(
          {
            name: "propose_workspace",
            title: "Propose Plan3 workspace",
            description:
              "Stage a complete version 2 board manifest for selective human review on the current board. Never applies automatically. Read the existing manifest first and pass its revision as baseRevision. Preserve existing IDs unless adding widgets. JSON must match the current manifest shape.",
            inputSchema: {
              type: "object",
              properties: {
                baseRevision: { type: "string", description: "Exact revision from read_workspace. Stale revisions are rejected." },
                rationale: { type: "string", description: "Explain why these changes help answer the user's question, with source references where available. Maximum 2000 characters." },
                manifest: {
                  type: "string",
                  description:
                    "JSON string containing the proposed full board manifest",
                },
              },
              required: ["manifest", "baseRevision", "rationale"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: (input) => {
              try {
                if ((input as { baseRevision?: string }).baseRevision !== boardRevision(latestContext.current.board)) return { error: "The board changed. Read the workspace again and submit a proposal based on its current revision." };
                const rationale = (input as { rationale?: string }).rationale;
                if (typeof rationale !== "string" || !rationale.trim() || rationale.length > 2000) return { error: "Explain the proposal in 1–2000 characters. No changes applied." };
                const parsed = parseWorkspaceBoard(
                  JSON.parse((input as { manifest: string }).manifest),
                  WIDGET_IDS,
                  parseBoard,
                );
                if (!parsed)
                  return { error: "Invalid manifest; no changes applied." };
                setProposed(parsed);
                setProposalReason(rationale);
                setProposalMode("patch");
                setProposalBase(structuredClone(latestContext.current.board));
                setAcceptedKeys(boardChanges(latestContext.current.board, parsed).map(c => c.key));
                setPanel("agent");
                return {
                  status: "awaiting_human_approval",
                  widgets: parsed.blocks.length,
                };
              } catch {
                return { error: "Invalid JSON; no changes applied." };
              }
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => undefined);
    return () => lifecycle.abort();
  }, [readOnly]);

  function startGesture(
    event: ReactPointerEvent<HTMLButtonElement>,
    block: Block,
    kind: "move" | "resize",
  ) {
    if (!editable || block.locked || event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(block.id);
    const ids = selection.includes(block.id) ? selection : [block.id];
    setSelection(ids);
    gesture.current = {
      id: block.id,
      kind,
      x: event.clientX,
      y: event.clientY,
      scrollX: viewport.current?.scrollLeft ?? 0,
      scrollY: viewport.current?.scrollTop ?? 0,
      start: block.rect,
      next: block.rect,
      group: Object.fromEntries(board.blocks.filter(b => ids.includes(b.id) && !b.locked).map(b => [b.id, b.rect])),
    };
  }
  function moveGesture(event: ReactPointerEvent<HTMLButtonElement>) {
    const g = gesture.current;
    if (!g) return;
    const dx =
        (event.clientX -
          g.x +
          (viewport.current?.scrollLeft ?? 0) -
          g.scrollX) /
        zoom,
      dy =
        (event.clientY - g.y + (viewport.current?.scrollTop ?? 0) - g.scrollY) /
        zoom;
    g.next =
      g.kind === "move"
        ? {
            ...g.start,
            x: Math.max(0, Math.min(50000, Math.round(g.start.x + dx))),
            y: Math.max(0, Math.min(50000, Math.round(g.start.y + dy))),
          }
        : {
            ...g.start,
            w: Math.max(240, Math.min(10000, Math.round(g.start.w + dx))),
            h: Math.max(160, Math.min(10000, Math.round(g.start.h + dy))),
          };
    if (snap && g.kind === "move") g.next = { ...g.next, x: Math.round(g.next.x / 16) * 16, y: Math.round(g.next.y / 16) * 16 };
    if (g.kind === "move") {
      const rects = Object.values(g.group);
      g.next.x = g.start.x + Math.max(-Math.min(...rects.map(r => r.x)), Math.min(50000 - Math.max(...rects.map(r => r.x)), g.next.x - g.start.x));
      g.next.y = g.start.y + Math.max(-Math.min(...rects.map(r => r.y)), Math.min(50000 - Math.max(...rects.map(r => r.y)), g.next.y - g.start.y));
    }
    setDrag({ id: g.id, rect: g.next, group: g.kind === "move" ? Object.fromEntries(Object.entries(g.group).map(([id, r]) => [id, { ...r, x: r.x + g.next.x - g.start.x, y: r.y + g.next.y - g.start.y }])) : {} });
  }
  function endGesture(cancel = false) {
    const g = gesture.current;
    if (g && !cancel && JSON.stringify(g.start) !== JSON.stringify(g.next))
      commit((b) => ({
        ...b,
        blocks: b.blocks.map((w) =>
          g.kind === "move" && g.group[w.id] ? { ...w, rect: { ...w.rect, x: g.group[w.id].x + g.next.x - g.start.x, y: g.group[w.id].y + g.next.y - g.start.y } } : w.id === g.id ? { ...w, rect: g.next } : w,
        ),
      }));
    gesture.current = null;
    setDrag(null);
  }
  function nudge(event: React.KeyboardEvent, block: Block, resize = false) {
    if (
      !editable || block.locked ||
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    )
      return;
    event.preventDefault();
    const delta = event.shiftKey ? 1 : 10;
    const dx =
      event.key === "ArrowRight"
        ? delta
        : event.key === "ArrowLeft"
          ? -delta
          : 0;
    const dy =
      event.key === "ArrowDown" ? delta : event.key === "ArrowUp" ? -delta : 0;
    commit((b) => ({
      ...b,
      blocks: b.blocks.map((w) =>
        w.id !== block.id
          ? w
          : {
              ...w,
              rect: resize
                ? {
                    ...w.rect,
                    w: Math.max(240, w.rect.w + dx),
                    h: Math.max(160, w.rect.h + dy),
                  }
                : {
                    ...w.rect,
                    x: Math.max(0, w.rect.x + dx),
                    y: Math.max(0, w.rect.y + dy),
                  },
            },
      ),
    }));
  }
  function guidedProposal() {
    const lower = prompt.toLowerCase();
    const next = templateBoard(
      /risk|invalid|protect/.test(lower) ? "risk" : "momentum",
    );
    next.asset =
      symbolOptions.find((s) => new RegExp(`\\b${s}\\b`, "i").test(prompt)) ??
      board.asset;
    next.name = `Research · ${next.asset}`;
    const note = next.blocks.find((b) => b.kind === "note")!;
    note.config.text = `Research question\n${prompt}\n\nTo investigate\nCompare price, volume intensity and peer returns. Edit the condition to state what would invalidate your idea.\n\nThis is a rule-based starter, not an AI-generated conclusion.`;
    setProposed(next);
    setProposalReason("A rule-based starter combining price, volume, peer comparison and an editable invalidation condition. Check every assumption before using it.");
    setProposalMode("new");
    setProposalBase(null);
  }

  if (!ready)
    return <div className="studio-loading">Opening your workspace…</div>;
  return (
    <main className="studio">
      <header className="studio-header">
        <div className="studio-brand">
          <Image src="/plan3-symbol.svg" alt="" width={28} height={28} unoptimized />
          <strong>
            PLAN<sup>3</sup>
          </strong>
          <span>WORKSPACE</span>
        </div>
        <button
          className="studio-board-switch"
          onClick={() => setPanel(panel === "boards" ? null : "boards")}
        >
          <Layers3 />
          <span>{board.name}</span>
          <small>⌄</small>
        </button>
        <div className="studio-saved">
          <Check />
          {readOnly ? "Shared snapshot" : saveState}
        </div>
        <div className="studio-header-actions">
          <button onClick={download} title="Export board manifest">
            <Download />
            <span>Export</span>
          </button>
          <button onClick={share} aria-label="Share">
            <Share2 />
            <span>Share</span>
          </button>
          {readOnly ? (
            <button className="studio-primary" onClick={remix}>
              <Copy /><span>Remix board</span>
            </button>
          ) : (
            <button
              className="studio-primary"
              onClick={() => {
                setLive(false);
                openEditor(makeBlock("metric"), true);
              }}
            >
              <Plus />
              Create widget
            </button>
          )}
        </div>
      </header>
      <div className="studio-toolbar">
        <div className="studio-tabs">
          <button
            className={!live ? "active" : ""}
            disabled={readOnly}
            onClick={() => setLive(false)}
          >
            Build
          </button>
          <button
            className={live ? "active" : ""}
            onClick={() => {
              setLive(true);
              setPanel(null);
            }}
          >
            Observe
          </button>
        </div>
        <span className="studio-divider" />
        <label className="studio-context">
          <Link2 />
          Board asset
          <select
            aria-label="Board asset"
            disabled={readOnly}
            value={board.asset}
            onChange={(e) => commit((b) => ({ ...b, asset: e.target.value }))}
          >
            {symbolOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <span className="studio-subtle">
          Linked widgets follow · pinned widgets stay
        </span>
        <div className="studio-toolbar-end">
          <button aria-pressed={listView} onClick={() => { setListView(!listView); try { localStorage.setItem("plan3.reading-view", !listView ? "list" : "canvas"); } catch { /* View preference must not block board editing. */ } }}>{listView ? "List view" : "Canvas view"}</button>
          <button
            disabled={!editable || !history.past.length}
            onClick={undo}
            title="Undo (⌘Z)"
          >
            <Undo2 />
          </button>
          <button
            disabled={!editable || !history.future.length}
            onClick={redo}
            title="Redo (⌘⇧Z)"
          >
            <Redo2 />
          </button>
          <span className="studio-divider" />
          <button
            className={links ? "active" : ""}
            onClick={() => setLinks(!links)}
            title="Toggle evidence links"
          >
            <Link2 />
          </button>
          <button
            onClick={market.retry}
            disabled={market.refreshing}
            title="Refresh CMC data"
          >
            <RefreshCw className={market.refreshing ? "is-spinning" : ""} />
          </button>
          <button className="studio-data-state" onClick={() => setPanel(panel === "health" ? null : "health")} aria-label="Inspect data health">
            {market.loading
              ? "Connecting…"
              : market.error
                ? "Data error"
                : market.refreshing ? `Loading feeds · ${Object.values(market.data?.feeds ?? {}).filter(f => f.status !== "pending").length}/${Object.keys(market.data?.feeds ?? {}).length}` : `CMC · ${market.data?.health ?? "unavailable"}`}
          </button>
        </div>
      </div>
      <div className="studio-body">
        <nav className="studio-rail" aria-label="Workspace tools">
          <button
            className={panel === "library" ? "active" : ""}
            onClick={() => setPanel(panel === "library" ? null : "library")}
            title="Widget library"
          >
            <Plus />
            <span>Library</span>
          </button>
          <button
            className={panel === "boards" ? "active" : ""}
            onClick={() => setPanel(panel === "boards" ? null : "boards")}
            title="Boards and templates"
          >
            <Layers3 />
            <span>Boards</span>
          </button>
          <button
            className={panel === "agent" ? "active" : ""}
            onClick={() => setPanel(panel === "agent" ? null : "agent")}
            title="Agent collaboration"
          >
            <Sparkles />
            <span>Agent</span>
          </button>
          <div className="studio-rail-bottom">
            <button onClick={() => setPanel(panel === "help" ? null : "help")} title="Workspace guide">
              <ArrowUpRight />
              <span>Guide</span>
            </button>
          </div>
        </nav>
        <section className="studio-workarea" inert={compactScreen && !!panel}>
          {storageBlocked && <div className="studio-recovery-banner" role="alert"><span>Local saving is paused. Original stored content is protected.</span><button onClick={download}>Export current board</button><button onClick={recoverStorage}>Back up storage & repair saves</button></div>}
          <div className="studio-canvas-heading">
            <div>
              <span className="eyebrow">RESEARCH CANVAS</span>
              <span>
                {board.blocks.length} widgets <i> / </i>
                {board.connections.length} evidence links
              </span>
            </div>
            <span>
              {listView ? "Reading order · full-size widgets · switch to Canvas view to arrange" : editable
                ? "Drag the header · resize the corner · Space + drag to pan"
                : "Observe mode · layout locked"}
            </span>
          </div>
          {editable && !listView && <div className="studio-build-tools">
            <button aria-pressed={snap} onClick={() => setSnap(!snap)}>{snap ? "Snap · on" : "Snap · off"}</button>
            <span>Optional 16px guides · free placement by default</span>
            {selection.length > 1 && <>
              <strong>{selection.length} selected</strong>
              <button onClick={() => commit(b => { const items = b.blocks.filter(w => selection.includes(w.id) && !w.locked); const x = Math.min(...items.map(w => w.rect.x)); return { ...b, blocks: b.blocks.map(w => items.includes(w) ? { ...w, rect: { ...w.rect, x } } : w) }; })}>Align left</button>
              <button onClick={() => commit(b => { const items = b.blocks.filter(w => selection.includes(w.id) && !w.locked); const y = Math.min(...items.map(w => w.rect.y)); return { ...b, blocks: b.blocks.map(w => items.includes(w) ? { ...w, rect: { ...w.rect, y } } : w) }; })}>Align top</button>
              <button onClick={() => setSelection([])}>Clear selection</button>
            </>}
            {activeBlock && <>
              <button onClick={() => commit(b => ({ ...b, blocks: b.blocks.map(w => w.id === activeBlock.id ? { ...w, locked: !w.locked } : w) }))}>{activeBlock.locked ? "Unlock position" : "Lock position"}</button>
              <button onClick={() => commit(b => ({ ...b, blocks: [...b.blocks.filter(w => w.id !== activeBlock.id), ...b.blocks.filter(w => w.id === activeBlock.id)] }))}>Bring to front</button>
              <button onClick={() => commit(b => ({ ...b, blocks: [...b.blocks.filter(w => w.id === activeBlock.id), ...b.blocks.filter(w => w.id !== activeBlock.id)] }))}>Send to back</button>
            </>}
          </div>}
          <div
            className={`studio-viewport ${listView ? "studio-list-view" : ""}`}
            tabIndex={0}
            role="region"
            aria-label={listView ? "Research widgets in reading order" : "Research canvas"}
            ref={viewport}
            onPointerDown={(e) => {
              if (e.button === 1 || (space.current && e.button === 0)) {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                pan.current = {
                  x: e.clientX,
                  y: e.clientY,
                  left: e.currentTarget.scrollLeft,
                  top: e.currentTarget.scrollTop,
                };
              }
            }}
            onPointerMove={(e) => {
              if (pan.current) {
                e.currentTarget.scrollLeft =
                  pan.current.left - (e.clientX - pan.current.x);
                e.currentTarget.scrollTop =
                  pan.current.top - (e.clientY - pan.current.y);
              }
            }}
            onPointerUp={() => {
              pan.current = null;
            }}
            onPointerCancel={() => {
              pan.current = null;
            }}
          >
            <div
              className="studio-scaled"
              style={{ width: bounds.w * zoom, height: bounds.h * zoom }}
            >
              <div
                className="studio-stage"
                style={{
                  width: bounds.w,
                  height: bounds.h,
                  transform: `scale(${zoom})`,
                }}
              >
                {links && !listView && (
                  <svg
                    className="studio-connections"
                    width={bounds.w}
                    height={bounds.h}
                    aria-label="Evidence relationships"
                  >
                    <defs>
                      <marker
                        id="connection-arrow"
                        markerWidth="7"
                        markerHeight="7"
                        refX="6"
                        refY="3.5"
                        orient="auto"
                      >
                        <path d="M0 0 L7 3.5 L0 7" fill="var(--copper)" />
                      </marker>
                    </defs>
                    {board.connections.map((c) => {
                      const from = board.blocks.find((b) => b.id === c.from),
                        to = board.blocks.find((b) => b.id === c.to);
                      if (!from || !to) return null;
                      const a = drag?.id === from.id ? drag.rect : drag?.group[from.id] ?? from.rect,
                        b = drag?.id === to.id ? drag.rect : drag?.group[to.id] ?? to.rect;
                      const x1 = a.x + a.w,
                        y1 = a.y + a.h / 2,
                        x2 = b.x,
                        y2 = b.y + b.h / 2;
                      return (
                        <g key={c.id}>
                          <path
                            d={`M${x1},${y1} C${x1 + 50},${y1} ${x2 - 50},${y2} ${x2},${y2}`}
                            markerEnd="url(#connection-arrow)"
                          />
                          <text
                            x={(x1 + x2) / 2}
                            y={(y1 + y2) / 2 - 8}
                            textAnchor="middle"
                          >
                            {c.relation}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
                {!board.blocks.length && (
                  <div className="studio-empty">
                    <span className="eyebrow">START WITH A QUESTION</span>
                    <h1>
                      Your workspace.
                      <br />
                      Your way of thinking.
                    </h1>
                    <p>
                      Compose a metric, a chart, a condition.
                      <br />
                      Connect the evidence to your thesis.
                    </p>
                    {!readOnly && (
                      <button
                        className="studio-primary"
                        onClick={() => openEditor(makeBlock("metric"), true)}
                      >
                        <Plus />
                        Create your first widget
                      </button>
                    )}
                  </div>
                )}
                {(listView ? [...board.blocks].sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x) : board.blocks).map((block, blockIndex) => {
                  const rect = drag?.id === block.id ? drag.rect : drag?.group[block.id] ?? block.rect;
                  return (
                    <article
                      className={`studio-block ${selected === block.id || selection.includes(block.id) ? "is-selected" : ""}`}
                      key={block.id}
                      data-block-id={block.id}
                      data-kind={block.kind}
                      aria-label={block.title}
                      style={{
                        left: rect.x,
                        top: rect.y,
                        width: rect.w,
                        height: rect.h,
                        zIndex:
                          drag?.id === block.id
                            ? 200
                            : blockIndex + 2,
                      }}
                      onClick={(event) => { setSelected(block.id); if (event.shiftKey) setSelection(ids => ids.includes(block.id) ? ids.filter(id => id !== block.id) : [...ids, block.id]); }}
                    >
                      <header className="studio-block-header">
                        <button
                          className="studio-grip"
                          title={`Move ${block.title}`}
                          aria-label={`Move ${block.title}`}
                          disabled={!editable || block.locked || listView}
                          onPointerDown={(e) => {
                            if (!space.current) startGesture(e, block, "move");
                          }}
                          onPointerMove={moveGesture}
                          onPointerUp={() => endGesture()}
                          onPointerCancel={() => endGesture(true)}
                          onKeyDown={(e) => nudge(e, block)}
                        >
                          <Grip />
                          <span>{block.title}</span>
                        </button>
                        {editable && (
                          <>
                            <button title={`Select ${block.title}`} aria-pressed={selection.includes(block.id)} onClick={e => { e.stopPropagation(); setSelected(block.id); setSelection(ids => ids.includes(block.id) ? ids.filter(id => id !== block.id) : [...ids, block.id]); }}><Check /></button>
                            <button
                              title={`Duplicate ${block.title}`}
                              onClick={() => duplicate(block)}
                            >
                              <Copy />
                            </button>
                            <button
                              title={`Edit ${block.title}`}
                              onClick={() => openEditor(block)}
                            >
                              <Settings2 />
                            </button>
                          </>
                        )}
                      </header>
                      <div className="studio-block-content">
                        <WidgetBoundary resetKey={JSON.stringify(block)}>
                        {block.kind === "preset" && block.config.preset ? (
                          renderPreset(block.config.preset, { ...board, legacy: block.presetSettings ?? board.legacy }, editable ? status => commit(b => ({ ...b, blocks: b.blocks.map(w => w.id === block.id ? { ...w, presetSettings: { ...(w.presetSettings ?? b.legacy ?? defaultBoard), monitor: { ...(w.presetSettings ?? b.legacy ?? defaultBoard).monitor, status } } } : w) })) : undefined)
                        ) : (
                          <BuilderWidget
                            block={block}
                            board={board}
                            data={market.data}
                            failed={!!market.error}
                            loading={market.loading}
                          />
                        )}
                        </WidgetBoundary>
                      </div>
                      {editable && !block.locked && (
                        <button
                          className="studio-resize"
                          aria-label={`Resize ${block.title}`}
                          onPointerDown={(e) =>
                            startGesture(e, block, "resize")
                          }
                          onPointerMove={moveGesture}
                          onPointerUp={() => endGesture()}
                          onPointerCancel={() => endGesture(true)}
                          onKeyDown={(e) => nudge(e, block, true)}
                        >
                          <ArrowDownRight />
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="studio-canvas-footer">
            <span>
              {readOnly
                ? "Read-only snapshot · live market values"
                : `${saveState} · no trades executed`}
            </span>
            <div hidden={listView}>
              <button
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))}
              >
                <Minus />
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              >
                <Plus />
              </button>
              <button onClick={fit}>
                <ZoomIn />
                Fit
              </button>
            </div>
          </div>
        </section>
        {panel && (
          <aside
            ref={panelRef}
            tabIndex={-1}
            aria-label="Workspace panel"
            role={compactScreen ? "dialog" : "region"}
            aria-modal={compactScreen || undefined}
            onKeyDown={event => {
              if (!compactScreen || event.key !== "Tab") return;
              const elements = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary')].filter(el => el.checkVisibility() && !el.closest('[inert]') && (!el.closest('details:not([open])') || el.tagName === 'SUMMARY'));
              const first = elements[0], last = elements.at(-1);
              if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last?.focus(); }
              else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }}
            className={`studio-panel ${panel === "library" ? "studio-library" : ""}`}
          >
            <header>
              <div>
                <span className="eyebrow">
                  {panel === "edit"
                    ? "WIDGET COMPOSER"
                    : panel === "agent"
                      ? "HUMAN + AGENT"
                      : "WORKSPACE TOOLS"}
                </span>
                <h2>
                  {panel === "edit"
                    ? creating
                      ? "Make it yours"
                      : "Edit instrument"
                    : panel === "library"
                      ? "Start with a widget"
                      : panel === "boards"
                        ? "Boards & playbooks"
                        : panel === "help" ? "Your research loop" : panel === "health" ? "Data health" : "Build with context"}
                </h2>
              </div>
              <button onClick={() => setPanel(null)} aria-label="Close panel">
                <X />
              </button>
            </header>
            {panel === "library" && (
              <>
                <div className="studio-panel-intro">
                  <p>
                    Instruments have editable calculations and asset bindings. CMC feeds provide specialist views with a fixed scope.
                  </p>
                  <button
                    disabled={!editable}
                    className="studio-primary"
                    onClick={() => openEditor(makeBlock("metric"), true)}
                  >
                    <Plus />
                    Create custom widget
                  </button>
                </div>
                <div className="studio-library-modes" role="group" aria-label="Widget category"><button aria-pressed={libraryMode === "instruments"} onClick={() => { setLibraryMode("instruments"); setQuery(""); }}>Your instruments</button><button aria-pressed={libraryMode === "feeds"} onClick={() => { setLibraryMode("feeds"); setQuery(""); }}>CMC feeds</button></div>
                <label className="studio-search">
                  <Search />
                  <input
                    type="search"
                    placeholder={libraryMode === "feeds" ? "Search CMC feeds…" : "Search instruments…"}
                    aria-label="Search widgets"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <div className="studio-preset-list">
                  {libraryMode === "instruments" ? <>
                    {KINDS.filter(kind => kind !== "preset" && kindLabels[kind].toLowerCase().includes(query.toLowerCase())).map(kind => <div className="studio-preset" key={kind}><div><strong>{kindLabels[kind]}</strong><button disabled={!editable} onClick={() => openEditor(makeBlock(kind), true)}>Customize</button></div><div className="studio-preset-preview" inert><BuilderWidget block={makeBlock(kind)} board={board} data={market.data} loading={market.loading} failed={!!market.error} /></div><p>Independent settings · preview before adding</p></div>)}
                    {!KINDS.some(kind => kind !== "preset" && kindLabels[kind].toLowerCase().includes(query.toLowerCase())) && <p>No instruments match. Try “chart”, “condition”, or “note”.</p>}
                  </> : <>
                  {!catalog.some(c => `${c.name} ${c.detail}`.toLowerCase().includes(query.toLowerCase())) && <div className="studio-panel-intro"><h3>No matching widgets</h3><p>Try “price”, “volume”, or build your own instrument.</p><button onClick={() => setQuery("")}>Clear search</button></div>}
                  {catalog
                    .filter((c) =>
                      `${c.name} ${c.detail}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((c) => (
                      <div className="studio-preset" key={c.id}>
                        <div>
                          <strong>{c.name}</strong>
                          <button
                            disabled={!editable}
                            onClick={() => {
                              const b = makeBlock("preset", { title: c.name });
                              b.config.preset = c.id;
                              add(b);
                            }}
                          >
                            <Plus />
                            Add
                          </button>
                        </div>
                        <div className="studio-preset-preview" inert>
                          {renderPreset(c.id, board)}
                        </div>
                        <p>
                          {c.detail} · {c.access}
                        </p>
                      </div>
                    ))}
                  </>}
                </div>
              </>
            )}
            {panel === "edit" && draft && (
              <>
                <div className="studio-panel-scroll">
                  <label>
                    Widget title
                    <input
                      maxLength={100}
                      value={draft.title}
                      onChange={(e) =>
                        setDraft({ ...draft, title: e.target.value })
                      }
                    />
                  </label>
                  {draft.kind === "preset" && draft.config.preset === "thesis" && <label>Thesis summary<textarea rows={5} maxLength={600} value={legacyDraft.thesis.summary} onChange={e => setLegacyDraft({ ...legacyDraft, thesis: { ...legacyDraft.thesis, summary: e.target.value } })} /><small>These settings belong to this widget. Duplicates are independent. Maximum 600 characters.</small></label>}
                  {draft.kind === "preset" && draft.config.preset === "agent" && <fieldset><legend>Board monitor · human approval</legend>
                    <label>Description<textarea rows={3} maxLength={400} value={legacyDraft.monitor.description} onChange={e => setLegacyDraft({ ...legacyDraft, monitor: { ...legacyDraft.monitor, description: e.target.value } })} /></label>
                    <label>Volume change below (%)<input type="number" value={legacyDraft.monitor.volumeChangeBelow} onChange={e => setLegacyDraft({ ...legacyDraft, monitor: { ...legacyDraft.monitor, volumeChangeBelow: Number(e.target.value) || 0 } })} /></label>
                    <label>Funding above (%)<input type="number" step="0.01" value={legacyDraft.monitor.fundingAbove * 100} onChange={e => setLegacyDraft({ ...legacyDraft, monitor: { ...legacyDraft.monitor, fundingAbove: (Number(e.target.value) || 0) / 100 } })} /></label>
                    <label>Approval<select value={legacyDraft.monitor.status} onChange={e => setLegacyDraft({ ...legacyDraft, monitor: { ...legacyDraft.monitor, status: e.target.value as "pending" | "accepted" | "rejected" } })}><option value="pending">Pending review</option><option value="accepted">Approved</option><option value="rejected">Rejected</option></select></label>
                  </fieldset>}
                  {draft.kind !== "preset" && (
                    <>
                      <label>
                        Visualization
                        <select
                          value={draft.kind}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              kind: e.target.value as BlockKind,
                            })
                          }
                        >
                          {KINDS.filter((k) => k !== "preset").map((k) => (
                            <option value={k} key={k}>
                              {kindLabels[k]}
                            </option>
                          ))}
                        </select>
                      </label>
                      {!["note", "source", "table", "ranking"].includes(
                        draft.kind,
                      ) && (
                        <label>
                          Asset binding
                          <select
                            value={draft.config.asset}
                            onChange={(e) =>
                              patchConfig({ asset: e.target.value })
                            }
                          >
                            <option value="$asset">
                              Linked to board · {board.asset}
                            </option>
                            {[
                              ...new Set([
                                draft.config.asset,
                                ...symbolOptions,
                              ]),
                            ]
                              .filter((s) => s !== "$asset")
                              .map((s) => (
                                <option key={s} value={s}>
                                  Pinned · {s}
                                </option>
                              ))}
                          </select>
                        </label>
                      )}
                      {["metric", "ranking", "table", "rule"].includes(
                        draft.kind,
                      ) && (
                        <label>
                          Data / calculation
                          <select
                            value={draft.config.metric}
                            onChange={(e) =>
                              patchConfig({ metric: e.target.value as Metric })
                            }
                          >
                            {Object.entries(METRICS).map(([key, m]) => (
                              <option key={key} value={key}>
                                {m.label} ({m.unit})
                              </option>
                            ))}
                          </select>
                          <small>{METRICS[draft.config.metric].formula}</small>
                        </label>
                      )}
                      {["table", "ranking"].includes(draft.kind) && (
                        <>
                          <label>Minimum value · selected calculation<input type="number" placeholder="No minimum" value={draft.config.minimum ?? ""} onChange={e => patchConfig({ minimum: e.target.value === "" ? null : Number(e.target.value) })} /><small>Only show rows at or above this value.</small></label>
                          {draft.kind === "table" && <fieldset><legend>Visible columns · up to six</legend><div className="studio-symbols">{Object.entries(METRICS).map(([metric, info]) => {
                            const columns = draft.config.columns ?? [...new Set([draft.config.metric, "price" as Metric])];
                            return <label key={metric}><input type="checkbox" checked={columns.includes(metric as Metric)} disabled={!columns.includes(metric as Metric) && columns.length >= 6} onChange={e => { const next = e.target.checked ? [...columns, metric as Metric] : columns.filter(m => m !== metric); if (next.length) patchConfig({ columns: next }); }} />{info.label}</label>;
                          })}</div></fieldset>}
                          <div className="studio-field-row">
                            <label>
                              Sort
                              <select
                                value={String(draft.config.ascending)}
                                onChange={(e) =>
                                  patchConfig({
                                    ascending: e.target.value === "true",
                                  })
                                }
                              >
                                <option value="false">Highest first</option>
                                <option value="true">Lowest first</option>
                              </select>
                            </label>
                            <label>
                              Rows
                              <input
                                type="number"
                                min={1}
                                max={30}
                                value={draft.config.limit}
                                onChange={(e) =>
                                  patchConfig({
                                    limit: Math.max(
                                      1,
                                      Math.min(30, Number(e.target.value) || 1),
                                    ),
                                  })
                                }
                              />
                            </label>
                          </div>
                          {draft.kind === "table" && (
                            <fieldset>
                              <legend>Included assets</legend>
                              <div className="studio-symbols">
                                {symbolOptions.map((s) => (
                                  <label key={s}>
                                    <input
                                      type="checkbox"
                                      checked={draft.config.symbols.includes(s)}
                                      onChange={(e) =>
                                        patchConfig({
                                          symbols: e.target.checked
                                            ? [...draft.config.symbols, s]
                                            : draft.config.symbols.filter(
                                                (a) => a !== s,
                                              ),
                                        })
                                      }
                                    />
                                    {s}
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                          )}
                        </>
                      )}
                      {draft.kind === "rule" && (
                        <div className="studio-field-row">
                          <label>
                            Condition
                            <select
                              value={draft.config.operator}
                              onChange={(e) =>
                                patchConfig({
                                  operator: e.target.value as "gt" | "lt",
                                })
                              }
                            >
                              <option value="lt">Below</option>
                              <option value="gt">Above</option>
                            </select>
                          </label>
                          <label>
                            Threshold ({METRICS[draft.config.metric].unit})
                            <input
                              type="number"
                              value={draft.config.threshold}
                              onChange={(e) =>
                                patchConfig({
                                  threshold: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </label>
                        </div>
                      )}
                      {["note", "source"].includes(draft.kind) && (
                        <label>
                          {draft.kind === "note"
                            ? "Thesis, evidence & invalidation"
                            : "Source context"}
                          <textarea
                            rows={7}
                            maxLength={8000}
                            value={draft.config.text}
                            onChange={(e) =>
                              patchConfig({ text: e.target.value })
                            }
                          />
                        </label>
                      )}
                      {draft.kind === "source" && (
                        <label>
                          Reference URL
                          <input
                            type="url"
                            placeholder="https://…"
                            value={draft.config.url}
                            maxLength={2000}
                            onChange={(e) =>
                              patchConfig({ url: e.target.value })
                            }
                          />
                          <small>
                            Opens externally. Websites may block embedding.
                          </small>
                        </label>
                      )}
                    </>
                  )}
                  <section className="studio-preview-section">
                    {draft.kind === "chart" && <label>History window<select value={draft.config.historyDays ?? 14} onChange={e => patchConfig({ historyDays: Number(e.target.value) as 7 | 14 })}><option value={7}>Last 7 daily observations</option><option value={14}>Last 14 daily observations</option></select></label>}
                    <span className="eyebrow">
                      ACTUAL PREVIEW · CURRENT DATA
                    </span>
                    <div className="studio-editor-preview">
                      {draft.kind === "preset" && draft.config.preset ? (
                        renderPreset(draft.config.preset, { ...board, legacy: legacyDraft })
                      ) : (
                        <BuilderWidget
                          block={draft}
                          board={board}
                          data={market.data}
                          failed={!!market.error}
                          loading={market.loading}
                        />
                      )}
                    </div>
                    {draft.kind === "preset" && (
                      <p className="studio-subtle">CMC feed scope is fixed. Use Your instruments for editable calculations and asset bindings. Thesis and monitor settings are independent per widget.</p>
                    )}
                  </section>
                  {!creating && (
                    <>
                      <section className="studio-position">
                        <span className="eyebrow">POSITION & SIZE</span>
                        <div className="studio-field-row">
                          {(["x", "y", "w", "h"] as const).map((key) => (
                            <label key={key}>
                              {key.toUpperCase()}
                              <input
                                type="number"
                                disabled={draft.locked}
                                value={draft.rect[key]}
                                min={key === "w" ? 240 : key === "h" ? 160 : 0}
                                onChange={(e) =>
                                  setDraft({
                                    ...draft,
                                    rect: {
                                      ...draft.rect,
                                      [key]: Math.max(
                                        key === "w"
                                          ? 240
                                          : key === "h"
                                            ? 160
                                            : 0,
                                        Math.min(
                                          50000,
                                          Number(e.target.value) || 0,
                                        ),
                                      ),
                                    },
                                  })
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </section>
                      <section className="studio-relations">
                        <span className="eyebrow">EVIDENCE RELATIONSHIPS</span>
                        <p>
                          These are your assertions, not automated causal
                          findings.
                        </p>
                        {draftLinks
                          .filter(
                            (c) => c.from === draft.id || c.to === draft.id,
                          )
                          .map((c) => (
                            <div key={c.id}>
                              <span>
                                {
                                  board.blocks.find((b) => b.id === c.from)
                                    ?.title
                                }{" "}
                                <em>{c.relation}</em>{" "}
                                {board.blocks.find((b) => b.id === c.to)?.title}
                              </span>
                              <button
                                aria-label="Remove evidence link"
                                onClick={() =>
                                  setDraftLinks(links => links.filter(
                                      (link) => link.id !== c.id,
                                    ))
                                }
                              >
                                <X />
                              </button>
                            </div>
                          ))}
                        <label>
                          Relationship
                          <select
                            value={relation}
                            onChange={(e) =>
                              setRelation(
                                e.target.value as Connection["relation"],
                              )
                            }
                          >
                            {[
                              "supports",
                              "contradicts",
                              "watches",
                              "derived from",
                            ].map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Connect this widget to
                          <select
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                          >
                            <option value="">Choose a widget…</option>
                            {board.blocks
                              .filter((b) => b.id !== draft.id)
                              .map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.title}
                                </option>
                              ))}
                          </select>
                        </label>
                        <button
                          disabled={!target}
                          onClick={() => {
                            if (board.connections.filter(c => c.from !== draft.id && c.to !== draft.id).length + draftLinks.length >= 200)
                              return setNotice(
                                "Maximum 200 evidence links per board.",
                              );
                            if (
                              draftLinks.some(
                                (c) =>
                                  c.from === draft.id &&
                                  c.to === target &&
                                  c.relation === relation,
                              )
                            )
                              return setNotice(
                                "That relationship already exists.",
                              );
                            setDraftLinks(links => [
                                ...links,
                                {
                                  id: uid(),
                                  from: draft.id,
                                  to: target,
                                  relation,
                                },
                              ]);
                            setTarget("");
                          }}
                        >
                          <Link2 />
                          Add evidence link
                        </button>
                      </section>
                    </>
                  )}
                </div>
                <footer className="studio-panel-footer">
                  {formError && <p className="studio-form-error" role="alert">{formError}</p>}
                  {!creating && (
                    <button
                      aria-label="Delete widget"
                      onClick={() => remove(draft.id)}
                    >
                      <Trash2 />
                    </button>
                  )}
                  <button onClick={() => setPanel(null)}>Cancel</button>
                  <button
                    className="studio-primary"
                    onClick={() => {
                      if (!draft.title.trim()) return setFormError("Give this widget a title before saving.");
                      if (draft.kind === "source" && draft.config.url && !safeSource(draft.config.url)) return setFormError("Use a full http:// or https:// URL without a username or password.");
                      if (!Number.isFinite(draft.config.threshold) || (draft.config.minimum != null && !Number.isFinite(draft.config.minimum))) return setFormError("Threshold and minimum must be valid numbers.");
                      if (draft.kind === "preset" && draft.config.preset === "agent" && (legacyDraft.monitor.volumeChangeBelow < -100 || legacyDraft.monitor.volumeChangeBelow > 100 || legacyDraft.monitor.fundingAbove < -1 || legacyDraft.monitor.fundingAbove > 1)) return setFormError("Monitor percentages must be between −100 and 100. Your changes have not been saved.");
                      if (creating) add(draft);
                      else {
                        commit(b => {
                          const edited = draft.kind === "preset" && ["thesis", "agent"].includes(draft.config.preset ?? "") ? { ...draft, presetSettings: legacyDraft } : draft;
                          return applyDraft(b, draftBase.current ?? draft, edited, draftLinks, linkBase.current);
                        });
                        setPanel(null);
                        setNotice("Widget and evidence links saved. Undo is available.");
                      }
                    }}
                  >
                    <Check />
                    {creating ? "Add to canvas" : "Apply changes"}
                  </button>
                </footer>
              </>
            )}
            {panel === "boards" && (
              <div className="studio-panel-scroll">
                {!readOnly && (
                  <label>
                    Current board name
                    <input
                      maxLength={100}
                      value={board.name}
                      onChange={(e) =>
                        commit((b) => ({ ...b, name: e.target.value }))
                      }
                    />
                  </label>
                )}
                <span className="eyebrow">YOUR LOCAL BOARDS</span>
                {[...boards.filter((b) => b.id !== board.id), board].map(
                  (b) => (
                    <button
                      className="studio-board-row"
                      key={b.id}
                      disabled={readOnly}
                      onClick={() => switchBoard(b)}
                    >
                      <Layers3 />
                      <span>
                        {b.name}
                        <small>{b.blocks.length} widgets</small>
                      </span>
                      {b.id === board.id && <Check />}
                    </button>
                  ),
                )}
                {!readOnly && (
                  <>
                    <span className="eyebrow">START A NEW PLAYBOOK</span>
                    {["blank", "momentum", "risk"].map((kind) => (
                      <button
                        className="studio-template"
                        key={kind}
                        onClick={() => switchBoard(templateBoard(kind), true)}
                      >
                        <div className={`template-art template-${kind}`}>
                          <i />
                          <i />
                          <i />
                          <i />
                        </div>
                        <strong>
                          {kind === "blank"
                            ? "Blank canvas"
                            : kind === "risk"
                              ? "Risk & invalidation"
                              : "Momentum research"}
                        </strong>
                        <span>
                          {kind === "blank"
                            ? "Build from first principles"
                            : "Metrics + evidence + explicit conditions"}
                        </span>
                      </button>
                    ))}
                    <div className="studio-field-row">
                      <button
                        onClick={() =>
                          switchBoard(
                            {
                              ...structuredClone(board),
                              id: uid(),
                              name: `${board.name} copy`.slice(0, 100),
                            },
                            true,
                          )
                        }
                      >
                        <Copy />
                        Duplicate board
                      </button>
                      <button onClick={() => importRef.current?.click()}>
                        <Upload />
                        Import JSON
                      </button>
                    </div>
                    <p className="studio-subtle">
                      Boards stay in this browser. Export for backups; share a
                      snapshot for others to remix.
                    </p>
                    <span className="eyebrow">RECOVERY HISTORY · LAST 12 SAVES</span>
                    <p className="studio-subtle">Restore an earlier version as a separate board. Your current work stays intact. History is local to this browser.</p>
                    {!revisions.length && <p className="studio-subtle">Your next saved change will create the first recovery point.</p>}
                    {revisions.map((revision, index) => <button className="studio-board-row" key={`${revision.at}-${index}`} onClick={() => { switchBoard({ ...revision.board, id: uid(), name: `${revision.board.name} · restored`.slice(0, 100) }, true); setNotice("Earlier version restored as a new board. Original work preserved."); }}><Undo2 /><span>{new Date(revision.at).toLocaleString()}<small>{revision.board.blocks.length} widgets · {revision.board.connections.length} links · Restore as copy</small></span></button>)}
                  </>
                )}
              </div>
            )}
            {panel === "agent" && (
              <div className="studio-panel-scroll" ref={agentScroll}>
                {!proposed && <>
                <div className="studio-agent-note">
                  <Sparkles />
                  <h3>One canvas. A shared language.</h3>
                  <p>
                    Widgets expose their data, configuration, and evidence links
                    as a structured manifest. Compatible browser agents can read
                    it and propose changes for your approval.
                  </p>
                </div>
                <span className="eyebrow">GUIDED STARTER · RULE-BASED</span>
                <p className="studio-subtle">
                  This built-in starter chooses a template. It is not an LLM or
                  investment adviser.
                </p>
                <label>
                  Your research question
                  <textarea
                    value={prompt}
                    maxLength={600}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Investigate SOL momentum and when volume weakens…"
                    rows={4}
                  />
                </label>
                <button
                  className="studio-primary"
                  disabled={readOnly || prompt.trim().length < 8}
                  onClick={guidedProposal}
                >
                  <Sparkles />
                  Preview a research board
                </button>
                </>}
                {proposed && (
                  <section className="studio-proposal">
                    <span className="eyebrow">REVIEW BEFORE APPLYING</span>
                    <h3>{proposed.name}</h3>
                    <p>{proposalReason}</p>
                    <p>
                      {proposed.blocks.length} proposed widgets ·{" "}
                      {proposed.connections.length} links · {proposed.asset}
                    </p>
                    {proposalMode === "patch" && proposalBase ? <>
                      <p>Review individual changes to this board. Unchecked changes stay untouched.</p>
                      <div className="studio-change-list">
                        {boardChanges(proposalBase, proposed).map(change => <label key={change.key} className="studio-change">
                          <input type="checkbox" checked={acceptedKeys.includes(change.key)} onChange={e => setAcceptedKeys(keys => e.target.checked ? [...keys, change.key] : keys.filter(k => k !== change.key))} />
                          <span><strong>{change.label}</strong><small>Before: {change.before}</small><small>After: {change.after}</small>
                          {change.category === "widget" && <details><summary>Changed properties</summary><pre>{JSON.stringify({ before: proposalBase.blocks.find(b => b.id === change.id), after: proposed.blocks.find(b => b.id === change.id) }, null, 2)}</pre></details>}</span>
                        </label>)}
                      </div>
                      {JSON.stringify(board) !== JSON.stringify(proposalBase) && <p role="alert">This board changed after the proposal. Ask the agent to read it again and submit a fresh proposal; nothing will be overwritten.</p>}
                    </> : <ul>
                      {proposed.blocks.map((b) => (
                        <li key={b.id}>
                          {b.title} <small>{kindLabels[b.kind]}</small>
                        </li>
                      ))}
                    </ul>}
                    <details className="studio-manifest">
                      <summary>Inspect all proposed settings</summary>
                      <pre>{JSON.stringify(proposed, null, 2)}</pre>
                    </details>
                    <p className="studio-subtle">
                      {proposalMode === "new" ? "Creates a separate board. Your current board stays unchanged." : "Applies selected changes in one undoable step. Links to excluded or removed widgets are omitted."}
                    </p>
                    <div className="studio-field-row">
                      <button onClick={() => setProposed(null)}>Dismiss</button>
                      <button
                        className="studio-primary"
                        disabled={readOnly || (proposalMode === "patch" && (!acceptedKeys.length || JSON.stringify(board) !== JSON.stringify(proposalBase)))}
                        onClick={() => {
                          if (proposalMode === "patch") {
                            const next = applyChanges(board, proposed, acceptedKeys);
                            if (!parseWorkspaceBoard(next, WIDGET_IDS, parseBoard)) return setNotice("Selected changes exceed board limits. Select fewer additions.");
                            commit(next);
                          } else switchBoard({ ...proposed, id: uid() }, true);
                          setProposed(null);
                          setNotice(
                            proposalMode === "patch" ? "Selected agent changes applied. Undo restores the previous board." : "Proposal accepted as a new board. Your previous board is saved.",
                          );
                        }}
                      >
                        {proposalMode === "patch" ? `Apply ${acceptedKeys.length} ${acceptedKeys.length === 1 ? "change" : "changes"}` : "Accept board"}
                      </button>
                    </div>
                  </section>
                )}
                <section className="studio-manifest">
                  <p className="studio-subtle">{agentAvailable ? "Browser agent tools available · changes require your approval" : "No compatible browser agent detected. Use a guided starter or export the manifest."}</p>
                  <span className="eyebrow">INSPECTABLE MANIFEST</span>
                  <pre>
                    {JSON.stringify(
                      {
                        version: board.version,
                        asset: board.asset,
                        widgets: board.blocks.map((b) => ({
                          id: b.id.slice(0, 8),
                          kind: b.kind,
                          title: b.title,
                          asset: b.config.asset,
                          metric: b.config.metric,
                        })),
                        relationships: board.connections.length,
                      },
                      null,
                      2,
                    )}
                  </pre>
                  <button onClick={download}>
                    <Download />
                    Export full agent context
                  </button>
                </section>
              </div>
            )}
            {panel === "help" && <div className="studio-panel-scroll studio-guide">
              {!setupComplete ? <ResearchSetup disabled={!editable} onCreate={next => { switchBoard(next, true); setSetupComplete(true); setPanel("help"); setNotice("Your research loop is ready. The chart supports your thesis; the condition watches it. Everything is editable."); }} /> : <section className="research-receipt" role="status"><h3>Your research loop is ready.</h3><p>Read the evidence, refine your thesis, then review changes with an agent.</p><button onClick={() => { const thesis = board.blocks.find(b => b.kind === "note"); if (thesis) openEditor(thesis); }}>Refine my thesis</button><button onClick={() => setPanel("agent")}>Review with an agent</button><button onClick={() => setSetupComplete(false)}>Start another question</button></section>}
              <details><summary>How the research loop works</summary>
              <span className="eyebrow">QUESTION → EVIDENCE → REVIEW</span>
              <h3>Build a workspace that can change your mind.</h3>
              <ol>
                <li><strong>Write your question.</strong><p>Add a thesis / note. State what you believe and what would invalidate it.</p><button disabled={!editable} onClick={() => openEditor(makeBlock("note"), true)}>Add a thesis</button></li>
                <li><strong>Bring the evidence.</strong><p>Pick a metric or chart. Linked instruments follow the board asset; pin one to compare another asset.</p><button disabled={!editable} onClick={() => setPanel("library")}>Explore widgets</button></li>
                <li><strong>Make the condition explicit.</strong><p>Add a condition and connect it to your thesis with “watches”. A matching condition highlights that thesis for review.</p><button disabled={!editable} onClick={() => openEditor(makeBlock("rule"), true)}>Add a condition</button></li>
                <li><strong>Review, don’t blindly accept.</strong><p>A compatible agent can propose changes. Inspect the before/after, choose individual changes, and apply them together. Undo is always available in this session.</p><button onClick={() => setPanel("agent")}>Open collaboration</button></li>
              </ol>
              </details>
              <h3>Canvas shortcuts</h3><p>Arrow keys on a widget header move it. Shift + Arrow moves by 1px. Arrow keys on the resize handle change its size. ⌘/Ctrl + Z undoes. Hold Space on the canvas and drag to pan.</p>
              <p>Boards are saved in this browser, not a cloud account. Export regularly. Conditions run only while the page is open; this workspace never executes trades.</p>
            </div>}
            {panel === "health" && <div className="studio-panel-scroll">
              <h3>{market.loading ? "Connecting to CoinMarketCap…" : market.error ? "Refresh failed" : market.data?.health === "partial" ? "Some feeds need attention" : "Market data status"}</h3>
              <p className="studio-subtle">Each feed reports separately. A fresh response does not guarantee a fresh quote. Historical charts show their observation dates.</p>
              {market.error && <p role="alert">{market.error}</p>}
              <button onClick={market.retry} disabled={market.refreshing || market.loading}><RefreshCw />Retry data feeds</button>
              {Object.entries(market.data?.feeds ?? {}).map(([name, feed]) => <div className="studio-feed" key={name}><strong>{name}</strong><span className={feed.status === "error" ? "is-negative" : ""}>{feed.status === "pending" ? "Loading…" : feed.status === "error" ? "Unavailable · last-known values only" : "Received"}</span><small>{feed.message ?? (feed.updatedAt ? new Date(feed.updatedAt).toLocaleString() : "Waiting for this feed")}</small></div>)}
            </div>}
          </aside>
        )}
      </div>
      {(notice || market.error) && (
        <div className="studio-notice" role="status">
          <span>{notice || market.error}</span>
          {!notice && market.error ? <button onClick={market.retry} disabled={market.refreshing}>Retry</button> :
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X />
          </button>}
        </div>
      )}
      {shareUrl && (
          <dialog
            ref={shareDialog}
            className="studio-share"
            aria-modal="true"
            aria-labelledby="share-title"
            onCancel={() => setShareUrl("")}
          >
            <button
              className="studio-share-close"
              onClick={() => setShareUrl("")}
              aria-label="Close share dialog"
            >
              <X />
            </button>
            <span className="eyebrow">SHARE A WORKSPACE</span>
            <h2 id="share-title">Send the thinking, not just a chart.</h2>
            <p>
              A read-only snapshot of this board’s configuration, notes, and
              links. Market values refresh on opening. Recipients still need
              access to this private site.
            </p>
            <label>
              Snapshot link
              <input
                autoFocus
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
              />
            </label>
            <p className="studio-subtle">
              Anyone with the link can read its encoded board content. Do not
              include secrets.
            </p>
            <button
              className="studio-primary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setNotice("Snapshot link copied.");
                } catch {
                  setNotice(
                    "Clipboard unavailable. Select and copy the link manually.",
                  );
                }
              }}
            >
              <Copy />
              {copied ? "Copied" : "Copy link"}
            </button>
          </dialog>
      )}
      <input
        ref={importRef}
        tabIndex={-1}
        aria-label="Import board file"
        className="sr-only"
        type="file"
        accept=".json,application/json"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > 1_000_000)
            return setNotice("Import is limited to 1 MB.");
          try {
            const value = JSON.parse(await file.text());
            const parsed = parseWorkspaceBoard(value, WIDGET_IDS, parseBoard);
            if (!parsed) throw new Error("Invalid Plan3 v2 manifest");
            switchBoard(
              {
                ...parsed,
                id: uid(),
                name: `${parsed.name} · imported`.slice(0, 100),
              },
              true,
            );
            setNotice(
              "Imported as a new board. Existing boards were preserved.",
            );
          } catch (error) {
            setNotice(
              error instanceof Error
                ? error.message
                : "Could not import this file",
            );
          }
        }}
      />
    </main>
  );
}
