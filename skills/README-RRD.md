# Refactor Radar (rrd-*) Skills — Complete Reference

**Version:** 3.0.0  
**Module Code:** `rrd`  
**Module Name:** Refactor Radar

## Overview

Refactor Radar is a forensic detective for test/code reliability and maintainability defects. It finds coupling, fragility, duplication, complexity hotspots, and (from real execution logs) false-positive/false-negative test classifications — via codebase knowledge graphs and execution log analysis — then proposes reviewable diffs with explicit verification before applying anything.

19 distinct skills implement this module's capabilities, organized into three categories:

1. **Log-Based (Execution) Analysis** — classifies real test failures
2. **Code-Based (Structural) Detection** — finds maintainability defects via code/graph analysis
3. **Support/Utility** — setup, CI gate, ticket export, apply-and-verify

---

## Configuration

### Primary Config File: `_bmad/rrd/config.yaml`

**Location:** `{project-root}/_bmad/rrd/config.yaml`

**Purpose:** Central configuration mirror for all rrd-* workflows and Ray (`rrd-agent-radar`).

**Safe to hand-edit at any time** — every workflow re-reads it on activation; no need to re-run setup after a manual change.

**Keys:**
```yaml
# Core configuration (set by rrd-setup, safe to hand-edit anytime)
rrd_artifacts: "{project-root}/_bmad-output/rrd-artifacts"  # Where Ray writes reports/summaries
output_folder: "{project-root}/_bmad-output"                # Shared BMad output root
user_name: "achaabane"                                       # User greeting name
communication_language: "English"                             # Agent chat language
document_output_language: "English"                           # Report output language

# Runtime state (written by Ray after each menu dispatch, safe to hand-edit or delete)
last_category: "2"                    # Default category suggestion (1 or 2)
last_code: "AA"                       # Last-used menu code (TR/EB/AA/DD/DI/etc.)
```

**Valid menu codes** (for `last_code`):
- Category 1 (Log-Based): `TR` (Analyze Test Reliability), `EB` (Establish Execution Baseline)
- Category 2 (Code-Based): `AA`, `DD`, `DI`, `DT`, `DU`, `DC`, `DL`, `DV`, `DF`, `DO`, `DY`, `SA`
- Any: `AV` (Apply and Verify)

### Secondary Config Files

**`_bmad/config.yaml`** (unified, project-root level) — written by `rrd-setup`'s `merge-config.py` script. Contains `rrd:` section with module metadata. Source of truth for reconfigure; changes here flow to `_bmad/rrd/config.yaml` on next setup run.

**`_bmad/config.user.yaml`** (personal, gitignored) — holds user-only keys (`user_name`, `communication_language`). Also written by setup; not touched by workflows.

---

## All 19 Skills

### Category 1: Log-Based (Execution) Analysis

#### 1. **rrd-analyze-test-reliability** (Code: `TR`)
**Purpose:** Classify false positives (flaky tests) and false negatives (tests that pass without checking anything) from execution logs across multiple runs.

**Trigger:** 
- Direct: `/rrd-analyze-test-reliability`
- Ray menu: Pick `TR` (category 1, recommended)

**Architecture:** Step-file (sequential, no tri-modal edit/validate)

**Config Read:** `{project-root}/_bmad/rrd/config.yaml` (Step 5: `user_name`, `communication_language`)

**Inputs:**
- **JUnit/Surefire XML:** `{project-root}/.test-results/**/*.xml`
- **Playwright JSON:** `{project-root}/test-results/**/*.json`
- **Jenkins console:** Pasted/provided manually
- **Codebase:** Must be indexed in codebase-memory-mcp

**Outputs:**
```
{project-root}/_bmad-output/rrd-artifacts/
  ├─ analyze-test-reliability-{target_project}-{date}.md     (findings report)
  └─ test-reliability-runs-{target_project}.json              (baseline, per-project)

{project-root}/.refactor-radar-work/
  └─ test-results-analysis.json                              (internal working file)
```

