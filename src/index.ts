import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerTools } from "./tools/index.js";
import { registerCommands } from "./commands/index.js";
import { setupAutopilot } from "./autopilot/index.js";
import { loadConfig } from "./config.js";

/**
 * Pi GitHub Extensions
 * 
 * Comprehensive GitHub workflow automation for Pi coding agent.
 * Issue generation, implementation, PR management, review handling, and merge automation.
 * 
 * Architecture:
 * - Tools: Structured GitHub operations
 * - Subagents: Parallel verification (via pi-subagents)
 * - Config: Persistent workflow settings
 * - Skills: Contextual guidance
 * - Runtime Guard: Automatic queue continuation
 * 
 * Inspired by:
 * - pi-pr-review (tiered subagent architecture)
 * - oh-my-pi github-workflow (autopilot implementation)
 */
export default function githubExtensions(pi: ExtensionAPI): void {
  // Load persisted configuration
  loadConfig().catch(console.warn);

  // Register GitHub tools
  registerTools(pi);

  // Register commands
  registerCommands(pi);

  // Setup autopilot runtime guard
  setupAutopilot(pi);
}

// Re-export types
export type { GithubConfig } from "./config.js";
export type { AutopilotState } from "./autopilot/state.js";
