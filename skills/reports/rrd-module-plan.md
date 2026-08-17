---
title: 'Module Plan'
status: 'complete'
module_name: 'Refactor Radar'
module_code: 'rrd'
module_description: 'Graph-and-log-driven detection module that finds test/code reliability defects (dependency/cascade, instability, data lifecycle, maintenance/duplication) and proposes reviewable diffs — never edits source directly.'
architecture: 'stateless persona/router agent (Ray) + 5 sibling workflow skills, TEA-fidelity multi-skill module'
standalone: false
expands_module: ''
skills_planned: ['rrd-agent-radar', 'rrd-detect-dependencies', 'rrd-detect-instability', 'rrd-detect-data-issues', 'rrd-detect-duplication', 'rrd-audit-all', 'rrd-setup']
config_variables: ['rrd_artifacts', 'output_folder', 'user_name', 'communication_language', 'document_output_language']
created: '2026-08-04'
updated: '2026-08-05'
---

# Module Plan

## Vision

Refactor Radar is a BMad module that turns a codebase knowledge graph (via `codebase-memory-mcp`) plus execution/test logs into concrete, reviewable refactor proposals. It generalizes a proven concept: `kb_agent.py` (an existing Claude-driven agent at `C:\Users\achaabane\Desktop\refactor_module\kb_agent.py`) already explores an indexed codebase via the graph and proposes refactors as unified diffs, never editing source directly. That agent is generic — Refactor Radar specializes it into four named detection capabilities, each grounded in a real root-cause taxonomy from a TNR (non-regression test) reliability engagement: dependency/cascade failures (47% of observed false-fails), instability (18%), data lifecycle issues (17%), and maintenance/duplication (18%). It is built to be reusable across any indexed project, not tied to one client, and installable as a peer module inside a larger orchestrated BMad-based testing factory.

## Architecture

**REVISED DECISION (supersedes the original "single agent, four capabilities" design): stateless persona/router agent (Ray) + 5 sibling workflow skills**, restructured to match the real, on-disk structure of the installed Test Architecture Enterprise (TEA) module exactly — `bmad-tea`'s Murat (stateless persona/router: no sanctum, no First Breath, no memory) dispatching via a `customize.toml` menu to standalone workflow skills (`bmad-testarch-atdd`, `bmad-testarch-framework`, etc.), each with its own `SKILL.md` / `customize.toml` / `workflow.yaml` / `instructions.md` / `checklist.md` / step files, reading persona-level facts from a module-level `_bmad/rrd/config.yaml`.

**Why the change:** the original memory-agent design (sanctum, First Breath, `findings-log.md`/`calibration.md`) was a reasonable BMad pattern on its own terms, but the user explicitly decided, after inspecting the real installed TEA module, that **exact structural fidelity to TEA overrides the memory feature** for this module. Ray becomes exactly Murat's shape: persona + `resources/knowledge/*.md` + index CSV, just-in-time loaded, with a menu dispatching to 5 sibling workflow skills — one per former "capability." Each workflow skill inherits Ray's active persona (per `bmad-testarch-atdd`'s pattern: "continue to operate with your given name, identity ... merged with the details of this role description") rather than re-declaring it. Workflow skills use **plain sequential `steps/`** (not TEA's tri-modal Create/Edit/Validate `steps-c/steps-e/steps-v`) because a detection run has no natural "edit an existing finding" or "validate" mode distinct from "re-run" — this deviation is called out explicitly in each workflow's `instructions.md`.

### Memory Architecture — RETIRED

The sanctum (`INDEX.md`/`PERSONA.md`/`CREED.md`/`BOND.md`/`MEMORY.md`/`CAPABILITIES.md`, First Breath, `findings-log.md`/`calibration.md`) is **deliberately retired**, not merely unused. Ray no longer reads or writes cross-session memory; no capability re-flags-avoidance logic depends on it. This trades away cross-run "don't re-report a settled finding" behavior in exchange for exact TEA fidelity — an explicit, conscious tradeoff, not an oversight.

