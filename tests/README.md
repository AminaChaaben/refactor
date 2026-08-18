# Salesforce Lightning E2E tests (BMAD TEA)

Playwright suite for the **Time & Expense Entry** journey against a Talan Salesforce Lightning instance.

## Setup

```bash
npm install
npx playwright install chromium
```

Authentication uses `storageState.json` with pre-authenticated Salesforce session cookies.
No manual login required - tests use existing Azure AD authentication.

## Run

```bash
npx playwright test
npx playwright test --headed
npx playwright test time-expense-entry.spec.ts
```

## Layout

| Path | Purpose |
|------|---------|
| `e2e/features/*.feature` | Gherkin source of truth (traceability) |
| `e2e/*.spec.ts` | Executable tests with `test.step` mirroring Gherkin |
| `support/page-objects/` | Page objects (selector hierarchy: testid → role → text) |

## BMAD conventions applied

- **Selector resilience**: `getByRole`, `getByLabel`, optional `data-testid` fallbacks
- **No hard waits**: web-first `expect` assertions only
- **P0** priority on critical admin flow
- **Secrets**: credentials from `.env`, not committed

## If the demo site shows "Application Error"

The public demo at `https://o3.openmrs.org` may be down intermittently. Point `BASE_URL` in `.env` to a working instance before running tests.

## Knowledge references (local)

BMAD TEA fragments: `fixture-architecture`, `selector-resilience`, `network-first`, `test-quality`, `playwright-config`.
