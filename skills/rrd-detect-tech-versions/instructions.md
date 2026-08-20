<!-- Powered by BMAD-CORE™ -->

# Detect Tech Versions

---

## Overview

Finds version-management problems in **Selenium and Playwright test-automation stacks** — Java runtime, Selenium, Playwright, JUnit/TestNG, Maven, and their npm/TS equivalents — declared in `pom.xml`, `build.gradle`/`build.gradle.kts`, and `package.json`.

This detector's primary, fully-reliable findings are **structural discipline**, not "is there a newer version out there": unpinned versions (`LATEST`, `RELEASE`, open ranges, unexplained `-SNAPSHOT`), the same artifact's version duplicated across a parent POM/BOM/`dependencyManagement`/local `<version>` tag instead of a single source of truth, and known CVEs against the currently-declared version (curated, not live-queried). All of these are verifiable from the repo alone — no external call, no flakiness, no risk of a wrong answer.

"Is a newer version available" is reported too, but only ever as a **best-effort, explicitly-unverified pointer** — cited to one source, dated, and labeled for the owner to confirm before acting on it. It is never asserted as a fact and never drives severity or priority on its own: live version-registry lookups have proven unreliable in practice (blocked endpoints, wrong query modes, disagreeing sources, pre-release contamination) and this skill does not overclaim confidence it can't back up. It also flags breaking framework migrations like JUnit 4→5 or Selenium 3→4 (high), and toolchain-incompatible runtime bumps (e.g. a Java version bump that breaks a load-time-weaving agent already in the project — medium-risk, not safe-by-default).

This workflow applies the shared Investigation Contract, carried locally in this skill's own `./resources/knowledge/evidence-and-diff-discipline.md` (the same fragment Ray's persona references — kept in sync across skills, not a cross-folder pointer): every finding cites evidence, every fix is a diff in the target project's `proposals/`, source is never edited directly.

---

## WORKFLOW ARCHITECTURE

This workflow uses **single-mode step-file architecture**, not the tri-modal Create/Edit/Validate pattern used elsewhere in BMad — a detection run doesn't have a meaningful separate edit/validate mode, so it uses plain sequential steps instead.

---

## INITIALIZATION SEQUENCE

### 1. Configuration Loading

From `workflow.yaml`, resolve: `config_source`, `output_folder`, `rrd_artifacts`, `user_name`, `communication_language`, `document_output_language`, `date`.

### 2. First Step

Load, read completely, and execute:
`{skill-root}/steps/step-01-preflight-and-init.md`
