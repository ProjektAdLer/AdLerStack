import {Page} from "@playwright/test";

export async function userLogin(
    page: Page,
    username: string = process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!,
    password: string = process.env._USER_STUDENT_PW!,
) {
    await page.goto('/');
    await page.getByTestId('userName').click();
    await page.getByTestId('userName').fill(username);
    await page.getByTestId('userName').press('Tab');
    await page.getByTestId('password').fill(password);
    await page.getByTestId('loginButton').click();
}

export async function userLogout(
    page: Page
) {
    await page.getByTestId("logout").click();
}

export async function navigateToLearningWorldMenu(page: Page) {
    //TODO: Replace with getByTestId-Query when button has testid
    await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
}

export async function navigateToAvatarEditor(page: Page) {
    //TODO: Replace with getByTestId-Query when button has testid
    await page.getByRole('button').filter({ hasText: /^$/ }).nth(2).click();
}