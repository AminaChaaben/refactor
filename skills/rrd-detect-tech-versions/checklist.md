# Detect Tech Versions Validation Checklist

## Prerequisites

- [ ] Target project resolved via `list_projects`/`index_status`
- [ ] Target project confirmed indexed
- [ ] Knowledge fragment loaded: `evidence-and-diff-discipline.md`
- [ ] Knowledge fragment loaded: `detect-tech-versions.md`
- [ ] Version database loaded: `resources/version-database.csv`

**Halt if missing:** target project not indexed.

## Investigation

- [ ] All manifests found (`pom.xml`, `build.gradle`/`build.gradle.kts`, `package.json`) — not just the first match
- [ ] Every dependency's declared version extracted, noting inherited-vs-local versions where relevant
- [ ] Every extracted version checked against `version-database.csv`; skipped (not-in-database) artifacts counted, not silently dropped from the final report's stated scope
- [ ] Every outdated match classified as BREAKING or SAFE using the hardcoded migration-rules table, not assumed
- [ ] Usage/impact count computed via `search_code`/`search_graph`, not estimated
- [ ] Priority computed with the documented formula (severity × impact / effort × breaking_risk), not eyeballed

## Findings and Proposals

- [ ] Every finding names current version, latest safe version, severity, and (if applicable) CVE ID
- [ ] Every finding cites its evidence (manifest location + usage search)
- [ ] CVE fixes propose the minimum patched version, not necessarily the latest
- [ ] Breaking migrations are flagged as such, with a representative diff (not a diff attempted per file for large migrations)
- [ ] Every fix written as a diff to the target project's `proposals/`
- [ ] CRITICAL (CVE) findings are surfaced first in the summary regardless of computed rank order

## Completion Criteria

- [ ] Findings summary written to `{rrd_artifacts}/detect-tech-versions-{target_project}-{date}.md`
- [ ] All diff proposals written to the target project's `proposals/`, listed in the summary
- [ ] Skipped-artifact count stated once, up front
