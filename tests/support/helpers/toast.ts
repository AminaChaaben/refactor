import { type Page, expect } from '@playwright/test';

// Toast is always in the DOM; visibility is controlled by the "show" CSS class.
// The app uses a single .toast element (not role="status/alert").
export async function expectToast(page: Page, message: string): Promise<void> {
  const toast = page.locator('.toast');
  await expect(toast).toHaveClass(/\bshow\b/, { timeout: 5_000 });
  await expect(toast).toContainText(message);
}

// Asserts the toast's "show" class is removed within withinMs milliseconds.
export async function expectToastDismissed(page: Page, _message: string, withinMs = 4_000): Promise<void> {
  await expect(page.locator('.toast')).not.toHaveClass(/\bshow\b/, { timeout: withinMs + 500 });
}
