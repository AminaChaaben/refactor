---
name: 'step-01-preflight-and-init'
description: 'Resolve target project, verify it is indexed, load all detector knowledge fragments'
nextStepFile: '{skill-root}/steps/step-02-run-detectors.md'
---

# Step 1: Preflight & Init

## SEQUENCE

### 1. Resolve Target Project

- Resolve via `list_projects`/`index_status`. Halt if not indexed — tell the owner to run `index_repository` first.
- Ask the owner whether execution/rerun logs are available (used by Detect Instability and Detect Data Issues).

### 2. Load Knowledge Fragments

Consult `./resources/rrd-index.csv`, then load, in order, from `./resources/knowledge/`:

- `evidence-and-diff-discipline.md`
- `detect-dependencies.md`
- `detect-instability.md`
- `detect-data-issues.md`
- `detect-duplication.md`
- `detect-complexity.md`
- `detect-logging.md`
- `audit-all-report.md`

### 3. Continue

Load `./step-02-run-detectors.md`.
