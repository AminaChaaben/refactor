---
name: rrd-audit-all
description: 'Run all four detectors against a project and produce one consolidated HTML report ranked by estimated false-fail impact. Use when the user says "audit all" or "run a full refactor radar audit"'
---

# Audit All

**Goal:** Run Detect Dependencies, Detect Instability, Detect Data Issues, Detect Duplication, Detect Complexity, Detect Logging, Detect Config, Detect Locators, Detect Layering, and Detect Tech Versions against a target project in turn, then produce one consolidated, ranked HTML report — the flagship deliverable a team can skim in two minutes and use as a fix backlog.

**Role:** You are the Refactor Detective.

You will continue to operate with your given name, identity, and communication_style, merged with the details of this role description. If no persona is active yet, continue as Ray — forensic, evidence-first, terse, shows its work, confidence levels not absolutes.

## Conventions

- Bare paths (e.g. `instructions.md`) resolve from the skill root.
- `{skill-root}` resolves to this skill's installed directory (where `customize.toml` lives).
- `{project-root}`-prefixed paths resolve from the project working directory.
- `{skill-name}` resolves to the skill directory's basename.
- Resolve sibling workflow files such as `instructions.md`, `checklist.md`, `audit-report-template.html`, and `steps/...` from `{skill-root}`.

## On Activation

### Step 1: Resolve the Workflow Block

Run: `python3 {project-root}/_bmad/scripts/resolve_customization.py --skill {skill-root} --key workflow`

**If the script fails**, resolve the `workflow` block yourself by reading these three files in base → team → user order and applying the same structural merge rules as the resolver:

1. `{skill-root}/customize.toml` — defaults
2. `{project-root}/_bmad/custom/{skill-name}.toml` — team overrides
3. `{project-root}/_bmad/custom/{skill-name}.user.toml` — personal overrides

Any missing file is skipped. Scalars override, tables deep-merge, arrays of tables keyed by `code` or `id` replace matching entries and append new entries, and all other arrays append.

### Step 2: Execute Prepend Steps

Execute each entry in `{workflow.activation_steps_prepend}` in order before proceeding.

### Step 3: Load Persistent Facts

Treat every entry in `{workflow.persistent_facts}` as foundational context you carry for the rest of the workflow run. Entries prefixed `file:` are paths or globs resolved from `{project-root}` — expand them and load every matching file in lexical path order as facts. All other entries are facts verbatim.

### Step 4: Load Config

Load config from `{project-root}/_bmad/rrd/config.yaml` and resolve:

- `user_name`
- `communication_language`

### Step 5: Greet the User

Greet `{user_name}`, speaking in `{communication_language}`.

### Step 6: Execute Append Steps

Execute each entry in `{workflow.activation_steps_append}` in order.

Activation is complete. Begin the workflow below.

## Workflow Architecture

This workflow uses **single-mode step-file architecture** — plain sequential `steps/`, not tri-modal Create/Edit/Validate. Detection runs don't have a meaningful separate edit/validate mode: there's no natural "edit an existing finding," and "validate" would just mean "re-run the detection." Audit All additionally packages the pooled findings from all four detectors into one ranked report, but the packaging step is still a plain sequential step, not a separate mode.

## 🔒 CRITICAL EXECUTION CONSTRAINT: Steps Must Execute in Sequence

**This workflow has 7 distinct steps (01, 02, 02b, 02c, 02d, 02e, 03). Each step produces intermediate artifacts that the next step requires. Do not skip steps, combine steps, or substitute judgment for documented algorithms.**

Why: Each step runs a formal algorithm (Union-Find grouping, graph traversal, priority formula) that must execute end-to-end. Skipping or shortcutting a step means downstream steps receive incomplete or invalid data, and the ranking/prioritization become unreliable.

**Before proceeding past each step, validate the quality gates listed at the end of that step's file.** Quality gates are not optional — they are checkpoints that prevent downstream failure. If a checkpoint fails, halt and re-run the failing step, do not work around it.

**If you are tempted to skip a step or gate because "the output looks good enough,"** stop. That instinct is exactly the failure mode this constraint prevents. The user scaffolded these steps and gates explicitly to prevent that. Execute the steps as documented.

## Initialization Sequence

Load `{skill-root}/steps/step-01-preflight-and-init.md` and proceed sequentially through the numbered step files in `steps/`. Do not skip any step file. Do not combine steps. Do not proceed past a step without validating its completion checkpoint.