**Steps:**
1. Preflight & init (environment check, codebase graph validation)
2. Scan logs (detect test runs, extract pass/fail)
3. Classify (app-error, env-error, data-error, script-error)
4. Report (findings + confidence levels)

**Modes:** Single-step workflow (no edit/validate phase)

---

#### 2. **rrd-establish-execution-baseline** (Code: `EB`)
**Purpose:** Get any test suite from zero to N genuine execution runs, fixing environment/discovery blockers along the way. Standalone — runs the baseline without the full classification.

**Trigger:**
- Direct: `/rrd-establish-execution-baseline`
- Ray menu: Pick `EB` (category 1)

**Architecture:** Step-file

**Config Read:** `{project-root}/_bmad/rrd/config.yaml` (Step 5)

**Inputs:**
- **Test suite:** Must exist and be discoverable (Maven, Gradle, npm, pytest, etc.)
- **Environment:** Git repo with test suite source
- **Codebase:** Indexed in codebase-memory-mcp

**Outputs:**
```
{project-root}/test-results/
  └─ {run_1}.xml, {run_2}.xml, ... {run_N}.xml              (JUnit/Surefire XML or equivalent)

{project-root}/_bmad-output/rrd-artifacts/
  └─ establish-execution-baseline-{target_project}-{date}.md (run summary report)

{project-root}/.refactor-radar-work/
  └─ baseline-runs-{target_project}.json                    (metadata)
```

**Steps:**
1. Preflight (detect test framework, check environment)
2. Discover (find all test cases)
3. Execute (run N times, capture logs)
4. Diagnose blockers (if any runs fail: environment, compile, discovery issues)
5. Report (summary of successful runs)

---

### Category 2: Code-Based (Structural) Detection

#### 3. **rrd-audit-all** (Code: `AA`)
**Purpose:** Run all 10 structural detectors in sequence, pool findings into opportunities, rank by priority, and produce one consolidated HTML report. The flagship deliverable.

**Trigger:**
- Direct: `/rrd-audit-all`
- Ray menu: Pick `AA` (category 2, recommended)

**Architecture:** Step-file (10 sequential steps)

**Config Read:** `{project-root}/_bmad/rrd/config.yaml` (Step 5 + Step 4 for artifact location)

**Inputs:**
- **Codebase:** Must be indexed in codebase-memory-mcp (`mcp__codebase-memory-mcp__list_projects`)
- **Target project:** Named in workflow input

**Outputs:**
```
{project-root}/_bmad-output/rrd-artifacts/
  ├─ refactor-radar-audit-{target_project}-{date}.html      (main consolidated report)
  ├─ audit-history/{target_project}.json                    (trend file, appended each run)
  └─ *.pdf (optional, if report includes charts)

{project-root}/proposals/
  └─ {file}.{finding_id}.patch                              (one diff per finding)

{project-root}/.refactor-radar-work/
  ├─ findings.json                                           (step-02 output)
  ├─ correlations.json                                       (step-02b output)
  ├─ opportunities.json                                      (step-02c/02d/02e output)
  └─ (deleted after step-03 completes, unless user keeps it)
```

**Steps:**
1. Preflight & init (codebase graph, project name validation)
2. Run detectors (all 10 in parallel, collect findings)
2b. Evidence fusion (correlate findings by target/root-cause)
2c. Opportunity engine (group findings into opportunities)
2d. Impact analysis (transitive impact, scope, blast radius)
2e. Ranking (priority scoring, normalize run-relative)
3. Report rendering (HTML + diffs to proposals/)

**Detectors (10 total):**
- **DD** — Detect Dependencies (test-to-test coupling, order-dependence)
- **DI** — Detect Instability (fragile selectors, fixed waits, stale elements)
- **DT** — Detect Data Issues (shared test data, lifecycle gaps)
- **DU** — Detect Duplication (code similarity, redundancy)
- **DC** — Detect Complexity (hotspots, O(n²) scans, unguarded recursion)
- **DL** — Detect Logging (silent catches, exception-dropping, unlogged calls)
- **DV** — Detect Tech Versions (version pinning, CVE risk, breaking changes)
- **DF** — Detect Config (hardcoded URLs/credentials, env-switch logic)
- **DO** — Detect Locators (duplicated selectors, absent priority tiering)
- **DY** — Detect Layering (cross-layer violations, mixed responsibilities)

