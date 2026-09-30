---
name: alignment
description: 对齐用户意图并在必要时进入计划。用于 /grill 和 /dev：先澄清目标、上下文、术语、约束、非目标和验收标准；coding/repo 任务可读取 repo 并维护私有 .pi/alignment context/ADR；未 ready 时不要直接计划或实现。通过 @juicesharp/rpiv-ask-user-question 渐进式提问，一次一个小点。
---

# Alignment

## 目标

帮助用户把模糊想法、coding 任务、repo 设计或个人决策想清楚。默认先对齐，不急着计划，更不急着实现。

核心原则：

```txt
/grill = 想清楚
/dev   = 从想法到实现的完整流程
/plan  = 想清楚以后怎么做；coding/repo 任务同时生成 GitHub issue drafts
```

## 渐进式提问原则

**硬规则**：
- 一次只问一个小点，不要抛出大段文字
- 使用 `@juicesharp/rpiv-ask-user-question` 提供选项
- 先问核心问题，再问细节
- 用户回答后再问下一个问题
- 避免一次性输出完整 alignment brief

**提问顺序**：
1. 核心目标（一句话）
2. 为什么做这个（Why it matters）
3. 当前状态/背景
4. 关键约束（一次一个）
5. 非目标（明确不做什么）
6. 验收标准（逐个确认）

**示例**：
```
❌ 错误：抛出完整问卷
"请回答以下问题：1. 目标是什么？2. 为什么做？3. 约束条件？4. 非目标？5. 验收标准？"

✅ 正确：渐进式对话
Agent: 用一句话描述核心目标？
User: 做一个用户认证系统
Agent: 为什么现在需要这个功能？
User: 当前没有用户管理
Agent: 有哪些技术约束？（选择或自定义）
  - 必须用现有数据库
  - 需要支持 OAuth
  - 性能要求高
  - 其他...
```

## 私有文档策略

本 skill 可以维护私有工作记忆，但只能写入：

```txt
.pi/alignment/
```

允许创建：

```txt
.pi/alignment/context.md
.pi/alignment/glossary.md
.pi/alignment/open-questions.md
.pi/alignment/latest-brief.md
.pi/alignment/sessions/<date>-<slug>.md
.pi/alignment/adr/<number>-<slug>.md
.pi/alignment/wayfinding/<slug>.md
```

硬规则：

- 不创建或更新 root `CONTEXT.md`、`PLAN.md`、`TODO.md` 或其他 repo 公开文档
- `.pi/alignment/` 是私有工作区，GitHub issues/commits/PRs 不得引用这些路径
- 用户明确要求时才提升为公开文档

## 工作流集成

### /dev 流程

```txt
/dev "想法"
  ↓
渐进式对齐（一次一个问题）
  ↓
确认 alignment 完成
  ↓
调用 dev_checkpoint phase=alignment
  ↓
自动触发 planning（如果 auto_plan_after_align=true）
```

### /grill 流程

```txt
/grill "问题或想法"
  ↓
纯对齐模式（不自动进入实现）
  ↓
输出 Alignment Brief
  ↓
等待用户决定下一步
```

### Alignment 完成标志

调用 tool:
```typescript
dev_checkpoint({
  phase: "alignment",
  summary: "目标、约束、验收标准已明确"
})
```

## 输出格式

**渐进式对话中**：不输出完整 brief，只记录到 `.pi/alignment/`

**确认时**：简短摘要 + 关键决策点

```txt
✓ Alignment Complete

Goal: [一句话目标]
Key constraints: [1-3 个关键约束]
Acceptance criteria: [核心验收标准]

Ready for planning?
```

**详细 brief** 保留在 `.pi/alignment/latest-brief.md`，对话只给最小摘要。

## 按需参考

- 追问方式见 `references/questioning.md`
- repo 上下文发现见 `references/context-discovery.md`
- 私有 domain modeling 见 `references/domain-modeling.md`
- ready 判断见 `references/readiness-checklist.md`
- wayfinding mode 见 `references/wayfinding.md`
- plan 生成见 `references/planning.md`
