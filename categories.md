Category 1: Full Refactor (Code-Based)

Static analysis of the codebase itself — no test execution needed.

Entry Points:
- rrd-audit-all — Main orchestrator (runs all 9 detectors)
- rrd-detect-{type} — Individual detectors (run one at a time)
- rrd-agent-radar — Conversational entry (Ray persona, dispatches to skills)
- rrd-ci-gate — Gates on refactor audit (prevents merge if new Critical)
- rrd-standards-audit — Analyzes refactor audit output

What They Analyze:
- Source code structure (codebase-memory graph)
- Complexity metrics (cyclomatic, cognitive, loop depth, etc.)
- Code duplication (graph similarity)
- Dependencies & coupling (call graph)
- Architecture/layering (file structure vs. convention)
- Hardcoded config/secrets/URLs
- Locator strategy (in test code)
- Logging gaps (instrumentation)

Output:
- Findings + diffs (proposals/)
- HTML report with opportunities ranked by priority
- No test execution involved

Prerequisite: None (just the codebase indexed in codebase-memory-mcp)

---
Category 2: Log-Based (Execution-Based)

Dynamic analysis of actual test execution — requires running tests and capturing logs.

Entry Points:
- rrd-establish-execution-baseline — Setup: capture N real test runs (prerequisite)
- rrd-analyze-test-reliability — Analysis: classify false positives/negatives from logs

What They Analyze:
- Test execution logs (JUnit/Surefire XML, Playwright JSON, Jenkins console)
- Which tests fail consistently vs. intermittently (flaky tests)
- False positives (tests pass but don't really check anything)
- False negatives (tests pass when they shouldn't)
- Failure patterns & cascades (one failure triggers others)
- Failure classification (app-error vs. env-error vs. data-error vs. script-bug)

Output:
- Test reliability report
- Classified failures with root-cause hypotheses
- Execution evidence (can be consumed by rrd-audit-all for correlation)

Prerequisite: Working test suite that can run; logs from at least 1 (ideally 3+) real runs

---
Optional Integration: Both Categories Together

rrd-audit-all can optionally consume log-based evidence for corroboration:

Step 1: rrd-establish-execution-baseline
  ↓ (captures 3+ real test runs)

Step 2: rrd-analyze-test-reliability
  ↓ (classifies failures from logs)

Step 3: rrd-audit-all with log correlation
  ├─ Runs all 9 detectors (code-based)
  ├─ Correlates findings against real failures (log-based evidence)
  └─ Ranking weighs by execution evidence (flaky tests found = higher confidence)

When to combine:
- You want both code structure analysis and proof those issues actually fail in practice
- Higher confidence ranking (backed by real test failures)
- More accurate false-positive/false-negative assessment

When to use separately:
- Full Refactor Only: Quick code audit, no test environment available
- Log-Based Only: You want to understand why tests are flaky, not refactor the code

---
Execution Workflow by Category

Full Refactor Flow (Code-Based)

┌─────────────────────────────────────────────────────┐
│ User: "audit all" or "detect complexity"            │
└──────────────────┬──────────────────────────────────┘
                   ↓
           ┌───────────────────┐
           │  rrd-audit-all    │ (or single rrd-detect-*)
           │  (7-step engine)  │
           └───────┬───────────┘
                   ↓
        ┌──────────┴──────────┐
        │                     │
    proposals/          proposals/
    refactor-radar-   *.patch (diffs)
    audit-*.html
    (ranked report)

Log-Based Flow (Execution-Based)

┌──────────────────────────────────────────┐
│ User: "establish baseline" or            │
│       "analyze test reliability"          │
└────────────────┬─────────────────────────┘
                 ↓
     ┌─────────────────────────┐
     │ rrd-establish-          │
     │ execution-baseline      │
     │ (run tests, capture)    │
     └───────────┬─────────────┘
                 ↓
          .multi-run-logs/
          (3+ XML/JSON logs)
                 ↓
     ┌─────────────────────────┐
     │ rrd-analyze-            │
     │ test-reliability        │
     │ (classify from logs)    │
     └───────────┬─────────────┘
                 ↓
          test-reliability-
          *.md (report)

Combined Flow (Code + Execution)

┌──────────────────────────────────────────┐
│ rrd-establish-execution-baseline (runs 3x)
└────────────────┬─────────────────────────┘
                 ↓
          .multi-run-logs/ (captured)
                 ↓
┌────────────────────────────────────────────┐
│ rrd-audit-all                              │
│ ├─ step-02: runs 9 detectors (code-based)
│ ├─ correlates against logs (execution)
│ ├─ step-02b-02e: ranks using both signals
│ └─ step-03: outputs report with execution
│              evidence annotations
└────────────────┬────────────────────────────┘
                 ↓
    ┌────────────┴────────────┐
    │                         │
refactor-radar-audit-*.html  *.patch
(shows: "3 flaky tests      (diffs)
 corroborate this
 finding")

---
Decision Tree: Which Category to Use?

Do you have a working test suite?
├─ NO → Use FULL REFACTOR only
│       (code analysis, no logs needed)
│
└─ YES → Do you want to know if findings cause real failures?
         ├─ NO → Use FULL REFACTOR only
         │       (faster, sufficient for refactoring plan)
         │
         └─ YES → Use BOTH (Establish Baseline → Analyze Logs → Audit All)
                  (slower, but findings backed by execution evidence)

---
Summary Table

┌──────────────────┬─────────────────────────┬──────────────────────────────┬───────────────────────┐
│      Aspect      │      Full Refactor      │          Log-Based           │       Combined        │
├──────────────────┼─────────────────────────┼──────────────────────────────┼───────────────────────┤
│ Primary Input    │ Source code             │ Test execution logs          │ Code + Logs           │
├──────────────────┼─────────────────────────┼──────────────────────────────┼───────────────────────┤
│ Time to Run      │ Minutes (indexing)      │ Hours+ (run tests 3x)        │ Hours+                │
├──────────────────┼─────────────────────────┼──────────────────────────────┼───────────────────────┤
│ Prerequisite     │ Codebase indexed        │ Working test suite           │ Both                  │
├──────────────────┼─────────────────────────┼──────────────────────────────┼───────────────────────┤
│ Confidence Level │ Structural              │ Empirical                    │ Highest               │
├──────────────────┼─────────────────────────┼──────────────────────────────┼───────────────────────┤
│ Best For         │ Planning refactors      │ Fixing flaky tests           │ End-to-end validation │
├──────────────────┼─────────────────────────┼──────────────────────────────┼───────────────────────┤
│ Skills Involved  │ 9 detectors + audit-all │ establish-baseline + analyze │ All 3                 │
└──────────────────┴─────────────────────────┴──────────────────────────────┴───────────────────────┘
