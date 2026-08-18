/**
 * Feature: CRM Deals Workspace — Contacts tab
 *
 * Scenarios covered:
 *   @p0 @smoke  Save a valid contact and verify it appears in the table
 *   @p0         Department dropdown is a custom component — not a native select
 *   @p1         Live validation triggers on input without form submit
 *   @p1         Save and notify triggers a notification side effect
 *   @p2         Priority score slider updates the displayed value in real time
 *   @p1         Deleting a contact removes it from the table immediately
 *
 * Testing challenges addressed:
 *   - Save delay is randomised 1200–2000ms: spinner-based waitFor used,
 *     NOT a fixed page.waitForTimeout().
 *   - Department dropdown is div-based: click trigger → wait for list → click item.
 *     page.selectOption() will throw because there is no <select> element.
 *   - Live validation fires on oninput, not on blur or submit: assertions run
 *     immediately after each fill() call.
 *   - Slider: fill() is unreliable on range inputs; evaluate() + dispatchEvent used.
 */

import { test, expect, switchTab, fillContactForm, saveContact, getNotifCount } from './crm.fixtures';

test.describe('Contacts tab @crm', () => {
  test.use({ storageState: undefined });

  // Navigate to Contacts tab before each test
  test.beforeEach(async ({ crmPage: page }) => {
    await switchTab(page, 'Contacts');
  });

  // ─── @p0 @smoke ────────────────────────────────────────────────────────────
  test('[P0][smoke] Save a valid contact and verify it appears in the table', async ({ crmPage: page }) => {
    await test.step('Fill the contact form', async () => {
      await fillContactForm(page, { fname: 'Amina', lname: 'Ben Ali', dept: 'Engineering' });
    });

    await test.step('Click "Save contact" and wait for async save', async () => {
      // Spinner should appear while saving (randomised 1200–2000ms delay)
      await page.locator('#contact-submit-btn').click();
      await page.locator('#contact-status .spinner').waitFor({ state: 'visible', timeout: 3_000 });
    });

    await test.step('Spinner disappears when save completes', async () => {
      await page.locator('#contact-status .spinner').waitFor({ state: 'detached', timeout: 5_000 });
    });

    await test.step('Contacts table contains a row for "Amina Ben Ali"', async () => {
      const row = page.locator('#contacts-body tr').filter({ hasText: 'Amina Ben Ali' });
      await expect(row).toBeVisible();
    });

    await test.step('Row status badge shows "active"', async () => {
      const row = page.locator('#contacts-body tr').filter({ hasText: 'Amina Ben Ali' });
      await expect(row.locator('span.badge')).toHaveText('active');
    });
  });

  // ─── @p0 ──────────────────────────────────────────────────────────────────
  test('[P0] Department dropdown is a custom component — not a native select', async ({ crmPage: page }) => {
    await test.step('selectOption() throws — no <select> element exists', async () => {
      // The dropdown is a div (#dept-dropdown), not a native <select>.
      // Playwright's selectOption() locates by CSS/ARIA — there is no <select>
      // labelled "Department" so this will throw with a timeout.
      let threw = false;
      try {
        await page.getByLabel('Department').selectOption('Engineering', { timeout: 1_000 });
      } catch {
        threw = true;
      }
      expect(threw, 'selectOption should fail on a div-based dropdown').toBe(true);
    });

    await test.step('Correct approach: click trigger → wait for list → click item', async () => {
      await page.locator('#dept-trigger').click();
      await page.locator('#dept-list').waitFor({ state: 'visible' });
      await page.locator('#dept-list .custom-dropdown-item').filter({ hasText: 'Engineering' }).click();
      await page.locator('#dept-list').waitFor({ state: 'hidden' });
      await expect(page.locator('#dept-value')).toHaveText('Engineering');
    });
  });

  // ─── @p1 ──────────────────────────────────────────────────────────────────
  test('[P1] Live validation triggers on input without form submit', async ({ crmPage: page }) => {
    await test.step('Type "A" in First name — inline error "Min 2 chars" appears immediately', async () => {
      await page.locator('#fname').fill('A');
      // Validation fires on oninput — no submit or blur needed
      await expect(page.locator('#fname-err')).toHaveText('Min 2 chars');
    });

    await test.step('Type one more character — inline error disappears without clicking anything', async () => {
      await page.locator('#fname').fill('Ab');
      await expect(page.locator('#fname-err')).toHaveText('');
    });
  });

  // ─── @p1 ──────────────────────────────────────────────────────────────────
  test('[P1] Save and notify triggers a notification side effect', async ({ crmPage: page }) => {
    const notifBefore = await getNotifCount(page);

    await test.step('Fill a valid contact form', async () => {
      await fillContactForm(page, { fname: 'Test', lname: 'User', dept: 'Sales' });
    });

    await test.step('Click "Save & notify"', async () => {
      await saveContact(page, true);
    });

    await test.step('Notification count in topbar increments', async () => {
      const notifAfter = await getNotifCount(page);
      expect(notifAfter).toBe(notifBefore + 1);
    });

    await test.step('Clicking the notification bell shows the panel with the notification', async () => {
      // toggleNotifPanel() switches to Settings AND reveals #notif-panel
      await page.locator('#notif-btn').click();
      await expect(page.locator('#notif-panel')).toBeVisible();
      await expect(page.locator('#notif-list')).toContainText('Contact saved:');
    });
  });

  // ─── @p2 ──────────────────────────────────────────────────────────────────
  test('[P2] Priority score slider updates the displayed value in real time', async ({ crmPage: page }) => {
    await test.step('Move priority score slider to 80', async () => {
      // fill() is not reliable on range inputs; evaluate + dispatchEvent is deterministic
      await page.locator('#priority-slider').evaluate((el: HTMLInputElement, val) => {
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, '80');
    });

    await test.step('Label next to slider displays "80" immediately', async () => {
      await expect(page.locator('#priority-display')).toHaveText('80');
    });
  });

  // ─── @p1 ──────────────────────────────────────────────────────────────────
  test('[P1] Deleting a contact removes it from the table immediately', async ({ crmPage: page }) => {
    await test.step('Ensure at least one contact exists (seed one)', async () => {
      await fillContactForm(page, { fname: 'Delete', lname: 'Me', dept: 'Finance' });
      await saveContact(page);
      await expect(page.locator('#contacts-body tr').filter({ hasText: 'Delete Me' })).toBeVisible();
    });

    const rowsBefore = await page.locator('#contacts-body tr[data-contact-id]').count();

    await test.step('Click the delete icon on the first contact row', async () => {
      await page.locator('#contacts-body tr[data-contact-id]').first()
        .locator('td').last()
        .locator('button')
        .click();
    });

    await test.step('Row no longer exists in the contacts table', async () => {
      await expect(page.locator('#contacts-body tr[data-contact-id]')).toHaveCount(rowsBefore - 1);
    });
  });
});
