#!/usr/bin/env bash
#
# Stop hook: remind Claude to update documentation after meaningful architectural changes.
#
# "Meaningful" = changes that affect the project's structure, dependencies, or contracts.
# Simple bug fixes, test changes, or minor edits within existing service logic are ignored.
#

set -euo pipefail

cd "$CLAUDE_PROJECT_DIR"

# Collect all changed files (staged + unstaged + untracked)
CHANGED_FILES=$(
  {
    git diff --name-only HEAD 2>/dev/null || true
    git diff --cached --name-only 2>/dev/null || true
    git ls-files --others --exclude-standard 2>/dev/null || true
  } | sort -u
)

# Nothing changed — nothing to check
if [ -z "$CHANGED_FILES" ]; then
  exit 0
fi

# --- Patterns that indicate meaningful architectural changes ---
ARCH_PATTERNS=(
  # New or modified NestJS modules (new feature modules = architecture)
  '\.module\.ts$'
  # Shared packages source changes (affect all services)
  '^packages/.*/src/'
  # Docker and container config
  'Dockerfile'
  'docker-compose'
  '\.dockerignore'
  # Infrastructure
  '^infrastructure/'
  # CI/CD pipelines
  '^\.github/'
  # Monorepo config
  'turbo\.json'
  'pnpm-workspace\.yaml'
  # Prisma schema changes (DB structure)
  'schema\.prisma'
  # Service bootstrap / main entry
  'main\.ts$'
  # Environment config schema (new env vars = deployment impact)
  'src/config/index\.ts'
)

# --- Patterns to EXCLUDE (not meaningful even if they match) ---
EXCLUDE_PATTERNS=(
  '\.spec\.ts$'
  '\.test\.ts$'
  '__tests__/'
  '\.md$'
)

# Check if any changed file matches an architectural pattern
ARCH_CHANGE_FOUND=false
ARCH_FILES=()

for file in $CHANGED_FILES; do
  # Skip excluded patterns
  excluded=false
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$pattern"; then
      excluded=true
      break
    fi
  done
  [ "$excluded" = true ] && continue

  # Check architectural patterns
  for pattern in "${ARCH_PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$pattern"; then
      ARCH_CHANGE_FOUND=true
      ARCH_FILES+=("$file")
      break
    fi
  done
done

if [ "$ARCH_CHANGE_FOUND" = false ]; then
  exit 0
fi

# Check if any documentation file was also updated
DOC_FILES=(
  "ARCHITECTURE.md"
  "README.md"
  "CLAUDE.md"
)

DOC_UPDATED=false
for doc in "${DOC_FILES[@]}"; do
  if echo "$CHANGED_FILES" | grep -q "^${doc}$"; then
    DOC_UPDATED=true
    break
  fi
done

if [ "$DOC_UPDATED" = true ]; then
  exit 0
fi

# Architectural changes detected but no docs updated — send feedback
SAMPLE_FILES=$(printf '  - %s\n' "${ARCH_FILES[@]:0:10}")
if [ ${#ARCH_FILES[@]} -gt 10 ]; then
  SAMPLE_FILES+=$'\n  ... and '"$((${#ARCH_FILES[@]} - 10))"' more files'
fi

cat >&2 <<MSG
Meaningful architectural changes were detected but no documentation was updated.

Changed files that look architectural:
${SAMPLE_FILES}

Please review whether ARCHITECTURE.md, README.md, or CLAUDE.md need updates to reflect these changes. Only update docs if the changes affect documented architecture, APIs, setup instructions, or conventions. Skip if the changes are internal implementation details.
MSG

exit 2
