---
name: pr
description: Create a GitHub pull request with a conventional title, change summary, and test plan. Use when the user wants to open a PR.
argument-hint: [optional base branch, defaults to main]
allowed-tools: Bash, Read, Glob, Grep
---

# Create Pull Request

Create a well-structured pull request for the current branch.

## Steps

1. Determine the base branch — use `$ARGUMENTS` if provided, otherwise `main`
2. Run `git status` to confirm working tree is clean (warn if not)
3. Run `git log --oneline <base>...HEAD` to see all commits in this branch
4. Run `git diff <base>...HEAD --name-only` to see which files changed
5. Identify which service(s) or package(s) are affected from the changed paths
6. Check if the branch has a remote tracking branch — if not, push with `git push -u origin <branch>`
7. Draft the PR using the format below
8. Run `gh pr create` with a HEREDOC body — return the PR URL when done

## PR format

```
Title: <type>(<scope>): <short summary under 70 chars>

## What changed
- <bullet per logical change — focus on why, not just what>

## Services / packages affected
- <list affected apps and packages>

## Type of change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Infrastructure / tooling
- [ ] Documentation

## Test plan
- [ ] <specific thing to verify locally>
- [ ] <relevant docker-compose services to have running>
- [ ] <any migration or env var changes needed>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Rules

- Title must follow conventional commit format with monorepo scope
- NEVER force push or push to main/master directly
- If there are no commits ahead of base, stop and tell the user
- If `$ARGUMENTS` contains an issue number (e.g. `#42`), reference it in the PR body
