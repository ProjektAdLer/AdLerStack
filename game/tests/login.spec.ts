import {expect} from '@playwright/test';
import {test} from './libs/enhanced_test';

test.beforeAll(async ({ resetEnvironment }) => {
    await resetEnvironment();
});

test('test', async ({page}) => {
    await page.goto('/');
    await page.getByTestId('userName').click();
    await page.getByTestId('userName').fill(process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!);
    await page.getByTestId('userName').press('Tab');
    await page.getByTestId('password').fill(process.env._USER_STUDENT_PW!);
    await page.getByTestId('loginButton').click();
    await expect(page.getByTestId('login-button')).toBeVisible();
});