**Modes:** Single-step (10 sequential steps, no edit/validate phase)

---

#### 4. **rrd-detect-dependencies** (Code: `DD`)
**Purpose:** Find test-to-test coupling: shared fixtures, order-dependence, cascade risk.

**Trigger:**
- Direct: `/rrd-detect-dependencies`
- Ray menu: Pick `DD` (category 2)
- Part of `rrd-audit-all` (step 02, detector #1)

**Architecture:** Step-file

**Config Read:** `{project-root}/_bmad/rrd/config.yaml` (Step 5)

**Inputs:**
- **Codebase:** Indexed
- **Target project:** Named

**Outputs:**
```
{project-root}/_bmad-output/rrd-artifacts/
  └─ detect-dependencies-{target_project}.md                (findings report)

{project-root}/proposals/
  └─ {file}.DI-{###}.patch                                  (one per finding)

{project-root}/.refactor-radar-work/
  └─ detect-dependencies-findings.json                      (internal, if audit-all run)
```

**Modes:** Single-step (detect + report, no edit/validate)

---

#### 5. **rrd-detect-instability** (Code: `DI`)
**Purpose:** Find fragile selectors, fixed waits, unhandled overlays, mixed wait strategies, stale element reuse, loader-disappearance-as-success, blanket retries — the flaky-test root causes.

**Trigger:**
- Direct: `/rrd-detect-instability`
- Ray menu: Pick `DI` (category 2)
- Part of `rrd-audit-all`

**Architecture:** Step-file

**Inputs:** Codebase (indexed)

**Outputs:** Same structure as DD above (findings + diffs)

**Modes:** Single-step

---

#### 6. **rrd-detect-data-issues** (Code: `DT`)
**Purpose:** Find shared/non-reusable test data and lifecycle gaps that cause collisions.

**Trigger:** `/rrd-detect-data-issues` | Ray menu `DT` | part of `rrd-audit-all`

**Outputs:** Same as DD

---

#### 7. **rrd-detect-duplication** (Code: `DU`)
**Purpose:** Find redundant or near-duplicate code via structural graph similarity.

**Trigger:** `/rrd-detect-duplication` | Ray menu `DU` | part of `rrd-audit-all`

**Outputs:** Same as DD

---

#### 8. **rrd-detect-complexity** (Code: `DC`)
**Purpose:** Find high-complexity/cognitive-load hotspots, hidden O(n²) scans, unguarded recursion via graph metrics.

**Trigger:** `/rrd-detect-complexity` | Ray menu `DC` | part of `rrd-audit-all`

**Outputs:** Same as DD

---

#### 9. **rrd-detect-logging** (Code: `DL`)
**Purpose:** Find diagnosability gaps: silent catches, exception-dropping logs, unlogged external calls/loop failure paths.

**Trigger:** `/rrd-detect-logging` | Ray menu `DL` | part of `rrd-audit-all`

**Outputs:** Same as DD

---

#### 10. **rrd-detect-tech-versions** (Code: `DV`)
**Purpose:** (Selenium/Playwright only) Check version pinning/centralization discipline, curated CVEs, breaking-migration risk. Fully reliable; surfaces "latest version" only as unverified candidate.

**Trigger:** `/rrd-detect-tech-versions` | Ray menu `DV` | part of `rrd-audit-all`

**Outputs:** Same as DD

---

#### 11. **rrd-detect-config** (Code: `DF`)
**Purpose:** Find hardcoded URLs/credentials, inline environment-switch logic, unsafe parallel-execution config.

**Trigger:** `/rrd-detect-config` | Ray menu `DF` | part of `rrd-audit-all`

**Outputs:** Same as DD

---

#### 12. **rrd-detect-locators** (Code: `DO`)
**Purpose:** Find duplicated selector definitions, absent priority tiering (data-testid > ARIA/role > semantic > absolute XPath), no centralized element repository.

**Trigger:** `/rrd-detect-locators` | Ray menu `DO` | part of `rrd-audit-all`

**Outputs:** Same as DD

---

#### 13. **rrd-detect-layering** (Code: `DY`)
**Purpose:** Find mixed responsibilities in one directory, cross-layer violations (assertions in page objects, raw data access in tests), inconsistent naming conventions.

**Trigger:** `/rrd-detect-layering` | Ray menu `DY` | part of `rrd-audit-all`

**Outputs:** Same as DD

---

#### 14. **rrd-standards-audit** (Code: `SA`)
**Purpose:** Find governance gaps (missing conventions docs, Definition-of-Done, lint config, CODEOWNERS) using a completed Audit All run's findings as evidence. **Prerequisite:** Run `rrd-audit-all` first.

**Trigger:** `/rrd-standards-audit` | Ray menu `SA` | standalone (not part of audit-all)

**Architecture:** Step-file

**Config Read:** `{project-root}/_bmad/rrd/config.yaml`

**Inputs:**
- **Codebase:** Indexed
- **Prior audit:** `{project-root}/_bmad-output/rrd-artifacts/refactor-radar-audit-{target_project}-{date}.html` (findings as evidence)

**Outputs:**
```
{project-root}/_bmad-output/rrd-artifacts/
  └─ standards-audit-{target_project}.md                    (governance findings)

{project-root}/proposals/
  └─ {file}.SA-{###}.patch                                  (proposals if applicable)
```

**Modes:** Single-step

---

### Category 3: Support & Utility

#### 15. **rrd-agent-radar** (Code: `Ray`)
**Purpose:** Interactive agent that presents Ray's menu, dispatches to other rrd-* skills, and persists your menu choices across sessions (remembers last-used category/code).

**Trigger:**
- Direct: `/rrd-agent-radar` or any Ray invocation
- Standalone workflow entry point

**Architecture:** Interactive agent (not step-file)

**Config Read:** `{project-root}/_bmad/rrd/config.yaml` (all keys, including `last_category`/`last_code`)

**Config Write:** `{project-root}/_bmad/rrd/config.yaml` (after dispatch: updates `last_category` and `last_code`)

**Behavior:**
1. Greet user with `user_name` in `communication_language`
2. Ask for category (1 = log-based, 2 = code-based) — suggests `last_category` if set
3. Show menu filtered by category; mark `last_code` as "(last used)" if set
4. Accept menu code, number, or fuzzy description match
5. Dispatch to the chosen skill
6. Write back `last_category`/`last_code` after dispatch

**Outputs:** None directly (dispatches to other skills)

---

#### 16. **rrd-setup** (Code: `setup`)
**Purpose:** One-time or reconfigure setup for the module. Collects user preferences, writes config files, creates output directories, cleans up legacy files.

**Trigger:**
- Direct: `/rrd-setup`
- User says: "setup refactor radar", "configure rrd", "install rrd module"

**Architecture:** Single-step wrapper (not step-file)

**Config Read:** `{project-root}/_bmad/config.yaml`, `{project-root}/_bmad/config.user.yaml`, `{project-root}/_bmad/rrd/config.yaml` (to cache `last_category`/`last_code`)

**Config Write:**
```
{project-root}/_bmad/config.yaml               (merge: root-level core + rrd: section)
{project-root}/_bmad/config.user.yaml           (merge: user_name, communication_language)
{project-root}/_bmad/module-help.csv            (merge: rrd capabilities registry)
{project-root}/_bmad/rrd/config.yaml            (rewrite: base template + runtime fragment)
```

**Prompts:**
- **Core (first-time only):** user_name, communication_language, document_output_language, output_folder
- **Module:** rrd_artifacts (where to write reports)

**Script Usage:**
```bash
python ./scripts/merge-config.py --config-path ... --user-config-path ... --module-yaml ./assets/module.yaml --answers {temp.json} --legacy-dir ...
python ./scripts/merge-help-csv.py --target ... --source ./assets/module-help.csv --legacy-dir ... --module-code rrd
python ./scripts/cleanup-legacy.py --bmad-dir ... --module-code rrd --also-remove _config --skills-dir ...
```

**Outputs:**
```
{project-root}/_bmad/
  ├─ config.yaml                                            (unified config, source of truth)
  ├─ config.user.yaml                                       (personal settings, gitignored)
  ├─ module-help.csv                                        (capabilities registry)
  └─ rrd/config.yaml                                        (mirror file, hand-editable)

{project-root}/_bmad-output/
  └─ rrd-artifacts/                                         (created if missing)
```

**Modes:** Single-step

---

#### 17. **rrd-apply-and-verify** (Code: `AV`)
**Purpose:** Apply one or more previously-proposed diffs to the target project for real, then run its test suite and report genuine pass/fail counts. The **only** rrd-* skill that deliberately edits source.

**Trigger:**
- Direct: `/rrd-apply-and-verify` + name diffs to apply
- Ray menu: Pick `AV` (available in both categories)

**Architecture:** Step-file (tri-modal: pick → apply → verify)

**Config Read:** `{project-root}/_bmad/rrd/config.yaml`

**Inputs:**
- **Diffs:** `{project-root}/proposals/{file}.{finding_id}.patch` (from prior detectors)
- **Test suite:** Must exist and be runnable in the target project
- **Codebase:** Will be edited (and reverted if test-verify fails)

**Outputs:**
```
{project-root}/_bmad-output/rrd-artifacts/
  └─ apply-and-verify-{target_project}-{date}.md           (apply summary + test results)

{project-root}/{target_files}                                (edited by applied diffs)
```

**Steps:**
1. Preflight (verify diffs exist, target project readable)
2. Select diffs (user picks which proposals to apply)
3. Apply (patch files in place)
4. Run tests (execute test suite, capture output)
5. Verify (compare pass/fail counts vs baseline)
6. Report (applied ✓, test results, any regressions)

**Modes:** Tri-modal (Pick Diffs → Apply → Verify Results)

---

#### 18. **rrd-ci-gate** (Code: `gate`)
**Purpose:** Pass/fail a CI pipeline based on Critical-level findings from a completed Audit All run. Standalone gate skill — not part of Ray's menu.

**Trigger:**
- Direct: `rrd-ci-gate` in a CI/CD step
- Command-line: `rrd-ci-gate --audit-report {path} --fail-on {Critical|High|Medium}`

**Architecture:** Single-step wrapper (not step-file)

**Config Read:** `{project-root}/_bmad/rrd/config.yaml`

**Inputs:**
- **Audit report:** `{project-root}/_bmad-output/rrd-artifacts/refactor-radar-audit-{target_project}-{date}.html`

**Outputs:**
```
Exit code: 0 (pass, no Critical findings) or 1 (fail, found Critical findings)

{project-root}/_bmad-output/rrd-artifacts/
  └─ ci-gate-{target_project}-{date}.log                   (gate decision + details)
```

**Modes:** Single-step

---

#### 19. **rrd-export-tickets** (Code: `export`)
**Purpose:** Export top-N opportunities from a completed Audit All run as GitLab issues (or similar). Standalone export skill — not part of Ray's menu.

**Trigger:**
- Direct: `rrd-export-tickets` with audit report + target repo
- Command-line: `rrd-export-tickets --audit-report {path} --top-n {N} --project {id}`

**Architecture:** Single-step wrapper

**Config Read:** `{project-root}/_bmad/rrd/config.yaml`

**Inputs:**
- **Audit report:** `{project-root}/_bmad-output/rrd-artifacts/refactor-radar-audit-{target_project}-{date}.html`
- **GitLab project ID or URL:** User-provided

**Outputs:**
```
Created N GitLab issues with:
  - Title from opportunity.title
  - Description from opportunity.problem_statement + recommendation
  - Labels: Critical/High/Medium (by priority.level)
  - Links to diff proposals in {project-root}/proposals/

{project-root}/_bmad-output/rrd-artifacts/
  └─ export-tickets-{target_project}-{date}.log            (exported tickets summary)
```

**Modes:** Single-step

---

## Skill Invocation Patterns

### Via Ray (Interactive Menu)
```
User: "talk to Ray" or "run rrd-agent-radar"
Ray greets, asks category (1 or 2), shows menu, you pick code/number/description
→ Dispatches to chosen skill
```

### Direct Skill Invocation
```
User: "/rrd-detect-dependencies" or "run detect dependencies"
→ Skill runs directly, skipping the menu
```

### From `rrd-audit-all`
```
User: "/rrd-audit-all"
→ Runs 10 detectors in sequence (DD, DI, DT, DU, DC, DL, DV, DF, DO, DY)
→ Pools findings, ranks by priority, produces one HTML report
```

### Standalone Support Skills
```
User: "/rrd-setup"              — Configure module
User: "/rrd-standards-audit"    — Governance audit (after audit-all)
User: "/rrd-apply-and-verify"   — Apply diff + run tests
User: "rrd-ci-gate ..."         — CI gate script
User: "rrd-export-tickets ..."  — Export to GitLab
```

---

## Data Flow Summary

```
rrd-setup
  ↓ (writes config)
{project-root}/_bmad/rrd/config.yaml
  ↑
  ├─ Read by: rrd-agent-radar, rrd-audit-all, all rrd-detect-* skills
  ├─ Write by: rrd-agent-radar (last_category, last_code)
  │
  └─ Templates in assets/:
      ├─ rrd-config-template.yaml         (base, 5 keys)
      └─ rrd-config-runtime-fragment.yaml (runtime, 2 keys)

rrd-establish-execution-baseline
  ↓ (generates test runs)
{project-root}/test-results/
  ↓
{project-root}/.refactor-radar-work/baseline-runs-{project}.json
  ↓
rrd-analyze-test-reliability (reads baseline, classifies runs)
  ↓ (or)
rrd-audit-all → rrd-detect-* (each generates findings.json)
  ↓
{project-root}/.refactor-radar-work/findings.json
  ↓
step-02b (correlate) → correlations.json
  ↓
step-02c (opportunity engine) → opportunities.json
  ↓
step-02d (impact) → opportunities.json (enriched)
  ↓
step-02e (ranking) → opportunities.json (ranked)
  ↓
step-03 (render)
  ↓
{project-root}/_bmad-output/rrd-artifacts/refactor-radar-audit-{project}-{date}.html
{project-root}/proposals/{file}.{finding_id}.patch
  ↓
rrd-apply-and-verify (applies diffs, runs tests)
  ↓ (or)
rrd-standards-audit (uses audit as evidence)
  ↓ (or)
rrd-ci-gate (pass/fail on Critical findings)
  ↓ (or)
rrd-export-tickets (export opportunities as GitLab issues)
```

---

## Quick Start

1. **First time:** Run `/rrd-setup` to configure module, output paths, user name.

2. **Index your codebase:** Before any detection, make sure it's indexed:
   ```
   codebase-memory-mcp: index_repository(repo_path="path/to/project")
   ```

3. **Talk to Ray:**
   ```
   User: "talk to Ray" or invoke rrd-agent-radar
   Ray asks: Category 1 (logs) or 2 (code)?
   Pick: 2
   Ray shows menu, you pick AA (Audit All) or any detector code
   ```

4. **Run Audit All:**
   ```
   User: "/rrd-audit-all"
   → Runs all 10 detectors
   → Pools findings into opportunities
   → Generates {project-root}/_bmad-output/rrd-artifacts/refactor-radar-audit-{project}-{date}.html
   → Diffs go to {project-root}/proposals/
   ```

5. **Review diffs:** Open proposals/, read each `.patch` file.

6. **Apply & verify:** 
   ```
   User: "/rrd-apply-and-verify"
   Ray asks: Which diffs to apply?
   You pick, Ray applies + runs test suite
   → Report: {project-root}/_bmad-output/rrd-artifacts/apply-and-verify-{project}-{date}.md
   ```

7. **(Optional) Export issues:**
   ```
   User: "rrd-export-tickets --audit-report ... --project {gitlab-id}"
   → Creates GitLab issues for top-N opportunities
   ```

---

## Config Edit Without Rerunning Setup

To edit `_bmad/rrd/config.yaml` by hand (no setup needed):

1. Open `{project-root}/_bmad/rrd/config.yaml`
2. Edit any field (valid values are documented inline)
3. Save
4. On next `rrd-agent-radar` / skill activation, the new values are read automatically

**Do not edit** the template files (`assets/rrd-config-template.yaml`, `assets/rrd-config-runtime-fragment.yaml`) unless you want those changes to apply to *future* setup runs — the on-disk `_bmad/rrd/config.yaml` is the live file workflows read.

---

## Paths Reference

| Path | Purpose | Created By | Read By |
|------|---------|-----------|---------|
| `_bmad/rrd/config.yaml` | Main config mirror | rrd-setup | All rrd-* skills, Ray |
| `_bmad/config.yaml` | Unified root config | rrd-setup | Rarely (config mirror takes precedence for rrd) |
| `_bmad/config.user.yaml` | Personal settings (gitignore) | rrd-setup | rrd-setup (for user_name/language) |
| `_bmad-output/rrd-artifacts/` | Findings reports, audit HTML, trend files | All rrd-* skills | rrd-ci-gate, rrd-export-tickets |
| `proposals/{file}.{finding_id}.patch` | Reviewable diffs | All rrd-detect-*, rrd-audit-all | rrd-apply-and-verify |
| `.refactor-radar-work/` | Internal working files (temp) | rrd-detect-*, rrd-audit-all | Intermediate steps (deleted after audit-all step-03) |
| `test-results/` | Test run XML/JSON logs | rrd-establish-execution-baseline | rrd-analyze-test-reliability |

---

## Architecture Notes

- **Step-file skills:** `rrd-audit-all`, all `rrd-detect-*`, `rrd-analyze-test-reliability`, `rrd-establish-execution-baseline`, `rrd-standards-audit`, `rrd-apply-and-verify` — execute numbered steps sequentially, each producing artifacts the next step consumes.
- **Single-step skills:** `rrd-setup`, `rrd-ci-gate`, `rrd-export-tickets` — wrapper instructions, not step-files.
- **Agent skill:** `rrd-agent-radar` (Ray) — interactive dispatcher, not a detector or workflow.
- **Tri-modal skill:** Only `rrd-apply-and-verify` (Pick → Apply → Verify).
- **Defaults:** Ray remembers your last menu choice (category + code) in `last_category`/`last_code` and suggests it next time.
- **Knowledge fragments:** Shared files like `evidence-and-diff-discipline.md` are copied into each skill's own `resources/knowledge/` (not cross-referenced) to keep skills independently installable.

---

## Support & Troubleshooting

For help with any skill:
- Inline: Invoke `bmad-help` skill at any time
- Module greeting: Run `/rrd-setup` to see the full module greeting

For config issues:
- Check `_bmad/rrd/config.yaml` — verify all keys are set, values are valid
- Check `_bmad/config.yaml` — verify `rrd:` section exists
- Try re-running `/rrd-setup` — it reconciles config across both files

For skill errors:
- Check preflight/init steps (early in each skill) — they validate codebase indexing and environment
- Check `.refactor-radar-work/` for intermediate artifacts — helps diagnose where a multi-step skill failed
- If a step fails, do NOT skip it — go back and re-run the failing step (quality gates are there for a reason)

