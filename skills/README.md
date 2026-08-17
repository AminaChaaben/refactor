# Refactor Radar (rrd)

A graph-and-log-driven detection module for test/code reliability and maintainability defects, built on the BMad (Behavioral Module Architecture) framework.

**Version:** 2.6.0

## What It Does

Refactor Radar identifies the root causes that make test suites unreliable and code harder to maintain — then proposes reviewable diffs to fix them. Two categories of work:

1. **Analyze & Fix from Real Logs** — classify test failures from execution logs (JUnit/Surefire XML, Playwright JSON, Jenkins console) as real failures, false positives (flaky), or false negatives (tests that pass without checking anything). Auto-invokes dependency resolution if needed.

2. **Refactor for Best Practices** — six structural detectors uncover test-to-test coupling, fragility, data lifecycle issues, duplication, complexity hotspots, and diagnosability gaps (missing logging). Produces one consolidated ranked HTML report.

## Architecture

**One agent + 11 workflows:**

- `rrd-agent-radar` (Ray) — persona dispatcher; implements category-first menu dispatch
- `rrd-analyze-test-reliability` — logs-first, multi-run classification (Category 1 umbrella)
- `rrd-establish-execution-baseline` — turns any test suite from zero to N genuine runs, fixing environment/discovery blockers
- `rrd-audit-all` — runs all six detectors, pools findings, ranks by impact (Category 2 umbrella)
- `rrd-detect-dependencies` — test-to-test coupling, cascade risk
- `rrd-detect-instability` — fragile selectors, fixed waits, unhandled overlays
- `rrd-detect-data-issues` — shared/non-reusable test data, lifecycle gaps
- `rrd-detect-duplication` — structural code similarity via graph edges
- `rrd-detect-complexity` — high-complexity hotspots, hidden O(n²), unguarded recursion
- `rrd-detect-logging` — silent catches, exception-dropping logs, unlogged external calls/loops
- `rrd-apply-and-verify` — applies a chosen diff for real, runs target's test suite to confirm
- `rrd-setup` — module registration and configuration

## Core Principles

- **Evidence first** — every finding cites the exact graph query, trace, or log evidence that produced it
- **Diffs, not edits** — every proposal is a reviewable diff to the target project's `proposals/` folder; only `rrd-apply-and-verify` touches source directly, and only when explicitly approved per diff
- **Confidence levels** — reports confidence (high/medium/low), never absolutes
- **Cross-detector corroboration** — findings flagged by multiple detectors are treated as stronger evidence

## Dependencies

- **codebase-memory-mcp** — the knowledge graph MCP server that indexes codebases and provides `search_graph`, `query_graph`, `trace_path`, `get_code_snippet`, etc.
- **Python 3.8+** — for parsing test reports, resolving customization, etc.
- **Git** (optional but recommended) — for verifying `git status` before applying diffs

## Installation

1. Copy the `skills/rrd-*` directories and `skills/rrd-setup/` into your BMad project's `skills/` folder.
2. Copy the corresponding directories from `skills/` into `.claude/skills/` (Anthropic Claude environment mirror).
3. Run `rrd-setup` to configure the module for your project:
   ```bash
   Skill(rrd-setup)
   ```
   This registers capabilities, resolves output paths, collects user preferences.
4. Ensure `codebase-memory-mcp` is running and reachable (environment variable or MCP server config).

## Quick Start

### As a user
```
/rrd-agent-radar
Ray: What do you need?
  1. Analyze & fix based on real execution errors/logs
  2. Refactor code/tests for best practices
→ Pick 1 or 2, then select a capability from the menu
```

Or invoke directly:
```
Skill(rrd-audit-all, project="my-project")      # Category 2: full audit
Skill(rrd-analyze-test-reliability, project="my-project", log_sources=[...])  # Category 1: logs-first
```

### As a developer integrating rrd into another module
```python
# rrd-audit-all detectors can be invoked individually
Skill(rrd-detect-instability, project="my-project")
Skill(rrd-detect-complexity, project="my-project")

# Findings get pooled and ranked by rrd-audit-all's Evidence Fusion
# or by your own orchestration layer
```

## How It Works

### Category 1: Analyze & Fix (logs-driven)
1. User provides test execution logs (or rrd generates them via `rrd-establish-execution-baseline`)
2. `rrd-analyze-test-reliability` parses logs, aggregates per-test status across runs
3. For each flaky/failing test, invokes the **matching detector** (Instability/Dependencies/Data/Complexity/Logging) scoped to that test
4. Proposes fixes as diffs
5. Offers `rrd-apply-and-verify` to run the fix for real and confirm via test suite

