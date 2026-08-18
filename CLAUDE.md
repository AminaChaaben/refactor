# BMAD / Refactor Radar Project Instructions

## Refactor Radar Workflow: Category Detection & Human Confirmation

**Rule: Every Refactor Radar workflow must detect available categories, then ask the human to confirm.**

### Three Workflow Categories

**1. Full Refactor (Code-Based)**
- Prerequisite: Codebase indexed in codebase-memory-mcp
- Time: ~5-15 minutes
- Entry: `rrd-audit-all` (runs all 9 detectors) OR individual `rrd-detect-*` skills
- Output: Findings, diffs, HTML report with ranked opportunities
- Use: Planning code refactors, architecture audits, static analysis

**2. Log-Based (Execution-Based)**
- Prerequisites: Working test suite + ability to run tests + ability to capture logs (JUnit/Surefire XML, Playwright JSON, Jenkins console)
- Time: 1+ hours (includes test execution)
- Entry: `rrd-establish-execution-baseline` (run tests) → `rrd-analyze-test-reliability` (analyze logs)
- Output: Test reliability report, false-positive/false-negative classification
- Use: Finding flaky tests, understanding test failures, execution-driven root cause analysis

**3. Combined (Code + Execution)**
- Prerequisites: All of #1 and all of #2
- Time: 1+ hours
- Entry: `rrd-establish-execution-baseline` → `rrd-audit-all` (with log correlation)
- Output: Ranked opportunities backed by execution evidence
- Use: Highest-confidence audits when both code structure and real failures matter

### Agent Responsibility: Check Prerequisites, Then Confirm

When a user says "audit this," "detect flaky tests," or invokes any rrd-* skill:

**Step 1: Check Prerequisites (No User Input Needed)**
```
For Full Refactor:
  - Is the codebase indexed? (list_projects / index_status)
  - If NO: Full Refactor is BLOCKED. Why: must run index_repository first.
  - If YES: Full Refactor is AVAILABLE.

For Log-Based:
  - Does a test suite exist and can it run? (quick verification)
  - Can logs be captured in a standard format?
  - If NO to either: Log-Based is BLOCKED. Why: [specific reason]
  - If YES to both: Log-Based is AVAILABLE.
```

**Step 2: Present Options to Human**
```
Format (clear, explicit):

Workflow Category Options:

1. FULL REFACTOR (Code-Based)
   Status: ✅ AVAILABLE / ❌ BLOCKED [reason if blocked]
   Time: ~5-15 min
   Runs: All 9 detectors
   
2. LOG-BASED (Execution-Based)
   Status: ✅ AVAILABLE / ❌ BLOCKED [reason if blocked]
   Time: 1+ hours
   Requires: Working test suite + logging
   
3. COMBINED (Both)
   Status: ✅ AVAILABLE / ❌ BLOCKED [reason if blocked]
   Time: 1+ hours
   Requires: All of #1 + all of #2

Which workflow category do you want? (1, 2, or 3)
```

**Step 3: Human Decides**
- Human picks an available category (or asks to fix blockers first)
- Agent proceeds with that category only
- Agent never defaults, never assumes, never auto-selects

### Non-Negotiable

- Do NOT skip this decision point
- Do NOT ask vaguely ("Do you want logs?") — be specific about what's available
- Do NOT auto-choose Full Refactor if logs are available but not required
- Do NOT proceed until human has explicitly chosen a category from available options

### Exception: Single Detector Invocation

If user explicitly says "run rrd-detect-config" (names one detector), proceed directly — they've already made their category choice (Full Refactor). Still mention at the start: "Running Full Refactor (code-based) detector: rrd-detect-config."

### How to Apply This

- **rrd-audit-all step-01**: Now enforces this via "Detect Workflow Category Prerequisites" section
- **rrd-agent-radar / conversational entry**: Ask this question before dispatching to any skill
- **Other entry points** (rrd-standards-audit, rrd-ci-gate, etc.): Mention at startup which category they are, offer to pivot if needed
