import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import {
  getState,
  setState,
  applyCheckpoint,
  incrementStalled,
  parseWorkQueue,
  initializeState,
  getStateType,
  type Checkpoint,
} from "./state.js";

const CHECKPOINT_TOOL = "github_checkpoint";

/**
 * Setup autopilot runtime guard
 */
export function setupAutopilot(pi: ExtensionAPI): void {
  // Intercept github_checkpoint tool results
  pi.on("tool_result", async (event) => {
    const result = event as any;
    
    if (result.toolName !== CHECKPOINT_TOOL) return;
    
    const details = result.result?.details;
    if (!details) return;

    const checkpoint: Checkpoint = {
      status: details.status,
      issue: details.issue,
      summary: details.summary,
      blocker: details.blocker,
    };

    applyCheckpoint(checkpoint);
  });

  // Auto-continuation after agent settle
  pi.on("assistant_message", async (event, ctx: ExtensionContext) => {
    const state = getState();
    
    if (!state || state.phase !== "active") return;
    if (state.remaining.length === 0) return;

    // Wait for turn to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if stalled
    const stalled = incrementStalled();
    if (stalled) {
      if (ctx.hasUI) {
        ctx.ui.notify(state.blocker || "Autopilot stalled", "warning");
      }
      return;
    }

    // Send continuation message
    pi.sendMessage(
      {
        customType: "github-autopilot-continuation",
        content: [
          "The /gh-work queue is still active.",
          `Remaining issues: ${state.remaining.map((n) => `#${n}`).join(", ")}.`,
          "Continue repository work now in the same queue order. Do not stop at an intermediate artifact.",
          "Call github_checkpoint after meaningful progress, on a real human gate, after each merged issue, or when the queue is complete.",
        ].join("\n"),
        display: true,
        details: { state },
      },
      { triggerTurn: true, deliverAs: "followUp" }
    );
  });

  // Session shutdown cleanup
  pi.on("session_shutdown", () => {
    setState(undefined);
  });
}

/**
 * Start autopilot with queue
 */
export function startAutopilot(queue: string[]): void {
  initializeState(queue);
}
