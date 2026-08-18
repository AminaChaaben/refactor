Complete Refactor Radar Workflow Ecosystem

18 Skills total, organized by execution type:

Phase 1: Individual Detectors (9 core skills)

Each runs independently against a project and outputs findings:
- rrd-detect-dependencies — Test-to-test coupling
- rrd-detect-instability — Fragile selectors, fixed waits
- rrd-detect-data-issues — Test data lifecycle gaps
- rrd-detect-duplication — Structural code duplication
- rrd-detect-complexity — High-complexity hotspots
- rrd-detect-logging — Missing instrumentation/logging
- rrd-detect-config — Hardcoded URLs/credentials/config
- rrd-detect-locators — Locator strategy gaps
- rrd-detect-layering — Architecture/layer violations

Phase 2: Test Execution & Reliability Analysis (2 skills)

Work with actual test run logs:
- rrd-establish-execution-baseline — Capture N real test runs (prerequisite for reliability analysis)
- rrd-analyze-test-reliability — Classify false positives/negatives from logs

Phase 3: Orchestration & Aggregation (2 skills)

Combine detectors into ranked reports:
- rrd-audit-all — Main orchestrator: runs all 9 detectors → Evidence Fusion → Opportunity Engine → Impact Analysis → Ranking → HTML report
  - Internally: 7-step algorithm (step-02 through step-02e you just patched)
  - Outputs: consolidated HTML report, diffs, ranked opportunities
  - Optional inputs: execution logs (correlates with rrd-analyze-test-reliability)
- rrd-ci-gate — Gatekeeper: runs rrd-audit-all, fails if new Critical opportunities detected
  - Use case: block PRs/merges if new defects introduced

Phase 4: Action & Verification (2 skills)

Apply and validate fixes:
- rrd-apply-and-verify — Apply a proposed diff to the target project and run test suite to confirm no regressions
  - Auto-rollback on regression (if flag set)
  - Consumes: diffs from any detector or rrd-audit-all
- rrd-export-tickets — Export opportunities from an rrd-audit-all report as GitLab issues
  - Strictest consent bar (external write)
  - Two-stage confirmation before creating issues

Phase 5: Governance & Standards (1 skill)

Post-audit analysis:
- rrd-standards-audit — Check if recurring gaps (3+ occurrences) should be written conventions
  - Inputs: completed rrd-audit-all report as evidence
  - Outputs: governance gap report, proposed CONTRIBUTING/CODEOWNERS/Definition-of-Done updates

Setup & Configuration (1 skill)

- rrd-setup — Install/configure Refactor Radar module in a project
  - Merges config, manages legacy cleanup, sets up help system

Persona/Agent (1 skill)

- rrd-agent-radar — Conversational entry point (the Refactor Detective Ray persona)
  - Dispatches to other skills based on user intent

---
Execution Paths (Common Workflows)

Path 1: Full Audit → Ranking → Reporting

rrd-audit-all
  ├─ internally runs: step-02 (all 9 detectors)
  ├─ internally runs: step-02b (Evidence Fusion)
  ├─ internally runs: step-02c (Opportunity Engine)
  ├─ internally runs: step-02d (Impact Analysis)
  ├─ internally runs: step-02e (Ranking)
  └─ step-03 (write HTML + diffs)
Output: proposals/refactor-radar-audit-{date}.html + diffs

---
Path 2: Full Audit + Export → GitLab

rrd-audit-all (produces report)
  ↓
rrd-export-tickets (reads the report, creates GitLab issues)
Output: Issues in GitLab project, linked to diffs

---
Path 3: Single Detector (Ad-Hoc)

rrd-detect-{type} (run one detector only)
Output: proposals/{finding}.patch files only (no ranking, no opportunities)

---
Path 4: Test Reliability Analysis (Prerequisite)

rrd-establish-execution-baseline (capture test runs)
  ↓
rrd-analyze-test-reliability (classify logs)
  ↓
(optional) rrd-audit-all with logs (correlates detectors against real failures)
Output: Test reliability report + execution evidence for ranking

---
Path 5: CI Gate (Continuous Integration)

rrd-ci-gate (on every PR)
  ├─ runs rrd-audit-all
  └─ FAIL if new Critical opportunities
Output: Pass/Fail status; blocks merge if new high-severity issues

---
Path 6: Fix & Verify

(any detector or rrd-audit-all produces diffs)
  ↓
rrd-apply-and-verify (apply diff + test)
  ├─ Detects regression
  └─ Auto-rollback if flag enabled
Output: Test results + pass/fail verdict

---
Path 7: Governance Audit (Post-Audit)

rrd-audit-all (completed run)
  ↓
rrd-standards-audit (reads the report)
  ├─ Identifies recurring gaps (3+ occurrences)
  └─ Suggests written conventions
Output: governance-audit report + CONTRIBUTING/CODEOWNERS recommendations

---
Execution History (What Actually Ran)

From logs in _bmad-output/rrd-artifacts/:
detect-config-Selenium_TestNG_Amazon-2026-08-17.md
detect-config-selenium-automation-framework-saucedemo-2026-08-17.md
detect-dependencies-C-Users-achaabane-Desktop-BMAD_cursor-2026-08-06.md
detect-locators-selenium-automation-framework-saucedemo-2026-08-17.md
detect-logging-Selenium_TestNG_Amazon-2026-08-17.md
standards-audit-selenium-automation-framework-saucedemo-2026-08-17.md
test-reliability-Selenium_TestNG_Amazon-2026-08-12.md
test-reliability-selenium-automation-framework-saucedemo-2026-08-12.md

Audit History (Trend Tracking):
audit-history/selenium-automation-framework-saucedemo.json (1 run: 2026-08-18)

---
Which Workflows Are "Orchestrated" vs. "Standalone"?

Orchestrated (multi-step internal algorithms):
- rrd-audit-all — has 7 internal steps (02, 02b, 02c, 02d, 02e, 03) with formal algorithms
- rrd-ci-gate — orchestrates rrd-audit-all + pass/fail logic

Standalone (run once, output findings):
- All 9 detectors
- rrd-analyze-test-reliability
- rrd-establish-execution-baseline
- rrd-standards-audit
- rrd-apply-and-verify
- rrd-export-tickets