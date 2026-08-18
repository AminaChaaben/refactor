---
name: 'step-01-preflight-and-init'
description: 'Resolve target project, verify it is indexed, load all detector knowledge fragments'
nextStepFile: '{skill-root}/steps/step-02-run-detectors.md'
---

# Step 1: Preflight & Init

## SEQUENCE

### 1. Resolve Target Project

- Resolve via `list_projects`/`index_status`. Halt if not indexed — tell the owner to run `index_repository` first.

### 1b. Detect Workflow Category Prerequisites (HUMAN DECISION)

Before proceeding, check which workflows are actually possible given the environment:

**Check Full Refactor (Code-Based) Prerequisites:**
- [ ] Codebase indexed in codebase-memory-mcp? (required)
  - If YES: ✅ Full Refactor is **available**
  - If NO: ❌ Full Refactor is **blocked** (must index first)

**Check Log-Based (Execution-Based) Prerequisites:**
- [ ] Test suite exists and can run? (e.g., mvn test, pytest, etc.)
  - If unsure: try one test run to confirm
- [ ] Can capture logs in a standard format (JUnit/Surefire XML, Playwright JSON, Jenkins console)?
  - If YES to both: ✅ Log-Based is **available**
  - If NO: ❌ Log-Based is **blocked** (test suite not runnable or logs not capturable)

**Present Options to Human:**

Format this as a practical choice, not a technical one. Reference `./resources/CATEGORY_PICKER.md` for detailed scenarios and real-world examples, then show:

```
What are you trying to figure out?

1️⃣  FULL REFACTOR (5-15 minutes)
    "What structural problems does our codebase have? Where should we refactor?"
    → Outputs: Ranked list of 5-10 improvements (hotspots, duplication, config gaps, logging gaps)
    → Best for: Planning refactor work, architectural audit
    → Status: AVAILABLE / BLOCKED [reason]

2️⃣  LOG-BASED (1-2 hours)
    "Why are our tests flaky? Which failures are real problems vs. false signals?"
    → Outputs: Test reliability report, flaky test classification, failure patterns
    → Best for: Fixing flaky tests, understanding test failures
    → Status: AVAILABLE / BLOCKED [reason]

3️⃣  COMBINED (1-2 hours)
    "What are our top priorities, backed by proof that these issues cause real failures?"
    → Outputs: All of #1 + #2; refactoring priorities ranked by execution evidence
    → Best for: High-confidence decisions, justifying refactor budgets
    → Status: AVAILABLE / BLOCKED [reason]

---

Which question are you trying to answer?
  1 = Structure & refactoring priorities
  2 = Test reliability & flakiness
  3 = Everything (highest confidence)
(Enter 1, 2, or 3)
```

**Halt here.** Do not proceed until the human has made an explicit choice from the available options.

If the human's chosen category is BLOCKED, explain why and ask them to either:
- Choose a different category, or
- Fix the blocker (e.g., "install test runner", "configure logging", "run `index_repository`")

### 2. Scope Decision: Full Scan vs. Incremental (Only if Chosen Category Includes Full Refactor)

**Only ask this if the human chose Full Refactor or Combined (not for Log-Based alone).**

Check `{rrd_artifacts}/` for a prior `refactor-radar-audit-{target_project}-*.html` report and, if the target has git history, whether `{target_project_root}` is a git repo with a resolvable prior commit to compare against. If both exist:

Ask the owner: full re-scan of the whole project, or incremental (scope to files changed since the prior run's commit, via `detect_changes(project, since=<prior run's commit sha>)`)? Default suggestion is incremental when a prior run is recent (same guidance an owner would want for "did anything change") — but this is a suggestion, not a silent default; state the tradeoff (incremental is faster but only covers changed files' new/removed issues, not a fresh sweep of untouched code) and let the owner decide.

If incremental is chosen: record the `detect_changes` result's changed-file list now — every detector in Step 2 (`step-02-run-detectors.md`) scopes its `search_code`/`search_graph` calls to this file list via `path_filter`/`file_pattern` instead of scanning the whole project. State plainly in the final report which mode ran and, for incremental, which files were in scope — an incremental report is a different, narrower claim than a full one, and readers need to know which they're looking at.

If no prior run exists, or the owner declines incremental: proceed with a full scan as before — this is the default when incremental's prerequisites aren't met, not a workflow failure.

### 3. Load Knowledge Fragments

Consult `./resources/rrd-index.csv`, then load, in order, from `./resources/knowledge/`:

- `evidence-and-diff-discipline.md`
- `detect-dependencies.md`
- `detect-instability.md`
- `detect-data-issues.md`
- `detect-duplication.md`
- `detect-complexity.md`
- `detect-logging.md`
- `detect-config.md`
- `detect-locators.md`
- `detect-layering.md`
- `audit-all-report.md`

### 4. Continue

Load `./step-02-run-detectors.md`.
