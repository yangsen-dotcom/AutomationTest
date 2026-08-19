import { test, expect } from '@playwright/test';
import { saleProceedsCalculatorPage as data } from '../data/sale-proceeds-calculator.data';

test.describe('Sale Proceeds Calculator - page structure', () => {
  test('displays every part of the page in order', async ({ page }, testInfo) => {
    let step = 0;
    const shot = (name: string) =>
      page.screenshot({
        path: testInfo.outputPath(`${String(++step).padStart(2, '0')}-${name}.png`),
        fullPage: true,
      });

    await page.goto(data.url);
    await page.waitForLoadState('networkidle');

    await test.step('Advisory part is displayed', async () => {
      await expect(page.getByText(data.advisory.heading, { exact: true }).first()).toBeVisible();
      await expect(page.getByText(data.advisory.bodyText)).toBeVisible();
      await expect(page.getByRole('link', { name: data.advisory.seeMoreLink })).toBeVisible();
      await expect(page.getByRole('button', { name: data.advisory.closeButton })).toBeVisible();
      await shot('advisory');
    });

    await test.step('"A Singapore Government Agency Website" part is displayed', async () => {
      await expect(page.getByText(data.govIdentify.text)).toBeVisible();
      await expect(page.getByRole('button', { name: data.govIdentify.toggleButton })).toBeVisible();
      await shot('gov-identify');
    });

    await test.step('"HOUSING & DEVELOPMENT BOARD" masthead is displayed', async () => {
      // Accessible name of the logo image is "HDB"; the full wordmark is
      // baked into the logo graphic itself, not separate text.
      await expect(page.getByRole('img', { name: data.masthead.logoAlt })).toBeVisible();
      await shot('masthead');
    });

    await test.step('"Calculate Sale Proceeds" part is displayed', async () => {
      await expect(page.getByRole('heading', { name: data.heading.title, level: data.heading.level })).toBeVisible();
      await expect(page.getByText(data.heading.description)).toBeVisible();
      await shot('calculate-sale-proceeds-heading');
    });

    await test.step('"Clear form" part is displayed', async () => {
      await expect(page.getByText(data.clearForm.helperText)).toBeVisible();
      await expect(page.getByRole('button', { name: data.clearForm.buttonText })).toBeVisible();
      await shot('clear-form');
    });

    for (const sectionTitle of data.sections) {
      await test.step(`"${sectionTitle}" part is displayed`, async () => {
        await expect(page.getByText(sectionTitle, { exact: true }).first()).toBeVisible();
        await shot(sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      });
    }

    await test.step('"Back" arrow and "Calculate" button are displayed', async () => {
      await expect(page.getByRole('link', { name: data.actions.back })).toBeVisible();
      await expect(page.getByRole('button', { name: data.actions.calculate })).toBeVisible();
      await shot('back-and-calculate');
    });

    await test.step('"Terms & Conditions" part is displayed', async () => {
      await expect(page.getByRole('link', { name: data.terms.linkText })).toBeVisible();
      await shot('terms-and-conditions');
    });

    await test.step('Footer part is displayed', async () => {
      await expect(page.getByText(data.footer.orgName, { exact: true })).toBeVisible();
      await expect(page.getByText(data.footer.copyright)).toBeVisible();
      await shot('footer');
    });
  });
});
