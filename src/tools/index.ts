import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import { 
  completeAlignment, 
  startPlanning, 
  completePlanning, 
  startImplementation,
  completeIssue,
  getState 
} from "../workflow/state.js";
import { config } from "../config.js";

/**
 * Register workflow tools
 */
export function registerTools(pi: ExtensionAPI): void {
  // dev_checkpoint - Mark workflow phase completion
  pi.registerTool("dev_checkpoint", {
    description: "Mark workflow phase completion or progress",
    inputSchema: Type.Object({
      phase: StringEnum(["alignment", "planning", "issue-completed", "all-completed"], {
        description: "Which phase is completed",
      }),
      summary: Type.String({ description: "Summary of what was completed" }),
      issues: Type.Optional(Type.Array(Type.String(), { 
        description: "Created issue numbers (for planning phase)" 
      })),
      issue: Type.Optional(Type.String({ 
        description: "Completed issue number (for issue-completed)" 
      })),
    }),
    handler: async (input) => {
      const { phase, summary, issues, issue } = input;

      switch (phase) {
        case "alignment":
          completeAlignment();
          
          if (config.auto_plan_after_align) {
            startPlanning();
            return {
              content: [{ 
                type: "text", 
                text: `✓ Alignment complete: ${summary}\n\nAuto-starting planning phase...` 
              }],
              details: { phase: "alignment", auto_plan: true },
            };
          }
          
          return {
            content: [{ 
              type: "text", 
              text: `✓ Alignment complete: ${summary}\n\nReady for /plan` 
            }],
            details: { phase: "alignment" },
          };

        case "planning":
          if (!issues || issues.length === 0) {
            return {
              content: [{ type: "text", text: "Planning phase requires issue numbers" }],
              isError: true,
            };
          }

          completePlanning(issues);

          if (config.auto_implement_after_plan) {
            startImplementation();
            return {
              content: [{ 
                type: "text", 
                text: `✓ Planning complete: ${summary}\n\nCreated issues: ${issues.map((i) => `#${i}`).join(", ")}\n\nAuto-starting implementation...` 
              }],
              details: { phase: "planning", issues, auto_implement: true },
            };
          }

          return {
            content: [{ 
              type: "text", 
              text: `✓ Planning complete: ${summary}\n\nCreated issues: ${issues.map((i) => `#${i}`).join(", ")}\n\nReady to implement` 
            }],
            details: { phase: "planning", issues },
          };

        case "issue-completed":
          if (!issue) {
            return {
              content: [{ type: "text", text: "issue-completed requires issue number" }],
              isError: true,
            };
          }

          completeIssue(issue);
          const state = getState();

          if (state.phase === "completed") {
            return {
              content: [{ 
                type: "text", 
                text: `✓ Issue #${issue} completed: ${summary}\n\n🎉 All issues completed!` 
              }],
              details: { phase: "completed", issue },
            };
          }

          return {
            content: [{ 
              type: "text", 
              text: `✓ Issue #${issue} completed: ${summary}\n\nNext: #${state.currentIssue}` 
            }],
            details: { phase: "issue-completed", issue, next: state.currentIssue },
          };

        case "all-completed":
          return {
            content: [{ type: "text", text: `🎉 Workflow completed: ${summary}` }],
            details: { phase: "all-completed" },
          };
      }
    },
  });

  // github_create_issue
  pi.registerTool("github_create_issue", {
    description: "Create a GitHub issue",
    inputSchema: Type.Object({
      title: Type.String({ description: "Issue title" }),
      body: Type.String({ description: "Issue body in Markdown" }),
      labels: Type.Optional(Type.Array(Type.String(), { description: "Issue labels" })),
    }),
    handler: async (input) => {
      const { title, body, labels } = input;
      
      const args = ["issue", "create", "--title", title, "--body", body];
      if (labels && labels.length > 0) {
        args.push("--label", labels.join(","));
      }

      const result = await pi.exec("gh", args, { timeout: 30000 });
      
      if (result.code !== 0) {
        return {
          content: [{ type: "text", text: `Failed to create issue: ${result.stderr || result.stdout}` }],
          isError: true,
        };
      }

      const urlMatch = result.stdout.match(/https:\/\/github\.com\/[^\s]+\/issues\/(\d+)/);
      const number = urlMatch ? urlMatch[1] : undefined;

      return {
        content: [{ type: "text", text: `Created issue #${number}: ${title}` }],
        details: { number, title, labels },
      };
    },
  });

  // github_create_pr
  pi.registerTool("github_create_pr", {
    description: "Create a GitHub pull request",
    inputSchema: Type.Object({
      title: Type.String({ description: "PR title" }),
      body: Type.String({ description: "PR body" }),
      base: Type.Optional(Type.String({ description: "Base branch" })),
      draft: Type.Optional(Type.Boolean({ description: "Create as draft" })),
    }),
    handler: async (input) => {
      const { title, body, base, draft } = input;
      
      const args = ["pr", "create", "--title", title, "--body", body];
      if (base) args.push("--base", base);
      if (draft) args.push("--draft");

      const result = await pi.exec("gh", args, { timeout: 30000 });
      
      if (result.code !== 0) {
        return {
          content: [{ type: "text", text: `Failed to create PR: ${result.stderr || result.stdout}` }],
          isError: true,
        };
      }

      const urlMatch = result.stdout.match(/https:\/\/github\.com\/[^\s]+\/pull\/(\d+)/);
      const number = urlMatch ? urlMatch[1] : undefined;

      return {
        content: [{ type: "text", text: `Created PR #${number}: ${title}` }],
        details: { number, title, draft: draft || false },
      };
    },
  });

  // github_merge_pr
  pi.registerTool("github_merge_pr", {
    description: "Merge a GitHub pull request",
    inputSchema: Type.Object({
      number: Type.String({ description: "PR number" }),
      strategy: Type.Optional(StringEnum(["squash", "merge", "rebase"], {
        description: "Merge strategy",
      })),
    }),
    handler: async (input) => {
      const { number, strategy = config.merge_strategy } = input;
      
      const args = ["pr", "merge", number];
      
      if (strategy === "squash") args.push("--squash");
      else if (strategy === "merge") args.push("--merge");
      else if (strategy === "rebase") args.push("--rebase");
      
      if (config.delete_branch_after_merge) {
        args.push("--delete-branch");
      }

      const result = await pi.exec("gh", args, { timeout: 30000 });
      
      if (result.code !== 0) {
        return {
          content: [{ type: "text", text: `Failed to merge PR: ${result.stderr || result.stdout}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: `✓ Merged PR #${number}` }],
        details: { number, strategy },
      };
    },
  });
}