### Category 2: Refactor (structure-driven)
1. User points rrd at an indexed project
2. `rrd-audit-all` runs all six detectors sequentially:
   - Each detector queries the codebase graph independently
   - Findings are pooled
3. **Evidence Fusion** phase: detects cross-detector corroboration (same target flagged by multiple detectors)
4. **Opportunity Engine**: groups related findings using Union-Find
5. **Impact Analysis**: estimates risk/effort per opportunity
6. **Ranking**: calculates priority (run-relative, not absolute)
7. Produces one consolidated HTML report grouped by root-cause family, ranked by impact
8. User applies individual diffs via `rrd-apply-and-verify`

## File Structure

```
skills/
  rrd-agent-radar/          # Ray persona, category-first dispatch
  rrd-analyze-test-reliability/
  rrd-establish-execution-baseline/
  rrd-audit-all/            # Pools all detectors
  rrd-detect-dependencies/
  rrd-detect-instability/
  rrd-detect-data-issues/
  rrd-detect-duplication/
  rrd-detect-complexity/
  rrd-detect-logging/       # Newest: instrumentation for diagnosability
  rrd-apply-and-verify/     # Only skill allowed to edit source
  rrd-setup/                # Module registration

Each skill follows BMad structure:
  SKILL.md                  # Persona/role, activation steps, conventions
  customize.toml            # Customization surface (persona, menu, persistent facts)
  workflow.yaml             # Config, tools, variables
  workflow-plan.md          # Implementation plan
  instructions.md           # User-facing overview
  checklist.md              # Validation checklist
  steps/                    # Sequential step files (step-01.md, step-02.md, etc.)
  resources/
    rrd-index.csv           # Knowledge fragment index
    knowledge/
      *-heuristics.md       # Detection logic, thresholds, corroboration rules
      evidence-and-diff-discipline.md  # Shared contract (kept in sync across skills)
      evidence-verification-guide.md   # How to verify graph evidence independently
```

## Documentation

- **Each skill's `SKILL.md`** — full conventions, activation sequence, how it works
- **`resources/knowledge/*.md`** — detection heuristics, thresholds, cross-detector corroboration rules
- **`evidence-and-diff-discipline.md`** — the shared Investigation Contract (in all skill folders)
- **Module help** — `module-help.csv` lists all skills, phases, and sequencing hints

## Key Features

- **Multi-run test analysis** — detects flakiness by aggregating results across runs, not single-run guesses
- **Execution-log driven** — correlates real failures/reruns against static findings for high-confidence classification
- **Cross-detector corroboration** — same target flagged by multiple detectors is treated as stronger evidence
- **Graph-based evidence** — all findings cite exact `query_graph`/`search_graph`/`trace_path` calls, verifiable independently via SQLite
- **Generalized across stacks** — works with Java/Selenium (JUnit/Surefire XML), TypeScript/Playwright (JSON reports), Jenkins console logs, or any parseable test output
- **Reviewable diffs only** — no automated source edits; every fix is a proposal in `proposals/`, applied only when owner explicitly approves

## Limitations & Known Scope

- Does **not** ingest test logs via the `ingest_traces` tool (that tool only accepts `{caller, callee, count}` triples for call-frequency boosting). Log analysis is a from-scratch capability using `Read`/`Grep`/`Bash`.
- Does **not** automatically commit or push fixes — all edits remain in `proposals/` until the owner explicitly runs `rrd-apply-and-verify`.
- Does **not** carry cross-session memory — findings from prior runs are not retained unless the owner saves them manually.
- **Requires an indexed project** — `index_repository` must run once before any detection workflow can query the graph.

## Testing & Validation

The module has been validated against real projects:
- **Java/Selenium** — spring-petclinic (1366 nodes), Selenium_TestNG_Amazon (172 nodes), selenium-automation-framework-saucedemo (511 nodes)
- **Python** — jarvis (8493 nodes) — used for priority formula calibration
- **TypeScript/Playwright** — saucedemo project with multi-run logs

## Contributing

All skills follow the shared Investigation Contract (`evidence-and-diff-discipline.md`). When adding new detectors:
1. Copy the structure of an existing detector (e.g., `rrd-detect-complexity`)
2. Add your heuristics to `resources/knowledge/{detector-name}.md`
3. Update `module-help.csv` with the new capability
4. Update `rrd-audit-all/steps/step-02-run-detectors.md` to invoke your detector as a new pass
5. Update `module.yaml` version number and greeting

