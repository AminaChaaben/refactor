---
name: 'create'
description: 'Run all 10 detectors in sequence, generate raw findings. Output: findings.json (user can stop here).'
nextMode: 'edit'
---

# Create: Run All Detectors

## MODE GOAL

Run all 10 structural detectors (Dependencies, Instability, Data Issues, Duplication, Complexity, Logging, Config, Locators, Layering, Tech Versions) in sequence against the target project and collect their findings into a single raw findings JSON file.

User can stop here and work with raw findings without waiting for opportunity grouping/ranking.

## SEQUENCE

### 1. Preflight & Init (from step-01)

- Resolve target project via `list_projects`/`index_status`, halt if not indexed
- Load knowledge fragments from `resources/`
- Verify output directory exists

### 2. Run All 10 Detectors (from step-02)

Run each detector in sequence via its own skill or step-file. Maintain a **detector run ledger** as you go — one entry per detector, status one of `completed` / `failed` / `skipped`, updated immediately after each detector finishes (or errors out), not reconstructed afterward from memory:

```
1. Detect Dependencies (DD)
2. Detect Instability (DI)
3. Detect Data Issues (DT)
4. Detect Duplication (DU)
5. Detect Complexity (DC)
6. Detect Logging (DL)
7. Detect Config (DF)
8. Detect Locators (DO)
9. Detect Layering (DY)
10. Detect Tech Versions (DV)
```

Each detector:
- Queries the codebase graph for its specific finding type
- Produces findings with: id, detector_family, file, line, title, description, evidence, confidence, affected_target, root_cause_signals
- No filtering, no grouping — raw output only

If a detector errors, times out, or returns no result at all (as opposed to a genuine "0 findings" result), mark it `failed` in the ledger with the reason — **do not silently continue as if it produced zero findings.** A detector that never ran and a detector that ran and found nothing are not the same thing, and only the ledger tells them apart.

### 2b. Detector Completion Gate (Hard Stop)

Before pooling anything, check the ledger: all 10 entries must be `completed`.

- **If any entry is `failed` or `skipped`**, halt here. Report to the owner exactly which detector(s) did not complete and why (from the recorded reason), and ask whether to retry just that detector, continue with a partial audit (explicitly labeled as covering N of 10 families), or abort the run entirely. Never proceed to pooling with a gap in the ledger silently absorbed as "0 findings."
- **If all 10 are `completed`**, proceed to step 3.
- Carry the ledger forward into the final report (step 7 of Validate mode) so the owner can see, at a glance, that this was a genuine 10/10 run — or exactly which family was skipped/failed and why, if not.

### 3. Pool All Findings

Collect all 10 detectors' outputs (Finding[]) into a single array and write:

```bash
{project-root}/.refactor-radar-work/findings.json
```

Each finding includes its origin detector (detector_family) so Edit mode can trace it back.

### 4. Report Raw Coverage

Before stopping, log:
- Detector run ledger: which of the 10 completed, with any failed/skipped entries and their reasons called out explicitly
- Total findings collected: N across all completed detectors
- Breakdown by detector: DD=X, DI=Y, DT=Z, ... DV=W
- Affected targets (unique files/classes)

**User can stop here.** Remaining modes (Edit, Validate) are optional. If the user stops, they have the raw detector findings to work with — no ranking applied yet, 40-60% faster than full audit.

### 5. Continue to Edit (Optional)

If the user confirms, proceed to the Edit mode. Otherwise, end.
