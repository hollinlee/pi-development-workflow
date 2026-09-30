# pi-github-extensions

Comprehensive GitHub workflow automation for Pi coding agent - Issue generation, implementation, PR management, review handling, and merge automation.

## Features

- **Issue Management**: Generate and track GitHub issues from plans
- **End-to-end Autopilot**: Automatic implementation, verification, commit, PR, review, and merge
- **Queue Execution**: Process multiple issues in order with runtime guard
- **Recovery Entry Points**: Resume from any workflow stage
- **Network Resilience**: Automatic proxy detection and retry
- **Structured Configuration**: File-based settings with runtime overrides
- **Subagent Integration**: Leverage pi-subagents for parallel verification
- **Review Compatibility**: Works alongside pi-pr-review

## Architecture

**Mixed approach** inspired by pi-pr-review:
- **Tools**: Structured GitHub operations (issue, PR, review, merge)
- **Subagents**: Parallel verification and validation tasks
- **Config**: Persistent workflow settings
- **Skills**: Contextual guidance and templates
- **Runtime Guard**: Automatic queue continuation

## Install

```bash
pi install git:github.com/hollinlee/pi-github-extensions
```

Or add to your project:

```bash
npm install git+https://github.com/hollinlee/pi-github-extensions.git
```

## Quick Start

### 1. Configure workflow

```bash
/gh-config verification_mode=auto
/gh-config auto_merge=false
/gh-config network_retry=true
```

### 2. Generate issues from plan

```bash
/gh-issues from-plan
# Or specify scope
/gh-issues "auth system" "user profile"
```

### 3. Execute queue

```bash
/gh-work #123 #124 #125
```

The autopilot will:
1. Implement each issue
2. Run verification
3. Commit changes
4. Create PR
5. Handle review feedback
6. Merge when ready
7. Move to next issue

### 4. Recovery from any stage

```bash
/gh-ship      # Ship existing implementation
/gh-pr        # Create PR from current branch
/gh-review    # Handle review feedback
/gh-merge     # Merge ready PR
```

## Commands

| Command | Description |
|---------|-------------|
| `/gh-config <key>=<value>` | Configure workflow settings |
| `/gh-config show` | Display current configuration |
| `/gh-issues from-plan` | Generate issues from current plan |
| `/gh-issues <scope...>` | Generate issues for specific scope |
| `/gh-work <issue...>` | Execute issue queue (autopilot) |
| `/gh-ship` | Ship existing implementation |
| `/gh-pr` | Create PR from current branch |
| `/gh-review` | Handle PR review feedback |
| `/gh-merge` | Merge ready PR |
| `/gh-status` | Show autopilot status |
| `/gh-stop` | Stop autopilot |

## Tools

### github_create_issue
Create GitHub issue with title, body, and labels.

### github_create_pr
Create pull request with title, body, and optional reviewers.

### github_update_pr
Update PR description or metadata.

### github_review_reply
Reply to PR review comments.

### github_merge_pr
Merge PR with specified strategy (squash/merge/rebase).

### github_checkpoint
Record autopilot progress (internal, called by autopilot).

## Configuration

Settings are stored in `~/.pi/agent/extensions/pi-github-extensions/config.json`:

```json
{
  "verification_mode": "auto",
  "auto_merge": false,
  "network_retry": true,
  "branch_prefix_map": {
    "feat": "feature",
    "fix": "bugfix",
    "refactor": "refactor",
    "docs": "documentation"
  },
  "merge_strategy": "squash",
  "delete_branch_after_merge": true,
  "conventional_commits": true,
  "commit_subject_lang": "zh",
  "issue_pr_lang": "zh"
}
```

### Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `verification_mode` | `auto` | `auto`, `manual`, or `skip` |
| `auto_merge` | `false` | Auto-merge when ready |
| `network_retry` | `true` | Auto-retry on network failure |
| `merge_strategy` | `squash` | `squash`, `merge`, or `rebase` |
| `delete_branch_after_merge` | `true` | Delete branch after merge |
| `conventional_commits` | `true` | Use conventional commit format |
| `commit_subject_lang` | `zh` | Commit subject language |
| `issue_pr_lang` | `zh` | Issue/PR description language |

## Workflow

### Full Autopilot

```
/gh-issues from-plan
  ↓ (user confirms)
/gh-work #123 #124 #125
  ↓
For each issue:
  1. Implementation → 2. Verification → 3. Commit → 4. PR
  5. Review handling → 6. Merge → 7. Sync main → 8. Next issue
```

### Recovery Scenarios

**Existing implementation, no issue**:
```bash
/gh-ship
# Generates issue draft → confirm → create PR → review → merge
```

**Branch exists, need PR**:
```bash
/gh-pr
# Commit → push → create PR → review → merge
```

**PR has review feedback**:
```bash
/gh-review
# Analyze feedback → implement fixes → verify → update PR → continue
```

**PR ready to merge**:
```bash
/gh-merge
# Check conditions → merge → delete branch → sync main
```

## Runtime Guard

The autopilot uses a runtime guard to ensure queue completion:

- Tracks progress via `github_checkpoint` tool
- Auto-continues after agent settle
- Stops on human decision gates
- Prevents stalled continuations (max 8)

Human gates:
- Scope expansion beyond issue
- Breaking changes
- Security concerns
- Ambiguous requirements

## Network Resilience

Automatic recovery on GitHub API/git failures:

1. Check proxy status
2. Auto-enable configured proxy if available
3. Retry operation once
4. Report failure and recovery entry point if still failing

No repeated user confirmation for proxy enablement.

## Privacy Boundaries

`.pi/alignment/` files are private context.

**Hard rules**:
- Issues, commits, PRs, and reviews MUST NOT reference `.pi/alignment` paths
- Can read alignment for context but must rewrite as public content
- GitHub content uses configured language (default: Chinese)
- Commands, paths, branch prefixes, API names remain English

## Integration

### With pi-pr-review

pi-github-extensions and pi-pr-review work independently:

- **pi-github-extensions**: Issue → PR creation and basic review handling
- **pi-pr-review**: Deep parallel PR review

You can use both:
1. `/gh-work #123` creates and implements PR
2. `/pr-review <pr-number>` for deep review (optional)
3. `/gh-review` handles feedback and continues merge

### With pi-subagents

Verification tasks delegate to subagents:
- Parallel test execution
- Lint/format checks
- Build verification
- Security scans

## Requirements

- Pi coding agent >= 0.85.0
- `gh` CLI installed and authenticated
- Git repository with GitHub remote
- `pi-subagents` package (auto-installed as peer dependency)

## Development

```bash
git clone git@github.com:hollinlee/pi-github-extensions.git
cd pi-github-extensions
npm install
npm run build
npm test
```

### Local Testing

```bash
pi -e /path/to/pi-github-extensions/src/index.ts
```

## License

MIT

## Credits

Architecture inspired by:
- [pi-pr-review](https://github.com/MasuRii/pi-pr-review) - Tiered subagent review architecture
- oh-my-pi github-workflow - Original autopilot implementation
