import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadConfig } from "./config.js";
import { registerCommands } from "./commands/index.js";
import { registerTools } from "./tools/index.js";
import { setupWorkflowOrchestrator } from "./workflow/orchestrator.js";

/**
 * Pi Development Workflow
 * 
 * Complete development workflow automation for Pi coding agent.
 * From alignment to merge: align → plan → issue → implement → pr → review → merge
 * 
 * Architecture:
 * - Alignment: Goal alignment and domain modeling (from oh-my-pi)
 * - Planning: Plan generation and issue creation
 * - Implementation: Automated queue execution with subagent verification
 * - Review: AI code review via pi-subagents (lingshuan.gpt-6.1-sol)
 * - GitHub: PR management and merge automation
 * 
 * Integration:
 * - pi-goal-x: Goal management
 * - @juicesharp/rpiv-todo: To-do tracking
 * - pi-subagents: Subagent orchestration and AI review
 * 
 * Credits:
 * - oh-my-pi alignment/github-workflow - Original implementation
 * - pi-pr-review - Tiered subagent review concept
 */
export default function developmentWorkflow(pi: ExtensionAPI): void {
  // Load persisted configuration
  loadConfig().catch(console.warn);

  // Register tools
  registerTools(pi);

  // Register commands
  registerCommands(pi);

  // Setup workflow orchestrator
  setupWorkflowOrchestrator(pi);
}

// Re-export types
export type { WorkflowConfig } from "./config.js";
export type { WorkflowState, WorkflowPhase } from "./workflow/state.js";
