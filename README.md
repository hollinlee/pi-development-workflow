# pi-development-workflow

Complete development workflow automation for Pi coding agent.

**从想法到生产的完整流程**: align → plan → issue → implement → pr → review → merge

## Philosophy

你有一个粗浅的想法 → 通过不断对齐完善架构 → 确定后自动完成实现

## Features

### 🎯 Alignment (对齐)
- Grilling mode: 高价值问题追问
- Wayfinding mode: 探索式导航
- Domain modeling: 术语、边界、不变量
- Private context: `.pi/alignment/` 工作区
- Readiness check: 确保需求明确

### 📋 Planning (计划)
- 集成 `pi-goal-x` 进行目标管理
- Vertical slices 分解
- GitHub issue 生成
- 验收标准定义

### ✅ To-do Management
- 集成 `@juicesharp/rpiv-todo`
- 实时任务追踪
- 队列状态可视化

### 🔄 Implementation (实现)
- 自动化队列执行
- Subagent 验证 (via `pi-subagents`)
- Runtime guard 续行

### 👀 Review (审查)
- AI subagent review (`lingshuan.gpt-6.1-sol`)
- 代码审查、问题分析、根因诊断
- 结构化反馈

### 🚀 GitHub Workflow
- Issue → PR 自动化
- Review 处理
- Merge 管理
- 网络恢复

## Install

```bash
pi install git:github.com/hollinlee/pi-development-workflow
```

## Quick Start

### 1. 从想法开始

```bash
/dev "我想做一个用户认证系统"
```

Agent 进入 **alignment 模式**，和你对齐：
- 目标和范围
- 技术选型  
- 约束条件
- 验收标准

### 2. 确认 alignment

完成对齐后，Agent 会输出 **Alignment Brief** 并询问确认。

### 3. 自动执行

确认后自动：
1. 生成 plan
2. 创建 GitHub issues
3. 实现队列执行
4. 每个 issue: implement → verify → PR → AI review → merge
5. 完成后继续下一个

## Commands

| Command | Description |
|---------|-------------|
| `/dev <idea>` | 统一入口：从想法开始工作流 |
| `/grill` | 纯对齐模式（不自动进入实现） |
| `/plan` | 从当前 alignment 生成 plan |
| `/dev-status` | 查看工作流状态 |
| `/dev-config` | 配置工作流设置 |
| `/dev-stop` | 停止自动执行 |

## Workflow Phases

### Phase 1: Alignment 🎯
```
粗浅想法
  ↓
高价值问题追问
  ↓
域模型建立
  ↓
Alignment Brief
  ↓
用户确认 ✓
```

### Phase 2: Planning 📋
```
自动生成 plan
  ↓
分解 vertical slices
  ↓
生成 GitHub issue drafts
  ↓
用户确认 ✓
  ↓
创建 issues
```

### Phase 3: Implementation 🔄
```
For each issue:
  实现 → Subagent 验证 → Commit
  ↓
  Create PR
  ↓
  AI Review (lingshuan.gpt-6.1-sol)
  ↓
  修复（如需要）
  ↓
  Merge
  ↓
  下一个 issue
```

## Integration

### With pi-goal-x
长期目标管理和完成审计自动集成

### With rpiv-todo
实时 to-do overlay 自动显示当前任务

### With pi-subagents
- 验证任务委派
- AI code review (lingshuan.gpt-6.1-sol)

## Configuration

```json
{
  "alignment_mode": "auto",
  "auto_plan_after_align": true,
  "auto_implement_after_plan": false,
  "review_with_ai": true,
  "ai_reviewer_model": "lingshuan.gpt-6.1-sol",
  "merge_strategy": "squash",
  "conventional_commits": true
}
```

## Privacy Boundaries

`.pi/alignment/` 是私有工作区：
- Issues, commits, PRs 不得引用 `.pi/alignment` 路径
- Agent 可读取 alignment 但必须改写为公开内容
- 用户明确要求时才提升到公开文档

## Requirements

- Pi coding agent >= 0.85.0
- `gh` CLI installed and authenticated
- Git repository with GitHub remote

## Credits

Architecture integrates:
- oh-my-pi alignment/github-workflow - Original implementation
- pi-pr-review - Tiered subagent review concept
- pi-goal-x - Goal management
- rpiv-todo - To-do tracking
- pi-subagents - Subagent orchestration

## License

MIT
