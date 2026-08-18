import { type Page, expect } from '@playwright/test';
import { expectToast } from '../../helpers/toast';

export class ShopzoneAuthModal {
  // Modal visibility is controlled by .overlay.active { display: flex }
  private readonly overlay = this.page.locator('.overlay');
  private readonly modal = this.page.locator('.modal');
  private readonly registerForm = this.page.locator('[data-tab="register-form"]');
  private readonly loginForm = this.page.locator('[data-tab="login-form"]');

  constructor(readonly page: Page) {}

  // ── Modal state ───────────────────────────────────────────────────────────

  async expectVisible(): Promise<void> {
    // .overlay has display:none by default; .active adds display:flex
    await expect(this.overlay).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.overlay).not.toBeVisible();
  }

  // ── Tab state ─────────────────────────────────────────────────────────────
  // Tabs are plain <div> elements; active tab gets CSS class "active"
  // There is NO aria-selected — do not use toHaveAttribute('aria-selected')

  private tab(name: string) {
    return this.modal.locator('.tabs div').filter({ hasText: name });
  }

  async expectTabActive(tabName: string): Promise<void> {
    await expect(this.tab(tabName)).toHaveClass(/\bactive\b/);
  }

  async expectTabInactive(tabName: string): Promise<void> {
    await expect(this.tab(tabName)).not.toHaveClass(/\bactive\b/);
  }

  async clickTab(tabName: string): Promise<void> {
    await this.tab(tabName).click();
  }

  // ── Form visibility ───────────────────────────────────────────────────────
  // Visibility toggled via style="display:block/none" — Playwright toBeVisible() handles this correctly

  async expectRegistrationFormVisible(): Promise<void> {
    await expect(this.registerForm).toBeVisible();
  }

  async expectLoginFormHidden(): Promise<void> {
    await expect(this.loginForm).not.toBeVisible();
  }

  // Form labels are <span> elements (not <label for="">), so getByLabel() won't work.
  // Use getByPlaceholder() to locate fields instead.
  async expectRegistrationFieldsPresent(): Promise<void> {
    await expect(this.registerForm.getByPlaceholder('Jane')).toBeVisible();
    await expect(this.registerForm.getByPlaceholder('Doe')).toBeVisible();
    await expect(this.registerForm.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(this.registerForm.getByPlaceholder('Min. 8 characters')).toBeVisible();
    await expect(this.registerForm.getByPlaceholder('Repeat password')).toBeVisible();
    await expect(this.registerForm.locator('select')).toBeVisible();
  }

  // ── Form fill ─────────────────────────────────────────────────────────────

  async fillFirstName(value: string): Promise<void> {
    await this.registerForm.getByPlaceholder('Jane').fill(value);
  }

  async fillLastName(value: string): Promise<void> {
    await this.registerForm.getByPlaceholder('Doe').fill(value);
  }

  async fillEmail(value: string): Promise<void> {
    await this.registerForm.getByPlaceholder('you@example.com').fill(value);
  }

  async fillPassword(value: string): Promise<void> {
    await this.registerForm.getByPlaceholder('Min. 8 characters').fill(value);
  }

  async fillConfirmPassword(value: string): Promise<void> {
    await this.registerForm.getByPlaceholder('Repeat password').fill(value);
  }

  async selectCountry(country: string): Promise<void> {
    await this.registerForm.locator('select').selectOption(country);
  }

  async acceptTerms(): Promise<void> {
    await this.registerForm.locator('input[type="checkbox"]').check();
  }

  async submitRegistration(): Promise<void> {
    await this.registerForm.locator('.modal-footer button').first().click();
  }

  // ── Toast delegate ────────────────────────────────────────────────────────

  async expectToast(message: string): Promise<void> {
    await expectToast(this.page, message);
  }
}
