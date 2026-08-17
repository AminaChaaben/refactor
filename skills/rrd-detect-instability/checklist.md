# Detect Instability Validation Checklist

## Prerequisites

- [ ] Target project resolved via `list_projects`/`index_status`
- [ ] Target project confirmed indexed
- [ ] Knowledge fragment loaded: `evidence-and-diff-discipline.md`
- [ ] Knowledge fragment loaded: `detect-instability.md`

**Halt if missing:** target project not indexed.

## Investigation

- [ ] `search_code`/`search_graph` run for volatile selectors (auto-generated IDs, positional/index selectors, content-based text)
- [ ] Every `search_code` call used a correct filename glob for `file_pattern` (not a path glob) — checked `total_grep_matches` before concluding zero results
- [ ] If `total_grep_matches` > 0, confirmed the expected file wasn't truncated by `limit` before reporting a non-finding
- [ ] Fixed `sleep`/timeout patterns identified instead of explicit waits/polling
- [ ] Unhandled overlays/iframes/native dialogs identified
- [ ] If logs provided: `ingest_traces` run and static findings correlated against real failure/rerun evidence
- [ ] Confidence level distinguishes "structurally risky, never fails in practice" from "confirmed by real reruns"

## Findings and Proposals

- [ ] Every finding cites file:line and the query/log evidence
- [ ] Every fix proposes a dynamic-wait or stable-selector replacement, scoped to the fragile line only
- [ ] Every fix is written as a diff to the target project's `proposals/`

## Completion Criteria

- [ ] Findings summary written to `{rrd_artifacts}/detect-instability-{target_project}-{date}.md`
- [ ] All diff proposals written to the target project's `proposals/`, listed in the summary
