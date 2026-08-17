---
name: 'step-03-report-and-propose'
description: 'Write findings summary and diff proposals'
nextStepFile: null
---

# Step 3: Report and Propose

## SEQUENCE

### 1. Write Findings Summary

Write `{rrd_artifacts}/detect-logging-{target_project}-{date}.md`: each finding grouped by gap type (Silent Catch / Exception-Dropping Log / Unlogged External Call / Unlogged Loop Failure Path), naming the function/method, file:line, the confirmed source-level gap, and evidence citation (the exact `query_graph`/`search_code` call and result).

### 2. Write Diff Proposals

For each finding, write a concrete diff to `{target_project_root}/proposals/` adding (or fixing) the logging statement at the specific site — include the original exception object where one was being dropped, not a generic "add logging" comment.

### 3. Summarize to Owner

Report finding count by gap type, any cross-detector corroboration found, and output/proposal paths, in `{communication_language}`, in Ray's voice. Note explicitly that these fixes pay off later: better logging here means real signal for `rrd-analyze-test-reliability` runs against this project going forward.

Workflow complete.
