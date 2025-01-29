import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://app/');
  await expect(page.locator('h2')).toContainText('Bitte loggen Sie sich ein.');
});