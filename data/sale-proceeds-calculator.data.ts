/**
 * Test data for the HDB Sale Proceeds Calculator.
 * https://homes.hdb.gov.sg/home/calculator/sale-proceeds
 *
 * Copy/labels here were confirmed against a real accessibility snapshot of
 * the live page. Keep this as the single source of truth for expected page
 * text so tests don't hardcode strings inline.
 */

export const saleProceedsCalculatorPage = {
  url: '/home/calculator/sale-proceeds',

  advisory: {
    heading: 'Advisory',
    bodyText: /HDB will never request money transfers or bank log-in details/i,
    seeMoreLink: 'See more',
    closeButton: 'Close advisory',
  },

  govIdentify: {
    text: 'A Singapore Government Agency Website',
    toggleButton: /how to identify/,
  },

  masthead: {
    logoAlt: 'HDB',
    homeUrl: 'https://www.hdb.gov.sg/homepage',
  },

  heading: {
    title: 'Calculate Sale Proceeds',
    level: 1,
    description: 'Estimate sale proceeds after deducting outstanding payments and CPF monies used.',
  },

  clearForm: {
    helperText: /Click "Clear form" if you would like to clear all fields\./,
    buttonText: 'Clear form',
  },

  // Section headings, in the order they appear down the page.
  sections: [
    'Intended selling price',
    'Outstanding housing loan',
    'CPF monies utilised',
    'Outstanding HDB payments',
    'Next housing plans',
  ] as const,

  actions: {
    back: 'Back',
    calculate: 'Calculate',
  },

  terms: {
    linkText: 'Terms & Conditions',
  },

  footer: {
    orgName: 'Housing & Development Board',
    copyright: /Government of Singapore/,
  },
};

// Sample form input, reusable by tests that fill and submit the calculator.
export const sampleCalculatorInput = {
  listingPrice: '550000',
  deposit: '5000',
  outstandingLoan: '120000',
  cpfUtilised: '80000',
  outstandingUpgradingCost: '0',
};

/**
 * Data for the interactive form flow (TC02-TC08).
 *
 * homes.hdb.gov.sg flapped between HTTP 503 (site-wide scheduled
 * maintenance) and live throughout this suite's authoring session, so
 * confidence below is mixed:
 *  - Field/button names came from a Playwright codegen recording made
 *    against the live site (user-supplied) - real.
 *  - Everything under "confirmed live <date>" was captured from an actual
 *    passing/failing run's accessibility snapshot during a window when the
 *    site was up - also real, just captured indirectly rather than by design.
 *  - Anything still tagged "// TODO(verify)" was never exercised and is a
 *    best-effort assumption; check it once the site is reliably reachable.
 */
export const saleProceedsCalculatorForm = {
  outputUrl: /\/home\/calculator\/sale-proceeds\/output/,

  // Accessible names (role=textbox) straight from the codegen recording.
  // The housing-loan and HDB-payments fields have a dynamic suffix after the
  // dot (empty until a preceding question is answered), so those are matched
  // by prefix rather than exact string.
  fields: {
    listingPrice: 'intendedSellingPrice.listingPrice',
    deposit: 'intendedSellingPrice.deposit',
    outstandingLoanAmount: /^outstandingHousingLoan\./,
    sellerCpfAmount: 'seller.0.cpfAmount',
    outstandingHdbPayments: /^outstandingHdbPayments\./,
  },

  // Selecting an outstanding-loan type unlocks the loan amount field.
  loanTypeQuestion: {
    comboboxName: 'Question',
    // Recording shows the option text truncated to "Loan from financial ...".
    // TODO(verify): confirm the full option label, and whether "Loan from
    // HDB" / "No outstanding loan" options also exist.
    bankLoanOption: /Loan from financial/,
  },

  addSeller: {
    text: 'Add seller',
  },

  actions: {
    // Confirmed exact label, both from the recording and a live run.
    savePdf: 'Save as PDF',
  },

  // Confirmed via CI (chromium/firefox/webkit, with retries): there is no
  // "required"/"invalid number" text anywhere in the DOM after submitting
  // bad input - the fields carry a native HTML `required` attribute
  // (confirmed live), so the browser's own constraint-validation UI blocks
  // submission without the app rendering any error text of its own. TC03
  // and TC04 assert the field's native `validity` state instead of guessing
  // at display copy that doesn't exist.

  // Confirmed live: the listing price field is a masked currency input that
  // silently strips non-digit characters as you type - a leading "-" simply
  // never lands in the field (typing "-1" resulted in a stored value of "1",
  // which then calculated successfully). So there is no "reject negative"
  // validation branch to test; the boundary worth testing is that masking.
  boundaries: {
    listingPrice: { min: 0, negativeSampleTyped: '-1', negativeSampleStored: '1' },
  },

  // The recording typed '10,000,000.0' into listingPrice and '10,0000.00'
  // (deliberately mis-grouped) into the CPF field, implying these are
  // auto-formatting currency inputs. Plain unformatted decimals below so
  // tests aren't coupled to the exact grouping behaviour.
  decimalSamples: {
    listingPrice: '10000000.50',
    sellerCpfAmount: '10000.55',
  },

  // Given the masking behaviour above, letters alone are expected to be
  // fully stripped (resulting field value: ''), not preserved for an
  // on-submit "invalid number" message - see TC04's dual-path assertion.
  invalidNumberSamples: ['abcde', '12a34'],

  // Confirmed live from an actual output-page accessibility snapshot.
  output: {
    heading: 'Your Estimated Cash Proceeds',
    headingLevel: 1,
    resultLabels: {
      salePrice: 'Estimated sale price',
      deductions: 'Deductions',
      useForNextFlat: 'Use for next flat',
      cashProceeds: 'Estimated cash proceeds',
    },
    backLinkUrl: 'https://homes.hdb.gov.sg/home/calculator/sale-proceeds',
  },

  // Confirmed live: after "Clear form", the listing price and deposit inputs
  // reset to '', but the seller CPF amount field resets to '0.00' instead -
  // an inconsistency in the app itself, not a test bug.
  resetValues: {
    listingPrice: '',
    deposit: '',
    sellerCpfAmount: '0.00',
  },
};
