---
name: 'step-01-preflight-and-init'
description: 'Resolve target project, verify it is indexed, load knowledge fragments'
nextStepFile: '{skill-root}/steps/step-02-investigate.md'
---

# Step 1: Preflight & Init

## STEP GOAL

Resolve which project to investigate, confirm it is indexed in `codebase-memory-mcp`, and load the knowledge fragments this detector depends on.

## MANDATORY EXECUTION RULES

- 📖 Read the entire step file before acting
- ✅ Speak in `{communication_language}`
- 🚫 Halt if the target project is not indexed

## SEQUENCE

### 1. Resolve Target Project

- If the user named a project, use it. Otherwise call `mcp__codebase-memory-mcp__list_projects` and ask which one to investigate.
- Call `mcp__codebase-memory-mcp__index_status` for the resolved project.
- **If not indexed:** halt and tell the owner to run `index_repository` first. Do not guess at ungraphed code.
- Store the resolved project as `{target_project}`.

### 2. Load Knowledge Fragments

Consult `./resources/rrd-index.csv`, then load in order:

- `./resources/knowledge/evidence-and-diff-discipline.md` (binding Investigation Contract — cite evidence, diff-only, resolve target first)
- `./resources/knowledge/detect-dependencies.md` (coupling heuristics and the reference example)

### 3. Report and Continue

Tell the owner: target project resolved, indexed, ready to investigate. Then load `./step-02-investigate.md`.
