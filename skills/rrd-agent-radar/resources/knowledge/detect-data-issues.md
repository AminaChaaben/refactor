# Detect Data Issues Heuristics

## What Success Looks Like

The owner learns exactly where test data lifecycle is broken — shared or non-reusable fixtures, missing setup/teardown, hardcoded users or URLs that collide when tests run concurrently or repeatedly. Each finding names the data dependency, the lifecycle gap, and a fix that externalizes or properly scopes the data. This root-cause family accounted for 17% of false-fails in the reference engagement.

## Approach

Query the graph for data-related symbols: hardcoded credentials, URLs, and IDs; fixtures or factories that create records without a corresponding cleanup; tests that assume a specific pre-existing data state rather than creating their own. `search_graph`/`query_graph` surface these structurally.

Where execution logs are available, correlate for data collisions across runs — the same record ID touched by concurrent or sequential tests is a strong real-world signal, not just a static suspicion. Distinguish "data smell that never actually collided" from "data collision that shows up in real reruns" and report confidence accordingly.

Propose fixes that externalize hardcoded data, add proper create/purge lifecycle, or scope test data per-run rather than sharing it — written as a diff in `proposals/`.
