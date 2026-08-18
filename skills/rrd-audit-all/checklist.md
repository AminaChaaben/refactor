# Audit All Validation Checklist

## Prerequisites

- [ ] Target project resolved via `list_projects`/`index_status`
- [ ] Target project confirmed indexed
- [ ] Knowledge fragments loaded: `evidence-and-diff-discipline.md`, `detect-dependencies.md`, `detect-instability.md`, `detect-data-issues.md`, `detect-duplication.md`, `detect-complexity.md`, `detect-logging.md`, `detect-config.md`, `detect-locators.md`, `detect-layering.md`, `audit-all-report.md`

**Halt if missing:** target project not indexed.

## Scope

- [ ] Checked for a prior `refactor-radar-audit-*.html` report and git history before offering incremental mode
- [ ] If incremental mode was offered, the tradeoff was stated (faster, narrower) and the owner explicitly chose — never silently defaulted to incremental
- [ ] If incremental: `detect_changes` result's file list captured and used to scope every detector's `search_code`/`search_graph`/`query_graph` calls
- [ ] If incremental: Detect Dependencies and Detect Locators additionally checked immediate neighbors of changed files, not changed files in isolation
- [ ] Final report states which scope mode ran (full vs. incremental + file count)

## Detector Runs

- [ ] Detect Dependencies logic run against target project
- [ ] Detect Instability logic run against target project
- [ ] Detect Data Issues logic run against target project
- [ ] Detect Duplication logic run against target project
- [ ] Detect Complexity logic run against target project
- [ ] Detect Logging logic run against target project
- [ ] Detect Config logic run against target project
- [ ] Detect Locators logic run against target project
- [ ] Detect Layering logic run against target project
- [ ] All findings pooled into a single list

## Ranking and Grouping

- [ ] Each finding has an estimated false-fail impact (not detector order)
- [ ] Pooled list ranked by that estimate
- [ ] Ranked list grouped by root-cause family (Dependencies, Instability, Data, Duplication, Complexity, Logging, Config, Locators, Layering)
- [ ] A family with zero findings says so plainly rather than an empty section

## Findings and Proposals

- [ ] Every finding still carries its evidence citation
- [ ] Every finding links to its own diff proposal file
- [ ] Diff proposals written to the target project's `proposals/`, never a direct source edit

## Report

- [ ] Report is a single self-contained HTML file (inline CSS, no external assets, no build step)
- [ ] Report follows `audit-report-template.html` structure, adapted to actual finding count
- [ ] Report written to `{target_project_root}/proposals/refactor-radar-audit-{date}.html`
- [ ] Trend computed against `{rrd_artifacts}/audit-history/{target_project}.json` if a prior snapshot exists; explicitly reported as "first tracked run" if not — never a fabricated 0/0/0
- [ ] This run's snapshot appended to the history file (not overwritten), capped at 20 entries
- [ ] If a gap type recurred 3+ times across files within a family, the one-line `rrd-standards-audit` suggestion was surfaced — without invoking it

## Completion Criteria

- [ ] All nine detectors executed (or, in incremental mode, executed scoped to the changed-file set)
- [ ] Consolidated ranked report produced and written
- [ ] Summary to owner includes finding count per family, trend since last run, scope mode, and report/proposal paths
