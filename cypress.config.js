import { defineConfig } from 'cypress';
import fs from 'node:fs';
const delay = (key, fallback, max) => Math.max(0, Math.min(max, Number(process.env[key] ?? fallback)));
const timing = {
  stepDelayMs: delay('CYPRESS_STEP_DELAY_MS', 350, 5000),
  pagePauseMs: delay('CYPRESS_PAGE_PAUSE_MS', 500, 15000),
  typeDelayMs: delay('CYPRESS_TYPE_DELAY_MS', 20, 500),
};


export default defineConfig({
  viewportWidth: 1440,
  viewportHeight: 1000,
  defaultCommandTimeout: 12000,
  responseTimeout: 30000,
  keystrokeDelay: timing.typeDelayMs,
  video: true,
  expose: { ...timing, examCases: (process.env.CYPRESS_EXAM_CASES || '').split(',').filter(Boolean) },
  videosFolder: 'cypress/videos',
  e2e: {
    baseUrl: 'https://bscit.sit.kmutt.ac.th/capstone26/cp26cs1/',
    supportFile: false,
    specPattern: 'cypress/e2e/release1-excel.full.cy.js',
    setupNodeEvents(on, config) {
      on('task', {
        examFailure({id,message}) { console.log(`${id}: ${message}`);return null; },
        examState(state) {
          fs.writeFileSync('cypress/exam-state.json', JSON.stringify(state, null, 2), { mode: 0o600 });
          fs.mkdirSync('cypress/results',{recursive:true});
          fs.writeFileSync(`cypress/results/fixtures-${state.run}.json`,JSON.stringify(state,null,2),{mode:0o600});
          return null;
        },
      });
      on('after:run', results => {
        if (!results?.runs) return;
        fs.mkdirSync('cypress/results', { recursive: true });
        const tests = results.runs.flatMap(run => run.tests.map(test => ({
          id: test.title.join(' ').match(/R1-\d{2}-\d{2}/)?.[0],
          title: test.title.join(' / '), state: test.state,
          error: test.displayError ? test.displayError.replace(/Bearer\s+\S+/g, 'Bearer [REDACTED]').slice(0, 2000) : null,
        })));
        fs.writeFileSync('cypress/results/latest-release1.json', JSON.stringify({
          finishedAt: new Date().toISOString(), frontendUrl: config.baseUrl, mode: 'Real frontend and backend; email tests excluded',
          excludedExcelCases: ['R1-02-03','R1-02-04','R1-05-01'],
          total: results.totalTests, passed: results.totalPassed, failed: results.totalFailed,
          pending: results.totalPending, skipped: results.totalSkipped, tests,
        }, null, 2));
      });
      return config;
    },
  },
});
