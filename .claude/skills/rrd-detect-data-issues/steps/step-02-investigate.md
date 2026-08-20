---
name: 'step-02-investigate'
description: 'Find data lifecycle gaps and correlate collisions across runs'
nextStepFile: '{skill-root}/steps/step-03-report-and-propose.md'
---

# Step 2: Investigate

## SEQUENCE

### 1. Structural Search

Use `search_graph`/`query_graph` for: hardcoded credentials/URLs/IDs; fixtures/factories creating records without matching cleanup; tests assuming pre-existing data rather than creating their own.

### 2. Cross-Run Correlation (If Logs Available)

If execution logs are available, read them directly (`Read`/`Grep`, matching the log's real format) and correlate for the same record ID touched by concurrent or sequential tests — a real collision, not just a static suspicion. `ingest_traces` does not do this (see `detect-data-issues.md`'s Tool Note; it's currently a no-op on the server).

### 3. Continue

Load `./step-03-report-and-propose.md`.
