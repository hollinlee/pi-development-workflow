import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { config, saveConfig, getConfigPath } from "../config.js";
import { getState, stopAutopilot } from "../autopilot/state.js";

/**
 * Register commands
 */
export function registerCommands(pi: ExtensionAPI): void {
  // /gh-config
  pi.registerCommand("gh-config", {
    description: "Configure GitHub workflow settings",
    handler: async (args, ctx) => {
      const input = String(args || "").trim();

      if (!input || input === "show") {
        showConfig(ctx);
        return;
      }

      const match = input.match(/^(\w+)=(.+)$/);
      if (!match) {
        if (ctx.hasUI) {
          ctx.ui.notify("Usage: /gh-config <key>=<value> or /gh-config show", "warning");
        }
        return;
      }

      const [, key, value] = match;
      await updateConfig(key, value, ctx);
    },
  });

  // /gh-status
  pi.registerCommand("gh-status", {
    description: "Show autopilot status",
    handler: async (args, ctx) => {
      const state = getState();

      if (!state) {
        if (ctx.hasUI) {
          ctx.ui.notify("No active autopilot", "info");
        }
        return;
      }

      const lines = [
        "GitHub Autopilot Status",
        `Phase: ${state.phase}`,
        `Queue: ${state.queue.map((n) => `#${n}`).join(", ")}`,
        `Remaining: ${state.remaining.map((n) => `#${n}`).join(", ") || "none"}`,
      ];

      if (state.lastSummary) {
        lines.push(`Last: ${state.lastSummary}`);
      }

      if (state.blocker) {
        lines.push(`Blocked: ${state.blocker}`);
      }

      if (ctx.hasUI) {
        ctx.ui.notify(lines.join("\n"), state.phase === "blocked" ? "warning" : "info");
      }
    },
  });

  // /gh-stop
  pi.registerCommand("gh-stop", {
    description: "Stop active autopilot",
    handler: async (args, ctx) => {
      const state = getState();

      if (!state || state.phase !== "active") {
        if (ctx.hasUI) {
          ctx.ui.notify("No active autopilot to stop", "info");
        }
        return;
      }

      stopAutopilot();

      if (ctx.hasUI) {
        ctx.ui.notify("Autopilot stopped", "info");
      }
    },
  });
}

function showConfig(ctx: ExtensionCommandContext): void {
  const lines = [
    "GitHub Workflow Configuration",
    "",
    `verification_mode: ${config.verification_mode}`,
    `auto_merge: ${config.auto_merge}`,
    `network_retry: ${config.network_retry}`,
    `merge_strategy: ${config.merge_strategy}`,
    `delete_branch_after_merge: ${config.delete_branch_after_merge}`,
    `conventional_commits: ${config.conventional_commits}`,
    `commit_subject_lang: ${config.commit_subject_lang}`,
    `issue_pr_lang: ${config.issue_pr_lang}`,
    "",
    `Config file: ${getConfigPath()}`,
  ];

  if (ctx.hasUI) {
    ctx.ui.notify(lines.join("\n"), "info");
  }
}

async function updateConfig(key: string, value: string, ctx: ExtensionCommandContext): Promise<void> {
  const validKeys = [
    "verification_mode",
    "auto_merge",
    "network_retry",
    "merge_strategy",
    "delete_branch_after_merge",
    "conventional_commits",
    "commit_subject_lang",
    "issue_pr_lang",
  ];

  if (!validKeys.includes(key)) {
    if (ctx.hasUI) {
      ctx.ui.notify(`Invalid key: ${key}\n\nValid keys: ${validKeys.join(", ")}`, "warning");
    }
    return;
  }

  let parsedValue: any = value;

  // Parse boolean
  if (value === "true") parsedValue = true;
  else if (value === "false") parsedValue = false;

  (config as any)[key] = parsedValue;
  await saveConfig();

  if (ctx.hasUI) {
    ctx.ui.notify(`Set ${key} = ${parsedValue}`, "info");
  }
}
