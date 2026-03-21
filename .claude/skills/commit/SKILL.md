---
name: commit
description: Stage and commit changes in this monorepo with a conventional commit message. Use when the user wants to commit work.
argument-hint: [optional message or scope hint]
allowed-tools: Bash, Read, Glob, Grep
---

# Commit Changes

Create a well-structured git commit for this monorepo following conventional commits.

## Steps

1. Run `git status` to see what has changed (never use `-uall`)
2. Run `git diff` to understand the nature of the changes
3. Run `git log --oneline -10` to match the existing commit style
4. Identify which service(s) or package(s) are affected — use the monorepo scope in the commit type where relevant (e.g. `feat(auth-service)`, `fix(shared-middleware)`, `chore(infra)`)
5. Stage only the relevant files — prefer specific file paths over `git add .`
6. Write the commit message following the format below
7. Commit using a HEREDOC to preserve formatting
8. Run `git status` to confirm success

## Commit message format

```
<type>(<scope>): <short summary>

[optional body — explain WHY, not what. Wrap at 72 chars.]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `chore` — build, tooling, deps, config
- `refactor` — restructuring without behaviour change
- `test` — adding or updating tests
- `docs` — documentation only
- `ci` — CI/CD pipeline changes
- `infra` — Terraform / infrastructure changes

**Scopes** (use the affected app or package name):
`auth-service`, `user-service`, `product-service`, `order-service`, `notification-service`, `shared-types`, `shared-middleware`, `shared-logger`, `queue-client`, `infra`, `root`

## Rules

- NEVER use `git add -A` or `git add .` — stage specific files
- NEVER amend an existing commit — always create a new one
- NEVER skip hooks (`--no-verify`)
- NEVER commit `.env` files or files containing secrets
- If `$ARGUMENTS` is provided, use it as a hint for the commit message or scope
- If pre-commit hooks fail, fix the issue and create a fresh commit — do NOT amend
