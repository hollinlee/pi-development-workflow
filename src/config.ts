import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

export type VerificationMode = "auto" | "manual" | "skip";
export type MergeStrategy = "squash" | "merge" | "rebase";

export type GithubConfig = {
  verification_mode: VerificationMode;
  auto_merge: boolean;
  network_retry: boolean;
  branch_prefix_map: Record<string, string>;
  merge_strategy: MergeStrategy;
  delete_branch_after_merge: boolean;
  conventional_commits: boolean;
  commit_subject_lang: string;
  issue_pr_lang: string;
};

const DEFAULT_CONFIG: GithubConfig = {
  verification_mode: "auto",
  auto_merge: false,
  network_retry: true,
  branch_prefix_map: {
    feat: "feature",
    fix: "bugfix",
    refactor: "refactor",
    docs: "documentation",
    test: "test",
    chore: "chore",
  },
  merge_strategy: "squash",
  delete_branch_after_merge: true,
  conventional_commits: true,
  commit_subject_lang: "zh",
  issue_pr_lang: "zh",
};

const CONFIG_DIR = path.join(os.homedir(), ".pi", "agent", "extensions", "pi-github-extensions");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export const config: GithubConfig = { ...DEFAULT_CONFIG };

/**
 * Load config from disk
 */
export async function loadConfig(): Promise<void> {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf8");
    const persisted = JSON.parse(data) as Partial<GithubConfig>;
    
    Object.assign(config, persisted);
  } catch (error) {
    // Config file doesn't exist, use defaults
  }
}

/**
 * Save config to disk
 */
export async function saveConfig(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
  } catch (error) {
    console.warn("[pi-github-extensions] Failed to save config:", error);
  }
}

/**
 * Update config value
 */
export function setConfig(key: keyof GithubConfig, value: any): void {
  (config as any)[key] = value;
}

/**
 * Get config file path
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}
