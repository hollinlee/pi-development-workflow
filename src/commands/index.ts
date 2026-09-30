import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { config, saveConfig, getConfigPath } from "../config.js";
import { getState, resetState, stopWorkflow, startAlignment } from "../workflow/state.js";

export function registerCommands(pi: ExtensionAPI): void {
  // /dev - 统一入口
  pi.registerCommand("dev", {
    description: "Start development workflow from idea",
    handler: async (args, ctx) => {
      const idea = String(args || "").trim();
      
      if (!idea) {
        if (ctx.hasUI) {
          ctx.ui.notify("Usage: /dev <your idea>\n\nExample: /dev 我想做一个用户认证系统", "info");
        }
        return;
      }

      startAlignment(idea);
      
      if (ctx.hasUI) {
        ctx.ui.notify(`Starting alignment for: ${idea}\n\nEntering grilling mode...`, "info");
      }

      // Trigger alignment skill
      pi.sendMessage({
        content: `/grill ${idea}`,
        display: false,
      }, { triggerTurn: true });
    },
  });

  // /dev-status
  pi.registerCommand("dev-status", {
    description: "Show workflow status",
    handler: async (args, ctx) => {
      const state = getState();
      
      const lines = [
        "Development Workflow Status",
        `Phase: ${state.phase}`,
      ];

      if (state.idea) lines.push(`Idea: ${state.idea}`);
      if (state.alignmentComplete) lines.push("✓ Alignment complete");
      if (state.planReady) lines.push("✓ Plan ready");
      if (state.issues.length > 0) {
        lines.push(`Issues: ${state.issues.map((i) => `#${i}`).join(", ")}`);
      }
      if (state.currentIssue) lines.push(`Current: #${state.currentIssue}`);
      if (state.remainingIssues.length > 0) {
        lines.push(`Remaining: ${state.remainingIssues.map((i) => `#${i}`).join(", ")}`);
      }
      if (state.blocker) lines.push(`Blocked: ${state.blocker}`);

      if (ctx.hasUI) {
        ctx.ui.notify(lines.join("\n"), "info");
      }
    },
  });

  // /dev-config
  pi.registerCommand("dev-config", {
    description: "Configure workflow settings",
    handler: async (args, ctx) => {
      const input = String(args || "").trim();

      if (!input || input === "show") {
        showConfig(ctx);
        return;
      }

      const match = input.match(/^(\w+)=(.+)$/);
      if (!match) {
        if (ctx.hasUI) {
          ctx.ui.notify("Usage: /dev-config <key>=<value> or /dev-config show", "warning");
        }
        return;
      }

      const [, key, value] = match;
      await updateConfig(key, value, ctx);
    },
  });

  // /dev-stop
  pi.registerCommand("dev-stop", {
    description: "Stop workflow",
    handler: async (args, ctx) => {
      const state = getState();
      
      if (state.phase === "idle" || state.phase === "stopped") {
        if (ctx.hasUI) {
          ctx.ui.notify("No active workflow to stop", "info");
        }
        return;
      }

      stopWorkflow("User stopped");
      
      if (ctx.hasUI) {
        ctx.ui.notify("Workflow stopped", "info");
      }
    },
  });
}

function showConfig(ctx: ExtensionCommandContext): void {
  const lines = [
    "Development Workflow Configuration",
    "",
    `alignment_mode: ${config.alignment_mode}`,
    `auto_plan_after_align: ${config.auto_plan_after_align}`,
    `auto_implement_after_plan: ${config.auto_implement_after_plan}`,
    `review_with_ai: ${config.review_with_ai}`,
    `ai_reviewer_model: ${config.ai_reviewer_model}`,
    `merge_strategy: ${config.merge_strategy}`,
    `conventional_commits: ${config.conventional_commits}`,
    "",
    `Config: ${getConfigPath()}`,
  ];

  if (ctx.hasUI) {
    ctx.ui.notify(lines.join("\n"), "info");
  }
}

async function updateConfig(key: string, value: string, ctx: ExtensionCommandContext): Promise<void> {
  if (!(key in config)) {
    if (ctx.hasUI) {
      ctx.ui.notify(`Invalid key: ${key}`, "warning");
    }
    return;
  }

  let parsedValue: any = value;
  if (value === "true") parsedValue = true;
  else if (value === "false") parsedValue = false;

  (config as any)[key] = parsedValue;
  await saveConfig();

  if (ctx.hasUI) {
    ctx.ui.notify(`Set ${key} = ${parsedValue}`, "info");
  }
}
