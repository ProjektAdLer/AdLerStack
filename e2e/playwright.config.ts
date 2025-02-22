import {defineConfig, devices} from '@playwright/test';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';
import * as path from 'path';


/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
const myEnv = dotenv.config({path: path.resolve(__dirname, '../.env')});
dotenvExpand.expand(myEnv);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    /* allows to only run tests marked as safe */
    grep: process.env.TEST_ENV === 'live' ? /@safe/ : /.*/,

    /* Do not retry and fail on first error. This is because of how AMG tests (currently) work */
    retries: 0,
    maxFailures: 1,

    /* Authoring tool tests are not allowed to run in parallel */
    fullyParallel: false,
    workers: 1,

    testDir: './tests',
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        // baseURL: 'http://127.0.0.1:3000',  // not setting this here as there i no "primary" URL for these tests

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        video: 'on'
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                launchOptions: {
                    headless: false,
                    args: [
                        '--ignore-gpu-blocklist',
                    ],
                },
            }
        }
    ],
});
