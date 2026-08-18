import { test } from '@playwright/test';
import { LoginPage } from '../support/page-objects/login.page';
import { PatientDeceasedPage } from '../support/page-objects/patient-deceased.page';

type DeceasedScenario = {
  username: string;
  password: string;
  patient_name: string;
  cause_option: string;
  cause_description: string;
};

const scenarios: DeceasedScenario[] = [
  {
    username: process.env.E2E_USERNAME ?? 'admin',
    password: process.env.E2E_PASSWORD ?? 'Admin123',
    patient_name: 'Trevion Noemy Lowe',
    cause_option: 'Other',
    cause_description: 'from overwork',
  },
];

test.describe('Admin marks a patient as deceased', () => {
  for (const row of scenarios) {
    test(`[P0] Successful login and marking ${row.patient_name} as deceased`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const patientPage = new PatientDeceasedPage(page);

      await test.step(`When I enter "${row.username}" in the username field`, async () => {
        await loginPage.goto();
        await loginPage.enterUsername(row.username);
      });

      await test.step('And I click on "Continue"', async () => {
        await loginPage.clickContinue();
      });

      await test.step(`And I enter password in the password field`, async () => {
        await loginPage.enterPassword(row.password);
      });

      await test.step('And I click on "Log In"', async () => {
        await loginPage.clickLogIn();
        await loginPage.confirmLoginLocationIfShown();
      });

      await test.step('When I click on search patient', async () => {
        await patientPage.openPatientSearch();
      });

      await test.step(`And I type "${row.patient_name}" in the search field`, async () => {
        await patientPage.typeInSearchField(row.patient_name);
      });

      await test.step(`And I click on "${row.patient_name}"`, async () => {
        await patientPage.clickPatientResult(row.patient_name);
      });

      await test.step('And I click on "Actions"', async () => {
        await patientPage.openActionsMenu();
      });

      await test.step('And I click on "Mark Patient Deceased"', async () => {
        await patientPage.chooseMarkPatientDeceased();
      });

      await test.step(`And I select "${row.cause_option}" from the cause of death radio options`, async () => {
        await patientPage.selectCauseOfDeath(row.cause_option);
      });

      await test.step(`And I enter "${row.cause_description}" in the non-coded cause of death field`, async () => {
        await patientPage.enterNonCodedCause(row.cause_description);
      });

      await test.step('And I click on "Save and Close"', async () => {
        await patientPage.saveAndClose();
      });

      await test.step('Then I should see the patient marked as deceased', async () => {
        await patientPage.expectPatientMarkedDeceased();
      });
    });
  }
});
