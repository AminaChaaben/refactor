/**
 * Feature: CRM Deals Workspace — Notifications
 *
 * Scenarios covered:
 *   @p2   Notification bell navigates to settings and shows panel
 *   @p2   Notification count accumulates across deal and contact events
 *
 * Notes on notification sources (verified from app JS):
 *   - addDeal()      → 1 notification per deal added
 *   - submitContact(withNotify=true) → 1 notification on contact save+notify
 *   - triggerBatch() → 1 notification when batch completes (NOT per-deal)
 *   - advanceStage() → no notification
 *
 * Accumulation test (4 expected):
 *   2 new deals (×1 each) + 1 save&notify (×1) + 1 batch run (×1) = 4
 */

import { test, expect, switchTab, fillContactForm, saveContact } from './crm.fixtures';

test.describe('Notifications @crm', () => {
  test.use({ storageState: undefined });

  // ─── @p2 ──────────────────────────────────────────────────────────────────
  test('[P2] Notification bell navigates to settings and shows panel', async ({ crmPage: page }) => {
    await test.step('Generate a notification via deal action', async () => {
      await page.getByRole('button', { name: 'New deal' }).click();
      // Confirm count incremented
      const count = await page.locator('#notif-count').textContent();
      expect(parseInt(count ?? '0', 10)).toBeGreaterThan(0);
    });

    await test.step('Click the notification bell icon in the topbar', async () => {
      // toggleNotifPanel() → switchTab('settings') + show #notif-panel
      await page.locator('#notif-btn').click();
    });

    await test.step('Settings tab becomes active', async () => {
      await expect(page.locator('#tab-settings')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Settings' })).toHaveClass(/active/);
    });

    await test.step('Notifications panel is visible', async () => {
      await expect(page.locator('#notif-panel')).toBeVisible();
    });

    await test.step('Panel lists the most recent notification', async () => {
      await expect(page.locator('#notif-list')).not.toHaveText('No notifications');
      await expect(page.locator('#notif-list')).toContainText('New deal added:');
    });

    await test.step('Generate a second notification and verify it appears first (reverse order)', async () => {
      await switchTab(page, 'Contacts');
      await fillContactForm(page, { fname: 'Order', lname: 'Check', dept: 'Sales' });
      await saveContact(page, true);

      // Re-open notification panel via bell
      await page.locator('#notif-btn').click();

      // #notif-list renders notifications in reverse chronological order (unshift)
      const firstEntry = page.locator('#notif-list > div').first();
      await expect(firstEntry).toContainText('Contact saved:');
    });
  });

  // ─── @p2 ──────────────────────────────────────────────────────────────────
  test('[P2] Notification count accumulates across deal and contact events', async ({ crmPage: page }) => {
    const initialCount = parseInt((await page.locator('#notif-count').textContent()) ?? '0', 10);

    await test.step('Add 2 new deals (+2 notifications)', async () => {
      const newDealBtn = page.getByRole('button', { name: 'New deal' });
      await newDealBtn.click();
      await newDealBtn.click();
      await expect(page.locator('#notif-count')).toHaveText(String(initialCount + 2));
    });

    await test.step('Save 1 contact with "Save & notify" (+1 notification)', async () => {
      await switchTab(page, 'Contacts');
      await fillContactForm(page, { fname: 'Notif', lname: 'Accum', dept: 'Engineering' });
      await saveContact(page, true);
      await expect(page.locator('#notif-count')).toHaveText(String(initialCount + 3));
    });

    await test.step('Run batch recalc (+1 notification on completion)', async () => {
      await switchTab(page, 'Pipeline');
      await page.locator('#batch-btn').click();

      // Batch is async — wait for "Batch complete" before asserting count
      await expect(page.locator('#batch-log')).toContainText('Batch complete', { timeout: 10_000 });
      await expect(page.locator('#notif-count')).toHaveText(String(initialCount + 4));
    });
  });
});
