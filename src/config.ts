import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

export type AlignmentMode = "auto" | "manual";
export type MergeStrategy = "squash" | "merge" | "rebase";

export type WorkflowConfig = {
  alignment_mode: AlignmentMode;
  auto_plan_after_align: boolean;
  auto_implement_after_plan: boolean;
  review_with_ai: boolean;
  ai_reviewer_model: string;
  merge_strategy: MergeStrategy;
  conventional_commits: boolean;
  delete_branch_after_merge: boolean;
  network_retry: boolean;
};

const DEFAULT_CONFIG: WorkflowConfig = {
  alignment_mode: "auto",
  auto_plan_after_align: true,
  auto_implement_after_plan: false,
  review_with_ai: true,
  ai_reviewer_model: "lingshuan.gpt-6.1-sol",
  merge_strategy: "squash",
  conventional_commits: true,
  delete_branch_after_merge: true,
  network_retry: true,
};

const CONFIG_DIR = path.join(os.homedir(), ".pi", "agent", "extensions", "pi-development-workflow");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export const config: WorkflowConfig = { ...DEFAULT_CONFIG };

export async function loadConfig(): Promise<void> {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf8");
    const persisted = JSON.parse(data) as Partial<WorkflowConfig>;
    Object.assign(config, persisted);
  } catch (error) {
    // Use defaults
  }
}

export async function saveConfig(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
  } catch (error) {
    console.warn("[pi-development-workflow] Failed to save config:", error);
  }
}

export function setConfig(key: keyof WorkflowConfig, value: any): void {
  (config as any)[key] = value;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
