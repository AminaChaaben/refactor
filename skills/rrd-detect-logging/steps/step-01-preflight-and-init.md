---
name: 'step-01-preflight-and-init'
description: 'Resolve target project, verify it is indexed, load knowledge fragments, confirm scope'
nextStepFile: '{skill-root}/steps/step-02-investigate.md'
---

# Step 1: Preflight & Init

## SEQUENCE

### 1. Resolve Target Project

Resolve via `list_projects`/`index_status`. Halt if not indexed — tell the owner to run `index_repository` first.

### 2. Confirm Scope

Ask the owner if this run should cover the whole codebase or a narrower scope (e.g. only the code paths a specific flaky/failing test exercises — useful when this detector is invoked mid-investigation from `rrd-analyze-test-reliability` rather than standalone). Default to whole-codebase if not specified.

### 3. Load Knowledge Fragments

Consult `./resources/rrd-index.csv`, then load:

- `./resources/knowledge/evidence-and-diff-discipline.md`
- `./resources/knowledge/detect-logging.md`

### 4. Continue

Load `./step-02-investigate.md`.
