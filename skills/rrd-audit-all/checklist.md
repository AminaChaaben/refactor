# Audit All Validation Checklist

## Prerequisites

- [ ] Target project resolved via `list_projects`/`index_status`
- [ ] Target project confirmed indexed
- [ ] Knowledge fragments loaded: `evidence-and-diff-discipline.md`, `detect-dependencies.md`, `detect-instability.md`, `detect-data-issues.md`, `detect-duplication.md`, `detect-complexity.md`, `detect-logging.md`, `audit-all-report.md`

**Halt if missing:** target project not indexed.

## Detector Runs

- [ ] Detect Dependencies logic run against target project
- [ ] Detect Instability logic run against target project
- [ ] Detect Data Issues logic run against target project
- [ ] Detect Duplication logic run against target project
- [ ] Detect Complexity logic run against target project
- [ ] Detect Logging logic run against target project
- [ ] All findings pooled into a single list

## Ranking and Grouping

- [ ] Each finding has an estimated false-fail impact (not detector order)
- [ ] Pooled list ranked by that estimate
- [ ] Ranked list grouped by root-cause family (Dependencies, Instability, Data, Duplication, Complexity, Logging)
- [ ] A family with zero findings says so plainly rather than an empty section

## Findings and Proposals

- [ ] Every finding still carries its evidence citation
- [ ] Every finding links to its own diff proposal file
- [ ] Diff proposals written to the target project's `proposals/`, never a direct source edit

## Report

- [ ] Report is a single self-contained HTML file (inline CSS, no external assets, no build step)
- [ ] Report follows `audit-report-template.html` structure, adapted to actual finding count
- [ ] Report written to `{target_project_root}/proposals/refactor-radar-audit-{date}.html`

## Completion Criteria

- [ ] All six detectors executed
- [ ] Consolidated ranked report produced and written
- [ ] Summary to owner includes finding count per family and report/proposal paths
