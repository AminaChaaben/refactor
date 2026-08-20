<!-- Powered by BMAD-CORE™ -->

# Audit All

---

## Overview

Runs Detect Dependencies, Detect Instability, Detect Data Issues, Detect Duplication, Detect Complexity, and Detect Logging against the target project in turn, pools every finding, ranks the pooled list by estimated false-fail impact, and produces one self-contained ranked HTML report grouped by root-cause family — the flagship deliverable a team can skim in two minutes and use as a fix backlog.

This workflow applies the shared Investigation Contract, carried locally in this skill's own `./resources/knowledge/evidence-and-diff-discipline.md` (the same fragment Ray's persona references — kept in sync across skills, not a cross-folder pointer): every finding cites evidence, every fix is a diff in the target project's `proposals/`, source is never edited directly. Audit All changes the packaging of findings, not the evidence discipline.

---

## WORKFLOW ARCHITECTURE

This workflow uses **single-mode step-file architecture**, not the tri-modal Create/Edit/Validate pattern used elsewhere in BMad — a detection/audit run doesn't have a meaningful separate edit/validate mode, so it uses plain sequential steps instead.

---

## INITIALIZATION SEQUENCE

### 1. Configuration Loading

From `workflow.yaml`, resolve: `config_source`, `output_folder`, `rrd_artifacts`, `user_name`, `communication_language`, `document_output_language`, `date`, `template`.

### 2. First Step

Load, read completely, and execute:
`{skill-root}/steps/step-01-preflight-and-init.md`
