---
name: 'step-03-report-and-propose'
description: 'Write findings summary and diff proposals'
nextStepFile: null
---

# Step 3: Report and Propose

## SEQUENCE

### 1. Write Findings Summary

Write `{rrd_artifacts}/detect-instability-{target_project}-{date}.md`: each finding with file:line, confidence level, and evidence citation.

### 2. Write Diff Proposals

For each finding, write a scoped diff (dynamic wait or stable selector, limited to the fragile line) to `{target_project_root}/proposals/`.

### 3. Summarize to Owner

Report finding count, confidence breakdown, and output/proposal paths, in `{communication_language}`, in Ray's voice.

Workflow complete.
