<!-- Powered by BMAD-CORE™ -->

# Detect Tech Versions

**Version:** 1.0 (Step-File Architecture)

---

## Overview

Finds outdated technology and framework versions — Java, JUnit, Spring, Selenium, Maven, and npm dependencies declared in `pom.xml`, `build.gradle`/`build.gradle.kts`, and `package.json` — and proposes modernization upgrades. Flags known CVEs (critical), breaking framework migrations like JUnit 4→5 or Spring 5→6 (high), and safe minor/patch upgrades (medium/low). This axis had zero dedicated detector coverage before this skill: version drift accumulates silently and is usually invisible until a CVE scan or a migration deadline forces the issue.

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
