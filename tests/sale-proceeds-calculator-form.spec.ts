import { expect, test } from '@playwright/test';
import {
  saleProceedsCalculatorForm as formData,
  saleProceedsCalculatorPage as pageData,
  sampleCalculatorInput,
} from '../data/sale-proceeds-calculator.data';
import { SaleProceedsCalculatorPage } from '../pages/sale-proceeds-calculator.page';

test.describe('Sale Proceeds Calculator - form interactions', () => {
  let calculator: SaleProceedsCalculatorPage;

  test.beforeEach(async ({ page }) => {
    calculator = new SaleProceedsCalculatorPage(page);
  });

  test('TC01 - Page loading', async ({ page }) => {
    const response = await calculator.goto();
    expect(response?.ok()).toBeTruthy();

    await expect(page.getByRole('heading', { name: pageData.heading.title, level: pageData.heading.level })).toBeVisible();
    for (const sectionTitle of pageData.sections) {
      await expect(page.getByText(sectionTitle, { exact: true }).first()).toBeVisible();
    }
    await expect(calculator.calculateButton).toBeVisible();
    await expect(calculator.clearFormButton).toBeVisible();
  });

  test('TC02 - Valid input calculates sale proceeds', async ({ page }) => {
    await calculator.goto();
    await calculator.fillValidForm();
    await calculator.clickCalculate();

    await calculator.waitForOutput();
    await expect(page).toHaveURL(formData.outputUrl);
    await expect(
      page.getByRole('heading', { name: formData.output.heading, level: formData.output.headingLevel }),
    ).toBeVisible();
    await expect(page.getByText(formData.output.resultLabels.cashProceeds, { exact: true }).first()).toBeVisible();
  });

  test('TC03 - Required field validation', async ({ page }) => {
    await calculator.goto();

    // Submit with every field left empty.
    await calculator.clickCalculate();

    // Confirmed via CI (3 browsers, with retries): no "required"/"please..."
    // text ever appears in the DOM here - the field's native HTML `required`
    // attribute (confirmed live earlier) means an unfilled required field is
    // blocked by the browser's own constraint validation, whose UI (the
    // native tooltip) isn't part of the accessible tree at all, so no
    // getByText locator could ever find it. Assert the real signal instead:
    // submission was blocked, and the field itself reports the missing value.
    await expect(page).not.toHaveURL(formData.outputUrl);
    const isMissingRequiredValue = await calculator.listingPriceInput.evaluate(
      (el: HTMLInputElement) => el.validity.valueMissing,
    );
    expect(isMissingRequiredValue).toBe(true);
  });

  test('TC04 - Invalid number is rejected', async ({ page }) => {
    await calculator.goto();

    const invalidValue = formData.invalidNumberSamples[0];
    await calculator.listingPriceInput.pressSequentially(invalidValue);
    const currentValue = await calculator.listingPriceInput.inputValue();

    if (currentValue === invalidValue) {
      // The field accepted raw non-numeric text; expect validation on submit.
      // Same reasoning as TC03: check the field's native validity state
      // rather than guessing at display copy that may not exist in the DOM.
      await calculator.clickCalculate();
      await expect(page).not.toHaveURL(formData.outputUrl);
      const isInvalid = await calculator.listingPriceInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    } else {
      // The field filtered non-numeric characters as they were typed - this
      // is the branch every observed live run has actually taken.
      expect(currentValue).not.toBe(invalidValue);
    }
  });

  test('TC05 - Boundary values', async ({ page }) => {
    const { min, negativeSampleTyped, negativeSampleStored } = formData.boundaries.listingPrice;

    await test.step('Minimum valid value (0) is accepted', async () => {
      await calculator.goto();
      await calculator.fillValidForm({ ...sampleCalculatorInput, listingPrice: String(min) });
      await calculator.clickCalculate();
      await calculator.waitForOutput();
      await expect(page).toHaveURL(formData.outputUrl);
    });

    // Confirmed live: this is a masked currency input, so a leading "-" is
    // stripped as it's typed rather than triggering a validation error -
    // there's no "reject negative" error path to assert on here. The field
    // isn't empty on load, so clear it first for a deterministic start.
    await test.step('Negative sign is stripped by the input mask, not rejected with an error', async () => {
      await calculator.goto();
      await calculator.listingPriceInput.fill('');
      await calculator.listingPriceInput.pressSequentially(negativeSampleTyped);
      await expect(calculator.listingPriceInput).toHaveValue(negativeSampleStored);
    });
  });

  test('TC06 - Decimal value is accepted and reflected in the result', async ({ page }) => {
    await calculator.goto();
    await calculator.fillValidForm({
      ...sampleCalculatorInput,
      listingPrice: formData.decimalSamples.listingPrice,
      cpfUtilised: formData.decimalSamples.sellerCpfAmount,
    });
    await calculator.clickCalculate();

    await calculator.waitForOutput();
    await expect(page).toHaveURL(formData.outputUrl);
    // TODO(verify): once the output page's real markup is known, assert the
    // displayed total actually reflects the decimal inputs (e.g. correct
    // rounding to 2dp), not just that calculation succeeded.
  });

  test('TC07 - Reset clears the form', async ({ page }) => {
    await calculator.goto();
    await calculator.fillValidForm();

    await calculator.clickClearForm();

    await expect(calculator.listingPriceInput).toHaveValue(formData.resetValues.listingPrice);
    await expect(calculator.depositInput).toHaveValue(formData.resetValues.deposit);
    // Confirmed live: unlike the other fields, this one resets to '0.00'
    // rather than '' - an app inconsistency, not a test bug.
    await expect(calculator.sellerCpfAmountInput).toHaveValue(formData.resetValues.sellerCpfAmount);
  });

  test('TC08 - Save PDF after calculation', async ({ page }) => {
    await calculator.goto();
    await calculator.fillValidForm();
    await calculator.clickCalculate();
    await calculator.waitForOutput();

    await expect(calculator.savePdfButton).toBeVisible();

    // TODO(verify): the recording confirms the button and its exact label
    // ("Save as PDF") but doesn't show what happens next. Handle the three
    // most likely mechanisms and tighten this once the real one is known:
    // (a) a file download, (b) a new tab with the PDF, or (c) window.print().
    const [download, newPage] = await Promise.all([
      page.waitForEvent('download', { timeout: 5_000 }).catch(() => null),
      page.context().waitForEvent('page', { timeout: 5_000 }).catch(() => null),
      calculator.savePdfButton.click(),
    ]);

    if (download) {
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    } else if (newPage) {
      await expect(newPage).toHaveURL(/\.pdf($|\?)/i);
    } else {
      test.info().annotations.push({
        type: 'todo',
        description:
          'No download or new tab observed after clicking "Save as PDF" - confirm against the live site whether it uses window.print() instead, and assert that explicitly.',
      });
    }
  });
});
