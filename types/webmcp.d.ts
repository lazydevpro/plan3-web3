interface Plan3ModelTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute(input: unknown): unknown | Promise<unknown>;
}

interface Plan3ModelContext {
  registerTool(tool: Plan3ModelTool, options?: { signal?: AbortSignal }): void | Promise<void>;
}

interface Document {
  readonly modelContext?: Plan3ModelContext;
}
