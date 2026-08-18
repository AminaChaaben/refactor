import { type Page, expect } from '@playwright/test';

export class PatientDeceasedPage {
  constructor(readonly page: Page) {}

  async openPatientSearch(): Promise<void> {
    const searchTrigger = this.page
      .getByRole('button', { name: /search patient/i })
      .or(this.page.getByLabel(/search patient/i))
      .or(this.page.locator('[data-testid="searchPatientIcon"]'))
      .first();

    await searchTrigger.click();
  }

  searchField() {
    return this.page
      .getByRole('searchbox')
      .or(this.page.getByPlaceholder(/search/i))
      .or(this.page.locator('[data-testid="patientSearchBar"]'))
      .first();
  }

  async typeInSearchField(patientName: string): Promise<void> {
    await this.searchField().fill(patientName);
  }

  async clickPatientResult(patientName: string): Promise<void> {
    const result = this.page
      .getByRole('button', { name: new RegExp(patientName, 'i') })
      .or(this.page.getByText(new RegExp(`^${patientName}$`, 'i')))
      .or(
        this.page
          .locator('[data-testid="floatingSearchResultsContainer"]')
          .getByText(new RegExp(patientName, 'i'))
      )
      .first();

    await expect(result).toBeVisible();
    await result.click();
  }

  async openActionsMenu(): Promise<void> {
    await this.page.getByRole('button', { name: /^actions$/i }).click();
  }

  async chooseMarkPatientDeceased(): Promise<void> {
    await this.page.getByRole('menuitem', { name: /mark patient deceased/i }).click();
  }

  async selectCauseOfDeath(causeOption: string): Promise<void> {
    await this.page.getByRole('radio', { name: new RegExp(causeOption, 'i') }).check();
  }

  async enterNonCodedCause(description: string): Promise<void> {
    const field = this.page
      .getByLabel(/non-coded cause of death/i)
      .or(this.page.getByPlaceholder(/non-coded/i))
      .or(this.page.getByRole('textbox', { name: /cause of death/i }))
      .first();

    await field.fill(description);
  }

  async saveAndClose(): Promise<void> {
    await this.page.getByRole('button', { name: /save and close/i }).click();
  }

  async expectPatientMarkedDeceased(): Promise<void> {
    await expect(
      this.page.getByText(/deceased|date of death|cause of death|patient is dead/i).first()
    ).toBeVisible({ timeout: 30_000 });
  }
}
