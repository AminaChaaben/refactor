---
name: 'step-03-report-and-propose'
description: 'Write findings summary and diff proposals for modernization upgrades'
nextStepFile: null
---

# Step 3: Report and Propose

## SEQUENCE

### 1. Write Findings Summary

Write `{rrd_artifacts}/detect-tech-versions-{target_project}-{date}.md`: for each finding — technology name, current version, latest safe version, severity (CRITICAL/HIGH/MEDIUM/LOW), CVE ID if applicable, breaking/safe classification, impact (file count using it), effort estimate, and priority rank. State the skipped-artifact count (from step-02 §3) once at the top, so the report is explicit about being a scoped pass over a curated tech list, not every dependency.

### 2. Write Diff Proposals

For each finding, write a diff to `{target_project_root}/proposals/`:

- **Manifest-only upgrade** (safe, no breaking change): bump the version string in `pom.xml`/`build.gradle`/`package.json` directly.
- **CVE fix**: bump to the minimum patched version cited in `./resources/version-database.csv`'s `cve_fixed_in` column — not necessarily the latest version — to keep the fix minimal and reviewable, per the same "smallest safe diff" principle as every other detector.
- **Breaking migration (e.g. JUnit 4→5)**: propose the manifest version bump plus, where the migration is mechanical (e.g. `@Before`→`@BeforeEach` renames), a representative diff for the first 1-2 affected files with a note that the same rename applies across the full impacted file list (do not attempt to generate a diff per file for large migrations — cite the file count and pattern instead, and let `rrd-apply-and-verify` or the owner extend it).
- **Mixed-version conflict** (same framework at two versions via transitive deps): propose either an explicit exclusion in the manifest or an upgrade of the outdated direct dependency, whichever resolves the conflict with a smaller diff.

### 3. Summarize to Owner

Report finding count (with breakdown by severity), the skipped-artifact count, and output/proposal paths, in `{communication_language}`, in Ray's voice. Lead with any CRITICAL (CVE) findings first regardless of overall rank order — a security fix should never be buried under a lower-severity item that happened to score higher on impact alone; state explicitly if a CVE finding is not rank #1 and why (e.g. very low usage count reduced its computed priority, but severity still warrants leading with it).

Workflow complete.
