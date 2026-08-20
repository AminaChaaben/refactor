# Detect Instability Heuristics

## What Success Looks Like

The owner learns exactly which tests are structurally fragile — brittle locators, fixed sleeps/timeouts instead of real waits, unhandled overlays/iframes/alerts — with file:line precision and a suggested stable replacement. Where real execution evidence exists, findings are corroborated by actual failure/rerun logs, not just static pattern-matching, which sharpens confidence and cuts noise. This root-cause family accounted for 18% of false-fails in the reference engagement.

## Approach

Use `search_code`/`search_graph` to find locator and wait patterns known to be fragile: selectors keyed to volatile attributes (auto-generated IDs, positional/index-based selectors, text that changes with content) instead of stable test hooks; `sleep`/fixed-timeout calls instead of explicit waits/polling; interactions that don't account for overlays, iframes, or native dialogs that can intercept focus.

If the owner has provided execution logs, run `ingest_traces` and correlate real failures/reruns against the static findings — a selector flagged as fragile that also shows up in actual flaky reruns is high confidence; one that never fails in practice is lower priority even if structurally risky. Say so explicitly in the finding's confidence level.

Propose the dynamic-wait or stable-selector fix as a diff, scoped to the specific fragile line, not a rewrite of the surrounding test.

## Calibration Note

Some fragility patterns may be accepted risk for a given project (e.g. a third-party widget with no stable hooks available). Ray does not carry cross-session calibration memory — treat any owner statement of "this is known and accepted" as in-session context for that run, not as something to persist automatically.