**Historical artifact, preserved on disk (not deleted):** the one real finding logged before retirement — a genuine high-confidence Detect Dependencies finding from analyzing this project's own CRM Playwright suite (shared live `crmPage` fixture across 5 spec files, one of them a delete-all test) — remains at `{project-root}/_bmad/memory/rrd-agent-radar/findings-log.md`, and its two real diff proposals remain at `proposals/tests__e2e__crm-workspace__settings.spec.ts.1.patch` and `proposals/playwright.config.ts.1.patch`. Its *content* is also migrated forward as a worked "Reference Example" in the new architecture's equivalent knowledge fragment: `rrd-agent-radar/resources/knowledge/detect-dependencies.md`, so the lesson isn't silently lost even though the memory contract that originally captured it no longer runs.

### Cross-Agent Patterns

N/A — one persona agent (Ray) plus 5 non-agent workflow skills that inherit its identity. No cross-agent memory sharing exists or is needed.

## Skills

All 6 skills are self-contained briefs, one BMad skill folder each, matching TEA's real file-for-file conventions.

### rrd-agent-radar (Ray) — stateless persona/router agent

**Type:** agent (stateless — no sanctum, no memory)

**Persona:** "Ray" — a forensic, evidence-first refactor detective. Terse, shows its work, never claims a fix without proposing a diff. Calm and precise, not alarmist — reports confidence levels rather than absolutes.

**Shape:** `SKILL.md` (Murat-style activation: resolve customization → adopt persona → persistent facts → load `_bmad/rrd/config.yaml` → greet → menu), `customize.toml` (icon, role/identity/communication_style/principles, `[[agent.menu]]` dispatching to the 5 workflow skills by code DD/DI/DT/DU/AA), `resources/rrd-index.csv` + `resources/knowledge/*.md` (6 fragments, just-in-time loaded).

**The Non-Negotiable (now a shared knowledge fragment, not repeated per workflow):** `resources/knowledge/evidence-and-diff-discipline.md` — every finding cites evidence, every fix is a diff in the target project's own `proposals/`, source is never edited directly, target project resolved via `list_projects`/`index_status` first.

**Relationships:** dispatches to all 5 workflow skills below via its menu; each of those inherits Ray's active persona rather than re-declaring it.

### rrd-detect-dependencies

**Type:** workflow skill (single-mode `steps/`)

**Outcome:** Finds test-to-test coupling and cascade risk — shared mutable fixtures/globals, order-dependence, shared live app/data state. Highest-impact family (47% of reference false-fails) — thoroughness-biased.

**Shape:** `SKILL.md` (persona-inherit + `steps/` activation), `customize.toml` (`[workflow]` override surface), `workflow.yaml` (`config_source: {project-root}/_bmad/rrd/config.yaml`), `instructions.md`, `checklist.md`, `steps/step-01-preflight-and-init.md` → `step-02-investigate.md` → `step-03-report-and-propose.md`.

### rrd-detect-instability

**Type:** workflow skill (single-mode `steps/`)

**Outcome:** Finds fragile selectors, fixed waits/timeouts, unhandled overlays/iframes/alerts; corroborates against real execution/rerun logs via `ingest_traces` when available (18% of reference false-fails).

### rrd-detect-data-issues

**Type:** workflow skill (single-mode `steps/`)

**Outcome:** Finds shared/non-reusable test data, missing setup/teardown, hardcoded users/URLs; correlates cross-run data collisions via logs when available (17% of reference false-fails).

### rrd-detect-duplication

**Type:** workflow skill (single-mode `steps/`)

**Outcome:** Finds redundant/near-duplicate code via structural graph similarity, with a similarity score and factor-out proposal (18% of reference false-fails).

### rrd-audit-all

**Type:** workflow skill (single-mode `steps/`, plus a `template:` file per `workflow.yaml`)

**Outcome:** Runs all four detectors in turn, pools findings, ranks by estimated false-fail impact, and renders one self-contained ranked HTML report grouped by root-cause family — the flagship deliverable. `workflow.yaml`'s `template: "./audit-report-template.html"` mirrors `bmad-testarch-atdd/workflow.yaml`'s `template: "./atdd-checklist-template.md"` pointer pattern; the HTML template itself is the content migrated forward from the old `references/audit-all.md`.

### rrd-setup — module setup skill (multi-skill module pattern)

