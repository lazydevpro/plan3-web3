import { templateBoard, METRICS, type Metric } from "./workspace.ts";

export function createResearchBoard(input: { question: string; asset: string; metric: Metric; operator: "lt" | "gt"; threshold: number }) {
  if (!input.question.trim() || !Number.isFinite(input.threshold) || !Object.hasOwn(METRICS, input.metric)) throw new Error("A question and valid condition are required.");
  const board = templateBoard();
  board.name = input.question.trim().slice(0, 100);
  board.asset = input.asset;
  board.blocks = board.blocks.filter(b => ["note", "chart", "table", "rule"].includes(b.kind));
  board.blocks.forEach(block => {
    if (block.kind === "note") { block.config.text = `Research question\n${input.question.trim().slice(0, 600)}\n\nReview trigger\nRevisit when ${input.asset} ${METRICS[input.metric].label.toLowerCase()} is ${input.operator === "lt" ? "below" : "above"} ${input.threshold}${METRICS[input.metric].unit}.\n\nEvidence notes\nRecord what the chart and watchlist support or contradict.`; block.rect = { x: 0, y: 0, w: 420, h: 340 }; }
    if (block.kind === "chart") block.rect = { x: 436, y: 0, w: 600, h: 340 };
    if (block.kind === "table") block.rect = { x: 436, y: 356, w: 600, h: 300 };
    if (block.kind === "rule") { block.config.metric = input.metric; block.config.operator = input.operator; block.config.threshold = input.threshold; block.title = "Thesis review trigger"; block.rect = { x: 0, y: 356, w: 420, h: 300 }; }
  });
  return board;
}
