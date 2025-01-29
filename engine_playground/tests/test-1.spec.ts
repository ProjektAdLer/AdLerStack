import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://engine.projekt-adler.eu/');
  await expect(page.locator('h2')).toContainText('Bitte loggen Sie sich ein.');
});