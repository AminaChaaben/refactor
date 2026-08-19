---
name: 'step-01-preflight-and-init'
description: 'Resolve target project, verify it is indexed, load knowledge fragments'
nextStepFile: '{skill-root}/steps/step-02-investigate.md'
---

# Step 1: Preflight & Init

## SEQUENCE

### 1. Resolve Target Project

Resolve via `list_projects`/`index_status`. Halt if not indexed — tell the owner to run `index_repository` first.

### 2. Load Knowledge Fragments

Consult `./resources/rrd-index.csv`, then load:

- `./resources/knowledge/evidence-and-diff-discipline.md`
- `./resources/knowledge/detect-tech-versions.md`
- `./resources/version-database.csv` (reference data, not prose — load as a table, not a fragment)

### 3. Continue

Load `./step-02-investigate.md`.
