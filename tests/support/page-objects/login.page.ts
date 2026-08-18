import { type Locator, type Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/spa/login');
    await expect(this.page.getByLabel(/username/i)).toBeVisible();
  }

  async enterUsername(username: string): Promise<void> {
    await this.page.getByLabel(/username/i).fill(username);
  }

  async clickContinue(): Promise<void> {
    await this.page.getByRole('button', { name: /continue/i }).click();
  }

  async enterPassword(password: string): Promise<void> {
    const passwordField = this.page.getByLabel(/^password$/i);
    await passwordField.waitFor({ state: 'visible' });
    await passwordField.fill(password);
  }

  async clickLogIn(): Promise<void> {
    await this.page.getByRole('button', { name: /log in/i }).click();
  }

  /** OpenMRS often prompts for session location after credentials. */
  async confirmLoginLocationIfShown(locationName?: string): Promise<void> {
    const onLocationStep = this.page.url().includes('/spa/login/location');
    if (!onLocationStep) return;

    const label = locationName ?? process.env.E2E_LOGIN_LOCATION ?? 'Outpatient Clinic';
    const locationOption = this.page.getByText(new RegExp(label, 'i')).first();
    if (await locationOption.isVisible().catch(() => false)) {
      await locationOption.click();
    }

    const confirm = this.page.getByRole('button', { name: /confirm/i });
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }
  }

  async login(username: string, password: string): Promise<void> {
    await this.goto();
    await this.enterUsername(username);
    await this.clickContinue();
    await this.enterPassword(password);
    await this.clickLogIn();
    await this.confirmLoginLocationIfShown();
    await expect(this.page).not.toHaveURL(/\/spa\/login$/);
  }
}
