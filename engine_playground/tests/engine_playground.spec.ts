import test from "@playwright/test";

test('test', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByTestId('loginButton').click();
    await page.getByRole('button', { name: 'Zum Lernwelt-Menü' }).click();
    await page.getByRole('button', { name: 'New World' }).click();
    await page.getByRole('button', { name: 'Lernwelt öffnen!' }).click();
    await page.getByTestId('rf__node-1').getByRole('button', { name: 'Lernraum Bilder' }).click();
    await page.getByRole('button', { name: 'Lernraum betreten!' }).click();
    await page.waitForSelector('button:has-text("Weiter zum Lernraum")', { timeout: 12000 });
    await page.getByRole('button', { name: 'Weiter zum Lernraum' }).click();
    await page.locator('canvas').click({
      position: {
        x: 750,
        y: 354
      }
    });
    // wait for console log "[INFO]: [StateMachine]: Transitioned from 1 to 0 after action 1"
    await page.waitForEvent('console', {
        predicate: msg => msg.text().includes('Transitioned from 1 to 0 after action 1'),
        timeout: 5000
      });
    await page.locator('canvas').click({
      position: {
        x: 666,
        y: 475
      }
    });

    await page.waitForEvent('console', {
      predicate: msg => msg.text().includes('Transitioned from 1 to 0 after action 1'),
      timeout: 5000
    });

    const button = await page.locator('button:has-text("Bild1")');

    await button.dispatchEvent('click');

    await page.waitForTimeout(1000);
  });