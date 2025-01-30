import { test, expect } from '@playwright/test';

test('Can access the engine', async ({ page }) => {
  await page.goto('http://app:80/');
  await expect(page.locator('h2')).toContainText('Bitte loggen Sie sich ein.');
});