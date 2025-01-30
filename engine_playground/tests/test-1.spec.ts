import { test, expect } from '@playwright/test';

test('Can access the engine', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.locator('h2')).toContainText('Bitte loggen Sie sich ein.');
});

test('Chrome GPU', async ({ page }) => {
  await page.goto('chrome://gpu/');
  await page.waitForTimeout(5000);
});