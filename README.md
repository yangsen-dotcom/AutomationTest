# HDB Sale Proceeds Calculator — Automated Tests

Playwright end-to-end test suite for the HDB Sale Proceeds Calculator:
https://homes.hdb.gov.sg/home/calculator/sale-proceeds (results at
`/home/calculator/sale-proceeds/output`).

## Project structure

```
data/       Test data & expected page copy (single source of truth for strings/locators)
pages/      Page object(s) wrapping the calculator's locators and actions
tests/      Spec files
playwright.config.ts   Browsers, base URL, reporter, trace/video/screenshot settings
```

| File | Purpose |
|---|---|
| `data/sale-proceeds-calculator.data.ts` | Expected page text, section headings, form field locators, sample input |
| `pages/sale-proceeds-calculator.page.ts` | Page object: navigation, field getters, `fillValidForm()`, calculate/reset/save-PDF actions |
| `tests/sale-proceeds-calculator.spec.ts` | Static page-structure test (advisory banner, masthead, headings, sections, footer, etc., in order) |
| `tests/sale-proceeds-calculator-form.spec.ts` | Interactive form flow — TC01 through TC08 |

## Test cases

All eight live in `sale-proceeds-calculator-form.spec.ts`, run against every configured browser project.

| ID | Name | What it checks |
|---|---|---|
| TC01 | Page loading | Page responds OK; heading, all five section titles, and the Calculate/Clear form buttons are visible |
| TC02 | Valid input | Filling every field with valid values and clicking Calculate navigates to `/output` and shows the result heading + cash-proceeds figure |
| TC03 | Required field validation | Submitting an empty form stays on the input page, and the required field's native `validity.valueMissing` is `true` |
| TC04 | Invalid number | Typing non-numeric text into the listing-price field is either filtered out as it's typed, or (fallback) blocked via the field's native `validity` state |
| TC05 | Boundary value | `0` is accepted as a minimum; a leading `-` is stripped by the field's input mask rather than triggering an error |
| TC06 | Decimal value | Decimal amounts (e.g. `10000000.50`) are accepted and the calculation still completes |
| TC07 | Reset | "Clear form" resets the listing price and deposit fields to empty, and the CPF field to `0.00` |
| TC08 | Save PDF | After a successful calculation, clicking "Save as PDF" is checked for a file download, a new tab, or (as a fallback) flagged for manual confirmation of the export mechanism |

### A note on confidence

The live site was intermittently down for scheduled maintenance (HTTP 503) while this suite was built, so not everything is fully pinned down:

- **Confirmed live**: all field locators, the "Save as PDF" button label, the output page's real heading (`Your Estimated Cash Proceeds`) and result labels, the reset-value quirk (TC07), the negative-sign masking behaviour (TC05), and — after an initial CI run caught it — that the app shows **no rendered error text at all** for required/invalid fields. It relies on native HTML `required` inputs, so the browser's own constraint-validation tooltip (not part of the DOM) is all a user sees; TC03/TC04 assert the field's native `validity` state instead of guessing at display copy.
- **Still an assumption** — search `data/sale-proceeds-calculator.data.ts` for `TODO(verify)`: the full loan-type dropdown option text, and the precise mechanism behind "Save as PDF" (download vs. new tab vs. browser print).

If TC08 starts failing after a site change, check that TODO first — it's the part most likely to need a behaviour update rather than a real regression.

## How to test

Install dependencies once:

```bash
npm ci
npx playwright install --with-deps
```

Run the full suite (all spec files, all three browsers — chromium, firefox, webkit):

```bash
npm test
```

Useful variations:

```bash
# One spec file
npx playwright test tests/sale-proceeds-calculator-form.spec.ts

# One test case by name (matches the TC0x title)
npx playwright test -g "TC05"

# One browser only
npx playwright test --project=chromium

# Watch it run in a real browser window
npm run test:headed

# Interactive UI mode — step through, inspect locators, time-travel debug
npm run test:ui
```

The site is a live, external, publicly-hosted service, so occasional flakiness (slow loads, transient 503s) is expected — rerun a failed test on its own before assuming it's a real regression.

**If a whole batch of WebKit tests times out locally** (but the same run passes on chromium/firefox, or passes on CI), it's very likely local parallel-worker contention rather than a real bug: `playwright.config.ts` already runs CI serially (`workers: 1`) but defaults to one worker per CPU core locally, and WebKit is the heaviest of the three engines (especially on Windows). Since every test here hits the same real external site rather than a local server, parallelism buys speed at the cost of contention against an already-occasionally-flaky target. Try `npx playwright test --workers=1` to confirm before treating it as a regression.

## How to verify

1. **Read the terminal summary.** Playwright prints a pass/fail count and, for each failure, the assertion that failed plus a call log.
2. **Open the HTML report** for full detail per test — see "How to generate report" below. Each test's page includes:
   - The step-by-step timeline (`test.step` blocks map directly to TC sub-steps, e.g. TC05's two boundary checks).
   - A screenshot and video, automatically captured on failure.
   - A trace (on retry) you can open with `npx playwright show-trace <path>` for a full DOM/network/console timeline.
3. **Check `test.info()` annotations.** TC08 leaves a `todo` annotation instead of failing when it can't determine the PDF export mechanism — these show up in the HTML report under the test and are worth a manual look even on a "passed" run.
4. **Cross-check against `data/sale-proceeds-calculator.data.ts`** when a test fails on copy/text — confirm whether the site's wording changed or a `TODO(verify)` assumption was simply wrong, and update the data file (not the spec) to fix it.

## How to generate report

The `html` reporter is configured by default (`playwright.config.ts`), so every run writes to `playwright-report/`.

```bash
npm test          # runs the suite, writes the report
npm run report    # opens the last report in your browser
```

Or explicitly:

```bash
npx playwright show-report
```

CI (`.github/workflows/playwright.yml`) runs the full suite on every push/PR to `main`/`master` and uploads `playwright-report/` as a build artifact (30-day retention) — download it from the workflow run's **Artifacts** section to view the same report for that CI run.
