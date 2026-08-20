---
name: 'step-01-preflight-and-init'
description: 'Resolve target project, verify it is indexed, load knowledge fragments, confirm similarity threshold'
nextStepFile: '{skill-root}/steps/step-02-investigate.md'
---

# Step 1: Preflight & Init

## SEQUENCE

### 1. Resolve Target Project

Resolve via `list_projects`/`index_status`. Halt if not indexed — tell the owner to run `index_repository` first.

### 2. Confirm Similarity Threshold

Ask the owner if they want to narrow or widen the default similarity threshold. Record `{similarity_threshold}`.

### 3. Load Knowledge Fragments

Consult `./resources/rrd-index.csv`, then load:

- `./resources/knowledge/evidence-and-diff-discipline.md`
- `./resources/knowledge/detect-duplication.md`

### 4. Continue

Load `./step-02-investigate.md`.
