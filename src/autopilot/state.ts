export type AutopilotPhase = "active" | "blocked" | "completed" | "stopped";

export type AutopilotState = {
  queue: string[];
  remaining: string[];
  phase: AutopilotPhase;
  stalledContinuations: number;
  lastSummary?: string;
  blocker?: string;
  updatedAt: number;
};

export type Checkpoint = {
  status: "progress" | "issue-completed" | "human-gate" | "queue-completed";
  issue?: string;
  summary: string;
  blocker?: string;
};

const STATE_KEY = "pi-github-extensions-autopilot";
const MAX_STALLED_CONTINUATIONS = 8;

let state: AutopilotState | undefined;

/**
 * Initialize autopilot state from queue
 */
export function initializeState(queue: string[]): AutopilotState {
  state = {
    queue: [...queue],
    remaining: [...queue],
    phase: "active",
    stalledContinuations: 0,
    updatedAt: Date.now(),
  };
  return state;
}

/**
 * Get current autopilot state
 */
export function getState(): AutopilotState | undefined {
  return state;
}

/**
 * Set autopilot state
 */
export function setState(newState: AutopilotState | undefined): void {
  state = newState;
}

/**
 * Apply checkpoint to state
 */
export function applyCheckpoint(checkpoint: Checkpoint): AutopilotState | undefined {
  if (!state || state.phase !== "active") return state;

  const next: AutopilotState = {
    ...state,
    lastSummary: checkpoint.summary,
    updatedAt: Date.now(),
  };

  if (checkpoint.status === "progress") {
    next.stalledContinuations = 0;
    state = next;
    return state;
  }

  if (checkpoint.status === "human-gate") {
    next.phase = "blocked";
    next.blocker = checkpoint.blocker || checkpoint.summary;
    state = next;
    return state;
  }

  if (checkpoint.status === "queue-completed") {
    next.phase = "completed";
    next.remaining = [];
    next.stalledContinuations = 0;
    state = next;
    return state;
  }

  // issue-completed
  const completed = normalizeIssue(checkpoint.issue ?? next.remaining[0] ?? "");
  const index = next.remaining.indexOf(completed);
  if (index >= 0) {
    next.remaining = next.remaining.filter((_, i) => i !== index);
  }
  
  if (next.remaining.length === 0) {
    next.phase = "completed";
  }
  
  next.stalledContinuations = 0;
  state = next;
  return state;
}

/**
 * Increment stalled continuations
 */
export function incrementStalled(): boolean {
  if (!state || state.phase !== "active") return false;

  state = {
    ...state,
    stalledContinuations: state.stalledContinuations + 1,
    updatedAt: Date.now(),
  };

  if (state.stalledContinuations >= MAX_STALLED_CONTINUATIONS) {
    state = {
      ...state,
      phase: "blocked",
      blocker: `runtime guard stopped after ${MAX_STALLED_CONTINUATIONS} continuations without checkpoint`,
      updatedAt: Date.now(),
    };
    return true;
  }

  return false;
}

/**
 * Stop autopilot
 */
export function stopAutopilot(): void {
  if (state) {
    state = {
      ...state,
      phase: "stopped",
      updatedAt: Date.now(),
    };
  }
}

/**
 * Normalize issue number
 */
function normalizeIssue(value: string): string {
  return value.replace(/^#/, "");
}

/**
 * Parse work queue from command
 */
export function parseWorkQueue(input: string): string[] {
  const match = input.match(/^\/gh-work(?:\s+|$)([\s\S]*)$/i);
  if (!match) return [];
  
  const args = match[1] ?? "";
  const issues: string[] = [];
  const tokenPattern = /https?:\/\/[^\s]+\/issues\/(\d+)|#(\d+)|(?:^|\s)(\d+)(?=\s|$)/g;
  
  for (const token of args.matchAll(tokenPattern)) {
    const issue = token[1] ?? token[2] ?? token[3];
    if (issue && !issues.includes(issue)) {
      issues.push(issue);
    }
  }
  
  return issues;
}

/**
 * Get state type for persistence
 */
export function getStateType(): string {
  return STATE_KEY;
}