**Type:** setup skill, scaffolded via `bmad-module-builder/scripts/scaffold-setup-skill.py`, replacing the old standalone self-registration design.

**Shape:** `SKILL.md`, `assets/module.yaml` (roster: agents lists only `rrd-agent-radar`; `variables:` adds `rrd_artifacts` with its own setup prompt), `assets/module-help.csv` (7 rows: setup + Ray + 5 workflows, `preceded-by`/`followed-by` columns matching the real installed convention), `scripts/{merge-config,merge-help-csv,cleanup-legacy}.py`.

**Judgment call flagged in `SKILL.md` itself:** the generic setup-skill template writes the newer unified `{project-root}/_bmad/config.yaml` format, while the 5 workflow skills' `workflow.yaml`s read `config_source: "{project-root}/_bmad/rrd/config.yaml"` (TEA's older module-level-file convention, required for structural fidelity per this module's locked decisions). `rrd-setup` resolves this by also writing a thin mirror file at `{project-root}/_bmad/rrd/config.yaml` after the unified merge succeeds, documented inline as a deliberate compatibility step, not a silent divergence.

**Relationships:** installs/configures the module; every workflow skill's `config_source` points at the file it writes.

---

## Configuration

Module-level config file `{project-root}/_bmad/rrd/config.yaml` (mirrored by `rrd-setup` from the unified `_bmad/config.yaml`, per the judgment call above), holding: `rrd_artifacts` (output-artifacts folder for findings summaries and audit HTML reports — never diff proposals, which always go to the target project's own `proposals/`), plus core vars `output_folder`, `user_name`, `communication_language`, `document_output_language`. It also depends on a project already being indexed in `codebase-memory-mcp` (checked at Init Responsibility inside each workflow's `step-01-preflight-and-init.md`, not at setup time, since the target project isn't known until first use).

## External Dependencies

- **`codebase-memory-mcp`** (MCP server, already installed in this environment) — required for all graph/log queries. Setup skill should verify the MCP tools are reachable and point the user to `index_repository`/`ingest_traces` docs if a target project isn't indexed yet.

## UI and Visualization

The "Audit All" capability's consolidated report is a strong HTML-report candidate: ranked findings by estimated false-fail impact, grouped by root-cause family, each with a link to its diff proposal. Not a full dashboard for v1 — a single self-contained HTML file per audit run is enough.

## Setup Extensions

`rrd-setup` creates `{project-root}/_bmad/rrd/` for the module-level config mirror at setup time. `proposals/` in each target project is still created lazily on first workflow run against that project, not at module setup time (the target project isn't known until first use).

## Integration

Multi-skill module (setup-skill approach, not standalone self-registration — reversed from the original design). Provides value on any project already indexed in `codebase-memory-mcp`, independent of any other BMad module. Designed to sit as a peer module inside a larger orchestrated "testing factory." The cross-module "findings-log.md as input contract" idea from the original design is no longer live (memory retired) — a future fix-execution/CI-gating module would instead consume each workflow's `{rrd_artifacts}/detect-*-{target_project}-{date}.md` findings summaries or the `rrd-audit-all` HTML report.

## Creative Use Cases

- Point Audit All at a fresh client's test suite during a diagnostic phase (mirrors the "231 faux-fails qualified" step from the reference engagement) to produce root-cause classification automatically instead of manually.
- Run Detect Dependencies before any large test-suite refactor as a pre-flight cascade-risk check.
- Feed `ingest_traces` real CI rerun logs so Detect Instability can correlate flaky failures with specific selectors/waits rather than relying on static analysis alone.

## Ideas Captured

- Originally scoped as "one big refactoring module" for an MCP-backed codebase graph + execution logs; narrowed via conversation to 4 named detectors matching a real reference engagement's root-cause taxonomy (Dependencies 47%, Instability 18%, Data 17%, Maintenance 18%).
- Considered building this as a bare Python prototype inside a Playwright/TS test repo (`BMAD_cursor`) — abandoned once discovered that a working generalist agent (`kb_agent.py`) already exists at `C:\Users\achaabane\Desktop\refactor_module\`, validated against a Java Selenium POM project with real proposal patches.
- User explicitly wants BMad-native structure: persona SKILL.md + `resources/knowledge/*.md` fragments + index CSV + `customize.toml`, styled after `bmad-tea`/Murat — not a standalone script.
- Considered 4-agent + orchestrator architecture; rejected in favor of single agent for simplicity (original decision).
- **Superseding decision (this restructure):** the single-agent-with-capabilities memory-agent design (sanctum, First Breath, `findings-log.md`/`calibration.md`) was **deliberately retired** in favor of exact structural fidelity to the real, installed Test Architecture Enterprise module — stateless persona/router (Ray) + 5 sibling workflow skills, matching `bmad-tea` + `bmad-testarch-*` file-for-file. This was an explicit user requirement, made after inspecting TEA's real on-disk structure, that TEA fidelity outranks the memory feature for this module. The one real finding and two real diff proposals produced under the old architecture were not lost: the finding's content lives on as a worked "Reference Example" in `rrd-agent-radar/resources/knowledge/detect-dependencies.md`, and the raw historical artifacts (`_bmad/memory/rrd-agent-radar/findings-log.md`, `proposals/tests__e2e__crm-workspace__settings.spec.ts.1.patch`, `proposals/playwright.config.ts.1.patch`) remain on disk, untouched, as a pre-restructure historical record.
- The current `bmad-module-builder` setup-skill scaffold template writes the newer unified `_bmad/config.yaml` convention and treats TEA-style per-module config files as "legacy" — a real friction point between the locked TEA-fidelity decision and the current tooling's own evolution, resolved via a mirror-write step in `rrd-setup/SKILL.md` (see Skills section). Worth a second look if the module-builder tooling itself changes its convention again.
- **Post-restructure fix #2:** all 5 workflow skills were also missing `workflow-plan.md` (present in every real `bmad-testarch-*` skill — a short design reference listing step order and outputs). Added to all 5. Checked the rest of the canonical TEA workflow-skill tree against a user-supplied reference diagram: `templates/` as a subfolder and `validation-report-*.md` turned out to be non-issues — real TEA skills keep template files flat at root (`atdd-checklist-template.md`, matching what we already had), and validation reports only exist because those skills have a Validate mode, which this module deliberately doesn't (see single-mode `steps/` decision above).
- **Post-restructure fix #1:** the first restructure pass left all 5 workflow skills reaching *outside their own folder* into `rrd-agent-radar/resources/knowledge/...` for shared knowledge fragments (e.g. `{skill-root}/../rrd-agent-radar/resources/knowledge/evidence-and-diff-discipline.md`) — this broke real TEA fidelity, since every genuine TEA workflow skill (`bmad-testarch-atdd`, etc.) carries its own local `resources/tea-index.csv` + `resources/knowledge/*.md` copy and is independently installable. Fixed by copying the relevant knowledge fragments into each of the 5 workflow skills' own `resources/knowledge/`, adding a per-skill `resources/rrd-index.csv` (only listing the fragments that skill actually uses), and rewriting every cross-folder reference in `steps/step-01-*.md`, `instructions.md`, and `checklist.md` to point locally (`./resources/knowledge/...`). Also cleaned up `rrd-agent-radar/resources/rrd-index.csv` itself, which had ~195 blank padded rows and unnecessary quoting from the original build — likely a bad CSV export, now a clean minimal CSV matching `tea-index.csv`'s real format.

## Build Roadmap

1. ✅ **rrd-agent-radar** restructured into a stateless persona/router agent (Ray), matching `bmad-tea`.
2. ✅ **rrd-detect-dependencies**, **rrd-detect-instability**, **rrd-detect-data-issues**, **rrd-detect-duplication**, **rrd-audit-all** built as sibling workflow skills with single-mode `steps/`, dispatched from Ray's menu.
3. ✅ **rrd-setup** scaffolded via `scaffold-setup-skill.py` (multi-skill module pattern), replacing the old standalone self-registration design; old standalone artifacts (`assets/module.yaml`, `assets/module-help.csv`, `assets/module-setup.md`, `scripts/merge-config.py`, `scripts/merge-help-csv.py` in `rrd-agent-radar/`) retired.
4. Next: first real run of the restructured module — activate Ray via `rrd-setup`, then exercise each of the 5 workflow skills against an indexed project.
