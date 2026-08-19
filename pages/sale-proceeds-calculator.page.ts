import type { Locator, Page } from '@playwright/test';
import {
  saleProceedsCalculatorPage as pageData,
  saleProceedsCalculatorForm as formData,
  sampleCalculatorInput,
} from '../data/sale-proceeds-calculator.data';

/** Page object for the interactive parts of the Sale Proceeds Calculator. */
export class SaleProceedsCalculatorPage {
  constructor(private readonly page: Page) {}

  async goto() {
    const response = await this.page.goto(pageData.url);
    await this.page.waitForLoadState('networkidle');
    return response;
  }

  private textbox(name: string | RegExp): Locator {
    return this.page.getByRole('textbox', { name });
  }

  get listingPriceInput() {
    return this.textbox(formData.fields.listingPrice);
  }

  get depositInput() {
    return this.textbox(formData.fields.deposit);
  }

  get outstandingLoanInput() {
    return this.textbox(formData.fields.outstandingLoanAmount);
  }

  get sellerCpfAmountInput() {
    return this.textbox(formData.fields.sellerCpfAmount);
  }

  get outstandingHdbPaymentsInput() {
    return this.textbox(formData.fields.outstandingHdbPayments);
  }

  get loanTypeCombobox() {
    return this.page.getByRole('combobox', { name: formData.loanTypeQuestion.comboboxName });
  }

  get calculateButton() {
    return this.page.getByRole('button', { name: pageData.actions.calculate });
  }

  get clearFormButton() {
    return this.page.getByRole('button', { name: pageData.clearForm.buttonText });
  }

  get savePdfButton() {
    return this.page.getByRole('button', { name: formData.actions.savePdf });
  }

  /** Answers the loan-type question so the loan amount field becomes fillable. */
  async selectBankLoan() {
    await this.loanTypeCombobox.click();
    await this.page.getByRole('option', { name: formData.loanTypeQuestion.bankLoanOption }).click();
  }

  /** Fills every field exercised in the reference recording with valid values. */
  async fillValidForm(input: typeof sampleCalculatorInput = sampleCalculatorInput) {
    await this.listingPriceInput.fill(input.listingPrice);
    await this.depositInput.fill(input.deposit);
    await this.selectBankLoan();
    await this.outstandingLoanInput.fill(input.outstandingLoan);
    await this.sellerCpfAmountInput.fill(input.cpfUtilised);
    await this.outstandingHdbPaymentsInput.fill(input.outstandingUpgradingCost);
  }

  async clickCalculate() {
    await this.calculateButton.click();
  }

  async clickClearForm() {
    await this.clearFormButton.click();
  }

  async waitForOutput(timeout = 15_000) {
    await this.page.waitForURL(formData.outputUrl, { timeout });
  }
}
