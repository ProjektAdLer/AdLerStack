import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:8001');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Autorentool 2.2.0/);
});

test('login', async ({ page }) => {
  await page.goto('http://localhost:8001/MyLearningWorldsOverview');
  await page.getByRole('button', { name: 'Einloggen auf AdLer-Server' }).click();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).press('ControlOrMeta+a');
  await page.getByRole('textbox').nth(1).fill('manager');
  await page.locator('input[type="password"]').click();
  await page.locator('input[type="password"]').fill('Manager1234!1234');
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().press('ControlOrMeta+a');
  await page.getByRole('textbox').first().fill('https://dev.api.projekt-adler.eu/api');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByText('Erfolgreich angemeldet als')).toBeVisible();
});



test('e2e', async ({ page }) => {
  await page.goto('http://localhost:8001/MyLearningWorldsOverview');
  await page.getByRole('button', { name: 'Lernwelt erstellen' }).click();
  await page.getByRole('textbox').first().fill('testweltabcdefg');
  await page.getByRole('button', { name: 'Ok' }).click();
  await page.getByTitle('Lernraum erstellen').click();
  await page.locator('form').getByRole('textbox').fill('testraum');
  await page.getByRole('button', { name: 'Ok' }).click();
  await page.locator("//div[contains(@class, 'mud-drop-zone')][4]").click();
  await page.getByRole('textbox').first().fill('testelement');
  await page.getByRole('button', { name: 'Lernmaterial auswählen bzw. ä' }).click();
  await page.getByRole('cell', { name: 'example2.png' }).click();
  await page.getByRole('button', { name: 'Ok' }).click();
  await page.getByRole('button', { name: 'Lernwelt als Moodle-Lernwelt-' }).click();
  await page.getByRole('button', { name: 'Veröffentlichen', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Veröffentlichen erfolgreich' })).toBeVisible({timeout: 20000});
  await page.goto('https://dev.moodle.projekt-adler.eu/');
  await page.getByRole('link', { name: 'Log in' }).click();
  await page.getByPlaceholder('Username').click();
  await page.getByPlaceholder('Username').fill('student');
  await page.getByPlaceholder('Username').press('Tab');
  await page.getByPlaceholder('Password').fill('Student1234!1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.getByRole('menuitem', { name: 'My courses' }).click();
  await page.getByRole('menuitem', { name: 'Home' }).click();
  await page.getByRole('link', { name: 'testweltabcdefg' }).click();
  await page.getByRole('button', { name: 'Enrol me' }).click();
  await page.goto('https://dev.engine.projekt-adler.eu/');
  await page.getByTestId('userName').click();
  await page.getByTestId('userName').fill('student');
  await page.getByTestId('userName').press('Tab');
  await page.getByTestId('password').fill('Student1234!1234');
  await page.getByTestId('password').press('Enter');
  await page.getByTestId('loginButton').click();
  await page.getByRole('button', { name: 'zum Lernwelt-Menü' }).click();
  await expect(page.getByRole('list')).toContainText('testweltabcdefg');
  await page.getByRole('button', { name: 'testweltabcdefg' }).click();
});