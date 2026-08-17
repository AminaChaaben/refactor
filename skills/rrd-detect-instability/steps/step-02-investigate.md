---
name: 'step-02-investigate'
description: 'Find fragile patterns and correlate against logs if available'
nextStepFile: '{skill-root}/steps/step-03-report-and-propose.md'
---

# Step 2: Investigate

## SEQUENCE

### 1. Static Pattern Search

Use `search_code`/`search_graph` to find:

- Selectors keyed to volatile attributes (auto-generated IDs, positional/index selectors, content-derived text)
- `sleep`/fixed-timeout calls instead of explicit waits/polling
- Interactions that don't account for overlays, iframes, or native dialogs

### 2. Log Correlation (If Available)

If the owner provided execution logs, run `ingest_traces` and cross-check each static candidate against real failure/rerun evidence. Mark corroborated findings high confidence; uncorroborated but structurally risky findings lower priority — say so explicitly.

### 3. Continue

Load `./step-03-report-and-propose.md`.
