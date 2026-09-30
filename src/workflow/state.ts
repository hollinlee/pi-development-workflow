export type WorkflowPhase = 
  | "idle"
  | "alignment"
  | "planning"  
  | "implementation"
  | "review"
  | "completed"
  | "stopped";

export type WorkflowState = {
  phase: WorkflowPhase;
  idea?: string;
  alignmentComplete: boolean;
  planReady: boolean;
  issues: string[];
  currentIssue?: string;
  remainingIssues: string[];
  lastUpdate: string;
  blocker?: string;
};

let state: WorkflowState = {
  phase: "idle",
  alignmentComplete: false,
  planReady: false,
  issues: [],
  remainingIssues: [],
  lastUpdate: "",
};

export function getState(): WorkflowState {
  return { ...state };
}

export function setState(newState: Partial<WorkflowState>): void {
  state = {
    ...state,
    ...newState,
    lastUpdate: new Date().toISOString(),
  };
}

export function resetState(): void {
  state = {
    phase: "idle",
    alignmentComplete: false,
    planReady: false,
    issues: [],
    remainingIssues: [],
    lastUpdate: new Date().toISOString(),
  };
}

export function startAlignment(idea: string): void {
  setState({
    phase: "alignment",
    idea,
    alignmentComplete: false,
    planReady: false,
  });
}

export function completeAlignment(): void {
  setState({
    alignmentComplete: true,
  });
}

export function startPlanning(): void {
  setState({
    phase: "planning",
  });
}

export function completePlanning(issues: string[]): void {
  setState({
    planReady: true,
    issues,
    remainingIssues: [...issues],
  });
}

export function startImplementation(): void {
  setState({
    phase: "implementation",
    currentIssue: state.remainingIssues[0],
  });
}

export function completeIssue(issue: string): void {
  const remaining = state.remainingIssues.filter((i) => i !== issue);
  
  if (remaining.length === 0) {
    setState({
      phase: "completed",
      currentIssue: undefined,
      remainingIssues: [],
    });
  } else {
    setState({
      currentIssue: remaining[0],
      remainingIssues: remaining,
    });
  }
}

export function stopWorkflow(blocker?: string): void {
  setState({
    phase: "stopped",
    blocker,
  });
}
