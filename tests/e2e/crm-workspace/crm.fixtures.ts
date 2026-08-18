/**
 * CRM Deals Workspace — shared fixtures and helpers
 *
 * Target: https://ekhdem.netlify.app/
 *
 * DOM notes (no data-testid attributes — verified 2026-06-11):
 *  - Tabs: button.tab (text-matched)
 *  - Deals table: #deals-body > tr[data-deal-id]
 *  - Event log: #deal-event-log .log-line
 *  - Contacts form: #fname, #lname, #dept-trigger, #dept-list, #priority-slider, #contact-submit-btn
 *  - Contact status: #contact-status (contains .spinner while saving)
 *  - Contacts table: #contacts-body > tr[data-contact-id]
 *  - Pipeline metrics: #pipeline-total, #pipeline-avg
 *  - Batch: #batch-btn, #batch-log .log-line
 *  - Iframe: #iframe-widget (sandboxed; button NOT rendered due to srcdoc bug — see pipeline.spec.ts)
 *  - Notifications: #notif-count, #notif-btn (aria-label="Notifications"), #notif-panel, #notif-list
 *  - Settings dynamic fields: #dynamic-fields input (IDs change on every render — target by label)
 *  - Delete modal: #delete-modal-wrap, #confirm-delete-btn, #modal-countdown
 */

import { test as base, expect, type Page } from '@playwright/test';

export { expect };

export const CRM_URL = 'https://ekhdem.netlify.app/';

export type Tab = 'Deals' | 'Contacts' | 'Pipeline' | 'Settings';

/** Navigate to a named tab. Waits for the panel to become active. */
export async function switchTab(page: Page, name: Tab): Promise<void> {
  await page.getByRole('button', { name, exact: true }).click();
  await page.locator(`#tab-${name.toLowerCase()}`).waitFor({ state: 'visible' });
}

/**
 * Fill the contact form fields.
 * Handles the custom div-based department dropdown (not a native <select>).
 */
export async function fillContactForm(
  page: Page,
  opts: { fname: string; lname: string; dept: string; score?: number }
): Promise<void> {
  await page.locator('#fname').fill(opts.fname);
  await page.locator('#lname').fill(opts.lname);

  // Custom dropdown: click trigger → wait for list → click item
  await page.locator('#dept-trigger').click();
  await page.locator('#dept-list').waitFor({ state: 'visible' });
  await page.locator('#dept-list .custom-dropdown-item').filter({ hasText: opts.dept }).click();
  await page.locator('#dept-list').waitFor({ state: 'hidden' });

  if (opts.score !== undefined && opts.score !== 50) {
    // range inputs require evaluate + dispatch — fill() does not move the thumb reliably
    await page.locator('#priority-slider').evaluate((el: HTMLInputElement, val) => {
      el.value = String(val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, opts.score);
  }
}

/**
 * Submit the contact form and wait for the async save to complete.
 * Save delay is randomised 1200–2000ms — uses waitFor, NOT a fixed timeout.
 */
export async function saveContact(page: Page, withNotify = false): Promise<void> {
  if (withNotify) {
    await page.getByRole('button', { name: 'Save & notify' }).click();
  } else {
    await page.locator('#contact-submit-btn').click();
  }
  // Spinner appears then detaches when save completes
  await page.locator('#contact-status .spinner').waitFor({ state: 'visible', timeout: 3_000 });
  await page.locator('#contact-status .spinner').waitFor({ state: 'detached', timeout: 5_000 });
}

/**
 * Open the delete modal and block until the confirm button becomes enabled
 * (3-second countdown enforced by the app).
 */
export async function openDeleteModalAndWaitForCountdown(page: Page): Promise<void> {
  await page.locator('#open-delete-btn').click();
  await page.locator('#delete-modal-wrap').waitFor({ state: 'visible' });
  await expect(page.locator('#confirm-delete-btn')).toBeDisabled();
  // Countdown is 3s; allow 5s to cover any CI slowness
  await expect(page.locator('#confirm-delete-btn')).toBeEnabled({ timeout: 5_000 });
}

/** Read the current notification count from the topbar badge. */
export async function getNotifCount(page: Page): Promise<number> {
  const text = await page.locator('#notif-count').textContent();
  return parseInt(text ?? '0', 10);
}

/** Extend base test with automatic CRM page setup (storageState bypass + navigation). */
export const test = base.extend<{ crmPage: Page }>({
  crmPage: [
    async ({ browser }, use) => {
      const ctx = await browser.newContext({ storageState: undefined });
      const page = await ctx.newPage();
      await page.goto(CRM_URL);
      await page.locator('#session-badge').waitFor({ state: 'visible' });
      await use(page);
      await ctx.close();
    },
    { scope: 'test' },
  ],
});
