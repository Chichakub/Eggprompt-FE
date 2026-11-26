# Cypress — Release 1 (38 UI cases)

The only spec is `e2e/release1-excel.full.cy.js`. It contains 38 real frontend tests mapped to the original 41-case workbook. Email-dependent cases are excluded by request:

- R1-02-03: reset password using an actual email link.
- R1-02-04: reject a used reset link.
- R1-05-01: create a farm with a new Farm Admin and verify the email.

These cases are marked **Excluded** in `release1-coverage.html`, not passed or pending. The source workbook is unchanged. Negative farm-form cases still use a synthetic `example.invalid` address to check validation/duplicate rejection; they do not run successful registration or email workflows.

## Commands

```sh
npm run cy:exam:open   # Interactive browser, 38 cases
npm run cy:exam        # Visible browser + video
npm run cy:run         # Fast background run
npm run cy:coverage    # Workbook mapping, including the 3 exclusions
```

Run in Eggprompt-FE. Default timing: 350 ms before primary actions, 500 ms between cases and 20 ms per character. Override `CYPRESS_STEP_DELAY_MS`, `CYPRESS_PAGE_PAUSE_MS` or `CYPRESS_TYPE_DELAY_MS` if needed. Fast mode removes these delays but still waits for actual network responses.

Credentials are read from ignored `cypress.env.json`. No inbox address, email confirmation or link paste is required.

## Prerequisites and data

Required fixtures: farms PM-EXAM-A/B and accounts pm.admin.a, pm.staff.a, pm.finance.a, pm.admin.b. Missing fixtures can be prepared with Eggprompt-BE/tests/postman/release1-CP26CS1/setup-excel41-fixtures.sql in the QA database. It inserts missing fixtures without resetting existing passwords. A BEFORE ALL failure means feature tests did not run.

The suite creates real, isolated CY41 QA records and prepares an inspection house when farm A or B has none. Password changes use new run-specific QA accounts. Requests use the actual backend; no API responses are mocked.

## Frontend deployment

Deploy the frontend changes for mandatory health-loss causes and horizontal house selectors. Cypress scripts stay on the development computer. The VM must serve the corrected frontend before those UI fixes can pass against its URL.

For checking local frontend changes against the actual backend:

```sh
node node_modules/vite/bin/vite.js --config scripts/vite-exam.config.mjs
# Another Terminal:
CYPRESS_BASE_URL=http://127.0.0.1:4175/ npm run cy:run
```

## Results

- `results/latest-release1.json`: actual results for the 38-case scope, plus excluded Excel IDs.
- `videos/release1-excel.full.cy.js.mp4`: run-mode video.
- `release1-coverage.html`: source workbook mapping.
- `results/fixtures-<run>.json`: created fixture IDs.

Report **38 / 38 passed** only when the actual run has 38 passed and zero failed/pending/skipped. Older reports named latest-excel41.json are historical and belong to the previous scope. `CYPRESS_EXAM_CASES=R1-04-03,R1-06-01` selects a subset and leaves other in-scope cases pending.

To inspect cleanup candidates from one run:

```sh
node scripts/cleanup-cypress-exam.mjs <10-digit-run-id>
```

After reviewing exact names, add `--apply`. Cleanup uses normal soft-delete APIs for the selected run's fixtures; it does not bypass dependencies with SQL.
