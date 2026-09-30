import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";

/**
 * Register GitHub tools
 */
export function registerTools(pi: ExtensionAPI): void {
  // github_create_issue
  pi.registerTool("github_create_issue", {
    description: "Create a GitHub issue with title, body, and optional labels",
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

      const urlMatch = result.stdout.match(/https:\/\/github\.com\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : "";

      return {
        content: [{ type: "text", text: `Created issue: ${url}` }],
        details: { url, title, labels },
      };
    },
  });

  // github_create_pr
  pi.registerTool("github_create_pr", {
    description: "Create a GitHub pull request from current branch",
    inputSchema: Type.Object({
      title: Type.String({ description: "PR title" }),
      body: Type.String({ description: "PR body in Markdown" }),
      base: Type.Optional(Type.String({ description: "Base branch, defaults to main" })),
      draft: Type.Optional(Type.Boolean({ description: "Create as draft PR" })),
      reviewers: Type.Optional(Type.Array(Type.String(), { description: "Reviewer usernames" })),
    }),
    handler: async (input) => {
      const { title, body, base, draft, reviewers } = input;
      
      const args = ["pr", "create", "--title", title, "--body", body];
      if (base) args.push("--base", base);
      if (draft) args.push("--draft");
      if (reviewers && reviewers.length > 0) {
        args.push("--reviewer", reviewers.join(","));
      }

      const result = await pi.exec("gh", args, { timeout: 30000 });
      
      if (result.code !== 0) {
        return {
          content: [{ type: "text", text: `Failed to create PR: ${result.stderr || result.stdout}` }],
          isError: true,
        };
      }

      const urlMatch = result.stdout.match(/https:\/\/github\.com\/[^\s]+/);
      const url = urlMatch ? urlMatch[0] : "";
      const numberMatch = url.match(/\/pull\/(\d+)/);
      const number = numberMatch ? numberMatch[1] : undefined;

      return {
        content: [{ type: "text", text: `Created PR: ${url}` }],
        details: { url, number, title, draft: draft || false },
      };
    },
  });

  // github_merge_pr
  pi.registerTool("github_merge_pr", {
    description: "Merge a GitHub pull request",
    inputSchema: Type.Object({
      number: Type.String({ description: "PR number" }),
      strategy: Type.Optional(StringEnum(["squash", "merge", "rebase"], {
        description: "Merge strategy, defaults to squash",
      })),
      delete_branch: Type.Optional(Type.Boolean({ description: "Delete branch after merge" })),
    }),
    handler: async (input) => {
      const { number, strategy = "squash", delete_branch = true } = input;
      
      const args = ["pr", "merge", number];
      
      if (strategy === "squash") args.push("--squash");
      else if (strategy === "merge") args.push("--merge");
      else if (strategy === "rebase") args.push("--rebase");
      
      if (delete_branch) args.push("--delete-branch");

      const result = await pi.exec("gh", args, { timeout: 30000 });
      
      if (result.code !== 0) {
        return {
          content: [{ type: "text", text: `Failed to merge PR: ${result.stderr || result.stdout}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: `Merged PR #${number} with ${strategy} strategy` }],
        details: { number, strategy, deleted_branch: delete_branch },
      };
    },
  });

  // github_checkpoint (internal tool for autopilot)
  pi.registerTool("github_checkpoint", {
    description: "Record autopilot progress checkpoint (internal use)",
    inputSchema: Type.Object({
      status: StringEnum(["progress", "issue-completed", "human-gate", "queue-completed"], {
        description: "Checkpoint status",
      }),
      issue: Type.Optional(Type.String({ description: "Issue number if issue-completed" })),
      summary: Type.String({ description: "Progress summary" }),
      blocker: Type.Optional(Type.String({ description: "Blocking reason if human-gate" })),
    }),
    handler: async (input) => {
      // This will be handled by autopilot runtime guard
      return {
        content: [{ type: "text", text: `Checkpoint: ${input.status} - ${input.summary}` }],
        details: input,
      };
    },
  });
}
