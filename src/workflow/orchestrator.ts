import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { getState, setState } from "./state.js";
import { config } from "../config.js";

/**
 * Setup workflow orchestrator
 * 
 * Coordinates between alignment, planning, implementation, review phases
 */
export function setupWorkflowOrchestrator(pi: ExtensionAPI): void {
  // Listen to tool results to track phase transitions
  pi.on("tool_result", async (event, ctx: ExtensionContext) => {
    const result = event as any;
    
    if (result.toolName !== "dev_checkpoint") return;
    
    const details = result.result?.details;
    if (!details) return;

    // Auto-trigger next phase based on config
    if (details.auto_plan) {
      await triggerPlanning(pi, ctx);
    } else if (details.auto_implement) {
      await triggerImplementation(pi, ctx);
    }
  });

  // Auto-continuation for implementation queue
  pi.on("assistant_message", async (event, ctx: ExtensionContext) => {
    const state = getState();
    
    if (state.phase !== "implementation") return;
    if (state.remainingIssues.length === 0) return;
    if (!state.currentIssue) return;

    // Wait for turn to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Send continuation message
    pi.sendMessage({
      customType: "dev-workflow-continuation",
      content: [
        `Development workflow queue is active.`,
        `Current issue: #${state.currentIssue}`,
        `Remaining: ${state.remainingIssues.map((i) => `#${i}`).join(", ")}`,
        "",
        "Continue implementation. Call dev_checkpoint when issue is complete.",
      ].join("\n"),
      display: true,
      details: { state },
    }, { triggerTurn: true, deliverAs: "followUp" });
  });
}

async function triggerPlanning(pi: ExtensionAPI, ctx: ExtensionContext): Promise<void> {
  if (ctx.hasUI) {
    ctx.ui.notify("Starting planning phase...", "info");
  }

  pi.sendMessage({
    content: [
      "Alignment complete. Now generate plan:",
      "1. Break down into vertical slices",
      "2. Create GitHub issue drafts",
      "3. Call dev_checkpoint phase=planning with issue numbers after creation",
    ].join("\n"),
    display: false,
  }, { triggerTurn: true });
}

async function triggerImplementation(pi: ExtensionAPI, ctx: ExtensionContext): Promise<void> {
  const state = getState();
  
  if (ctx.hasUI) {
    ctx.ui.notify(
      `Starting implementation: ${state.issues.map((i) => `#${i}`).join(", ")}`,
      "info"
    );
  }

  pi.sendMessage({
    content: [
      `Implementation queue started: ${state.issues.map((i) => `#${i}`).join(", ")}`,
      "",
      `Start with issue #${state.currentIssue}:`,
      "1. Implement the feature",
      "2. Run verification",
      "3. Commit changes",
      "4. Create PR",
      "5. Review (AI subagent if enabled)",
      "6. Merge",
      "7. Call dev_checkpoint phase=issue-completed",
    ].join("\n"),
    display: false,
  }, { triggerTurn: true });
}
