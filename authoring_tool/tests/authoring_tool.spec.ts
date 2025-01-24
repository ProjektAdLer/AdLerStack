import { test, expect } from '@playwright/test';

test('Login', async ({ page }) => {
  await page.goto('/MyLearningWorldsOverview');
  await page.getByRole('button', { name: 'Einloggen auf AdLer-Server' }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().press('ControlOrMeta+a');
  await page.getByRole('textbox').first().fill(`http://${process.env._URL_BACKEND}/api`);
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).press('ControlOrMeta+a');
  await page.getByRole('textbox').nth(1).fill('manager');
  await page.locator('input[type="password"]').click();
  await page.locator('input[type="password"]').fill(`${process.env._USER_MANAGER_PW}`);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByRole('dialog')).toContainText('Erfolgreich');
});