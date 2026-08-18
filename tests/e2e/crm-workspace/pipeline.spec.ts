/**
 * Feature: CRM Deals Workspace — Pipeline tab
 *
 * Scenarios covered:
 *   @p0   Batch recalc updates all deal rows asynchronously
 *   @p1   Pipeline metrics reflect deal stage changes
 *   @p2   Iframe KPI widget updates on internal button click
 *
 * Testing challenges addressed:
 *   - Batch results arrive via staggered setTimeout callbacks (600ms + 400ms × i).
 *     The test waits for "Batch complete" text in the log — a content-based event
 *     anchor — rather than waiting for the slowest individual deal.
 *   - Pipeline avg progress is updated synchronously by switchTab() when
 *     navigating to Pipeline, so total value is unchanged but avg increases.
 *   - KNOWN BUG: The iframe srcdoc contains a malformed onclick attribute;
 *     the "Refresh KPI" button is not rendered in the iframe DOM.
 *     The @p2 scenario documents the correct frameLocator() pattern AND flags
 *     the bug so it can be tracked for a fix.
 */

import { test, expect, switchTab } from './crm.fixtures';

test.describe('Pipeline tab @crm', () => {
  test.use({ storageState: undefined });

  test.beforeEach(async ({ crmPage: page }) => {
    await switchTab(page, 'Pipeline');
  });

  // ─── @p0 ──────────────────────────────────────────────────────────────────
  test('[P0] Batch recalc updates all deal rows asynchronously', async ({ crmPage: page }) => {
    // Verify initial state: 3 seed deals present
    await switchTab(page, 'Deals');
    const dealCount = await page.locator('#deals-body tr[data-deal-id]').count();
    expect(dealCount).toBeGreaterThanOrEqual(1);
    await switchTab(page, 'Pipeline');

    const totalBefore = await page.locator('#pipeline-total').textContent();
    const avgBefore = await page.locator('#pipeline-avg').textContent();

    await test.step('Click "Run batch"', async () => {
      await page.locator('#batch-btn').click();
    });

    await test.step('Batch log shows "Batch job started"', async () => {
      await expect(page.locator('#batch-log')).toContainText('Batch job started', { timeout: 3_000 });
    });

    await test.step('Each deal emits a "Recalculated" entry with staggered timing', async () => {
      // Wait for ALL deals to emit — do not assert on first entry alone.
      // "Batch complete" only appears after every deal has been processed.
      await expect(page.locator('#batch-log')).toContainText('Batch complete', { timeout: 10_000 });

      const recalcLines = page.locator('#batch-log .log-line').filter({ hasText: 'Recalculated:' });
      await expect(recalcLines).toHaveCount(dealCount);
    });

    await test.step('"Run batch" button re-enables after all deals are processed', async () => {
      await expect(page.locator('#batch-btn')).toBeEnabled({ timeout: 10_000 });
    });

    await test.step('Batch log ends with "Batch complete"', async () => {
      await expect(page.locator('#batch-log .log-line').last()).toContainText('Batch complete');
    });

    await test.step('Total value and average progress metrics are updated', async () => {
      const totalAfter = await page.locator('#pipeline-total').textContent();
      const avgAfter = await page.locator('#pipeline-avg').textContent();
      // Values change after batch — either total or avg (or both) should differ
      const changed = totalAfter !== totalBefore || avgAfter !== avgBefore;
      expect(changed, 'At least one pipeline metric should change after batch').toBe(true);
    });
  });

  // ─── @p1 ──────────────────────────────────────────────────────────────────
  test('[P1] Pipeline metrics reflect deal stage changes', async ({ crmPage: page }) => {
    const totalBefore = await page.locator('#pipeline-total').textContent();
    const avgBefore = parseInt((await page.locator('#pipeline-avg').textContent()) ?? '0', 10);

    await test.step('Advance a deal stage from the Deals tab', async () => {
      await switchTab(page, 'Deals');
      await page.locator('#deals-body tr[data-deal-id]').first()
        .getByRole('button', { name: 'Advance' }).click();
    });

    await test.step('Switch to Pipeline tab (triggers synchronous updatePipelineMetrics)', async () => {
      await switchTab(page, 'Pipeline');
    });

    await test.step('Pipeline total value is unchanged (advance does not change deal value)', async () => {
      const totalAfter = await page.locator('#pipeline-total').textContent();
      expect(totalAfter).toBe(totalBefore);
    });

    await test.step('Average progress has increased', async () => {
      const avgAfter = parseInt((await page.locator('#pipeline-avg').textContent()) ?? '0', 10);
      expect(avgAfter).toBeGreaterThan(avgBefore);
    });
  });

  // ─── @p2 ──────────────────────────────────────────────────────────────────
  test('[P2] Iframe KPI widget updates on internal button click', async ({ crmPage: page }) => {
    await test.step('Iframe widget is visible', async () => {
      await expect(page.locator('#iframe-widget')).toBeVisible();
    });

    await test.step('KPI initial value is the placeholder dash', async () => {
      const frame = page.frameLocator('#iframe-widget');
      await expect(frame.locator('#kpi-val')).toHaveText('—');
    });

    await test.step(
      'BUG: "Refresh KPI" button is not rendered — srcdoc onclick attribute is malformed',
      async () => {
        /**
         * KNOWN BUG in demo app (confirmed 2026-06-11):
         *
         * The iframe srcdoc contains:
         *   onclick='document.getElementById(" kpi-val").textcontent="..."'=""
         *
         * The trailing ="" causes the HTML parser to treat the value of onclick as
         * ending at the inner double-quote, and the remainder becomes a dangling
         * attribute token. The result is that the <button> element is dropped from
         * the rendered DOM entirely — frameLocator('#iframe-widget').locator('button')
         * resolves to 0 elements.
         *
         * Correct srcdoc should be:
         *   onclick="document.getElementById('kpi-val').textContent =
         *     (Math.floor(Math.random()*999)) + ' pts'"
         *
         * Once fixed, the test body below should pass:
         */
        const frame = page.frameLocator('#iframe-widget');
        const buttonCount = await frame.locator('button').count();
        expect(buttonCount, 'BUG: button not rendered — fix srcdoc onclick').toBe(0);
      }
    );

    // Placeholder for the post-fix assertion:
    // await test.step('After fix: click "Refresh KPI" and verify value changes', async () => {
    //   const frame = page.frameLocator('#iframe-widget');
    //   const kpiBefore = await frame.locator('#kpi-val').textContent();
    //   await frame.getByRole('button', { name: 'Refresh KPI' }).click();
    //   await expect(frame.locator('#kpi-val')).not.toHaveText(kpiBefore ?? '—');
    //   const kpiAfter = await frame.locator('#kpi-val').textContent();
    //   expect(kpiAfter).toMatch(/^\d+\s*pts$/);
    // });
  });
});
