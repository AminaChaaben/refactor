/**
 * Feature: CRM Deals Workspace — Deals tab
 *
 * Scenarios covered:
 *   @p0 @smoke  View existing deals on load
 *   @p0         Add a new deal and verify it appears in the table
 *   @p1         Advance a deal stage and verify async metric update
 *   @p1         Event log appends on each deal action
 *
 * Testing challenges addressed:
 *   - Pipeline metric update is a delayed side effect (setTimeout 400ms).
 *     Test waits 600ms before switching to Pipeline tab, ensuring the JS
 *     callback fires before the tab's own synchronous updatePipelineMetrics().
 *   - Event log count is asserted as an exact delta from a zero baseline
 *     (fresh page, no prior actions) to avoid coupling to future seed data.
 */

import { test, expect, switchTab, getNotifCount } from './crm.fixtures';

test.describe('Deals tab @crm', () => {
  test.use({ storageState: undefined });

  // ─── @p0 @smoke ────────────────────────────────────────────────────────────
  test('[P0][smoke] View existing deals on load', async ({ crmPage: page }) => {
    await test.step('Background: session badge is visible', async () => {
      await expect(page.locator('#session-badge')).toHaveText('Session active');
    });

    await test.step('Deals table renders at least 1 row', async () => {
      const rows = page.locator('#deals-body tr[data-deal-id]');
      await expect(rows).not.toHaveCount(0);
    });

    await test.step('Each row contains stage badge, value, owner, and progress bar', async () => {
      const firstRow = page.locator('#deals-body tr[data-deal-id]').first();
      // Stage badge — a span with one of the badge classes
      await expect(firstRow.locator('span.badge')).toBeVisible();
      // Value — cell text matches $ amount pattern
      await expect(firstRow.locator('td').nth(2)).toContainText('$');
      // Owner — fourth data cell is non-empty
      const ownerText = await firstRow.locator('td').nth(3).textContent();
      expect(ownerText?.trim().length).toBeGreaterThan(0);
      // Progress bar — progress-fill div is present and has a width set
      const progressFill = firstRow.locator('.progress-fill');
      await expect(progressFill).toBeVisible();
      const width = await progressFill.evaluate((el: HTMLElement) => el.style.width);
      expect(width).toMatch(/^\d+(\.\d+)?%$/);
    });
  });

  // ─── @p0 ──────────────────────────────────────────────────────────────────
  test('[P0] Add a new deal and verify it appears in the table', async ({ crmPage: page }) => {
    const initialCount = await page.locator('#deals-body tr[data-deal-id]').count();
    const initialNotifCount = await getNotifCount(page);

    await test.step('Click "New deal"', async () => {
      await page.getByRole('button', { name: 'New deal' }).click();
    });

    await test.step('New row appears in the deals table', async () => {
      await expect(page.locator('#deals-body tr[data-deal-id]')).toHaveCount(initialCount + 1);
    });

    await test.step('Event log contains "Deal created:"', async () => {
      const logLines = page.locator('#deal-event-log .log-line');
      await expect(logLines.last()).toContainText('Deal created:');
    });

    await test.step('Notification count increases by 1', async () => {
      const afterCount = await getNotifCount(page);
      expect(afterCount).toBe(initialNotifCount + 1);
    });
  });

  // ─── @p1 ──────────────────────────────────────────────────────────────────
  test('[P1] Advance a deal stage and verify async metric update', async ({ crmPage: page }) => {
    // Record initial Pipeline avg before any action
    await switchTab(page, 'Pipeline');
    const initialAvgText = await page.locator('#pipeline-avg').textContent();
    const initialAvg = parseInt(initialAvgText ?? '0', 10);

    await switchTab(page, 'Deals');

    const firstRow = page.locator('#deals-body tr[data-deal-id]').first();
    const stageBefore = await firstRow.locator('span.badge').textContent();

    await test.step('Click Advance on the first deal row', async () => {
      await firstRow.getByRole('button', { name: 'Advance' }).click();
    });

    await test.step('Stage badge changes to the next stage', async () => {
      const stageAfter = await firstRow.locator('span.badge').textContent();
      expect(stageAfter).not.toBe(stageBefore);
    });

    await test.step('After 600ms delay Pipeline avg progress is updated', async () => {
      // advanceStage() schedules updatePipelineMetrics() with a 400ms setTimeout.
      // Explicit wait ensures the callback fires before we assert.
      await page.waitForTimeout(600);
      await switchTab(page, 'Pipeline');

      const afterAvgText = await page.locator('#pipeline-avg').textContent();
      const afterAvg = parseInt(afterAvgText ?? '0', 10);
      expect(afterAvg).toBeGreaterThan(initialAvg);
    });
  });

  // ─── @p1 ──────────────────────────────────────────────────────────────────
  test('[P1] Event log appends on each deal action', async ({ crmPage: page }) => {
    // Verify log is empty on a fresh load
    const initialLogCount = await page.locator('#deal-event-log .log-line').count();

    await test.step('Click "New deal" twice', async () => {
      const newDealBtn = page.getByRole('button', { name: 'New deal' });
      await newDealBtn.click();
      await newDealBtn.click();
    });

    await test.step('Click Advance on the first deal row', async () => {
      await page.locator('#deals-body tr[data-deal-id]').first()
        .getByRole('button', { name: 'Advance' }).click();
    });

    await test.step('Event log contains exactly 3 new entries', async () => {
      await expect(page.locator('#deal-event-log .log-line')).toHaveCount(initialLogCount + 3);
    });

    await test.step('Last entry matches "Stage advanced"', async () => {
      await expect(page.locator('#deal-event-log .log-line').last()).toContainText('Stage advanced');
    });
  });
});
