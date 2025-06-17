import {expect} from '@playwright/test';
import {execSync} from 'child_process';
import * as path from 'path';
import {test} from './libs/enhanced_test';

test.beforeAll(async ({resetEnvironment}) => {
    await resetEnvironment();

    // Copy and extract fixture data to authoring tool container
    const fixturesPath = path.resolve(__dirname, 'fixtures/AdLerAuthoring.tar.gz');
    execSync(`docker compose cp "${fixturesPath}" authoring-tool:/tmp/AdLerAuthoring.tar.gz`);
    execSync(`docker compose exec authoring-tool sh -c "mkdir -p /root/.config && tar -xzf /tmp/AdLerAuthoring.tar.gz -C /root/.config"`);
    execSync(`docker compose restart authoring-tool && docker compose up -d --wait authoring-tool`);
});

test.describe.serial('World lifecycle', () => {
    test('Login', async ({page}) => {
        await page.goto('/MyLearningWorldsOverview');
        await page.waitForTimeout(1000);  // somehow during first start a delay of at least 250ms is needed
        await page.getByRole('button', {name: 'Einloggen auf AdLer-Server'}).click();
        await page.getByRole('textbox').first().click();
        await page.getByRole('textbox').first().press('ControlOrMeta+a');
        await page.getByRole('textbox').first().fill(`http://${process.env._URL_BACKEND}/api`);
        await page.getByRole('textbox').nth(1).click();
        await page.getByRole('textbox').nth(1).press('ControlOrMeta+a');
        await page.getByRole('textbox').nth(1).fill(`${process.env._PLAYWRIGHT_USER_MANAGER_USERNAME}`);
        await page.locator('input[type="password"]').click();
        await page.locator('input[type="password"]').fill(`${process.env._USER_MANAGER_PW}`);
        await page.getByRole('button', {name: 'Anmelden'}).click();
        await expect(page.getByRole('dialog')).toContainText('Erfolgreich');

        await new Promise(resolve => setTimeout(resolve, 5000));  // Workaround for backend initialization bug in 2.4.2-rc.4
    });

    test('Upload world', async ({page, request, managerAuth}) => {
        await page.goto('/MyLearningWorldsOverview');
        await page.getByText('testwelt').last().hover();
        await page.getByRole('button', {name: 'Öffnen'}).click();
        await page.getByRole('button', {name: 'Lernwelt als Moodle-Lernwelt-'}).click();
        await page.getByRole('button', {name: 'Veröffentlichen', exact: true}).click();
        await expect(page.locator('h6')).toContainText('Veröffentlichen erfolgreich', {timeout: 30000});

        // Verify world exists in backend
        const response = await request.get(`http://${process.env._URL_BACKEND}/api/Worlds/author/${(await managerAuth()).userId}`, {
            headers: {
                'token': `${(await managerAuth()).token}`
            }
        });
        expect(response.ok()).toBeTruthy();

        const worlds = (await response.json()).worlds;
        expect(worlds.some(world => world.worldName === 'testwelt')).toBeTruthy();
    });

    test('List and delete world', async ({page, request, managerAuth}) => {
        // Verify initial state
        const initialResponse = await request.get(`http://${process.env._URL_BACKEND}/api/Worlds/author/${(await managerAuth()).userId}`, {
            headers: {
                'token': `${(await managerAuth()).token}`
            }
        });
        const initialWorlds = (await initialResponse.json()).worlds;
        expect(initialWorlds.length).toBe(1);

        // UI delete steps
        await page.goto('/MyLearningWorldsOverview');
        await page.getByRole('button', {name: 'Einloggen auf AdLer-Server'}).click();
        await expect(page.getByRole('dialog')).toContainText('testwelt');
        await page.getByRole('button', {name: 'Moodle-Kurs löschen'}).click();
        await page.getByRole('button', {name: 'Ja'}).click();

        // Wait for world to disappear from dialog
        // await expect(
        //   page.getByRole('dialog').getByText('testwelt')
        // ).toBeHidden({ timeout: 10000 });

        // work around for complicated check (as no labels are provided by the application)
        await page.waitForTimeout(2000);  // a minimum of 500ms delay is needed

        // Verify final state
        const finalResponse = await request.get(`http://${process.env._URL_BACKEND}/api/Worlds/author/${(await managerAuth()).userId}`, {
            headers: {
                'token': `${(await managerAuth()).token}`
            }
        });
        const finalWorlds = (await finalResponse.json()).worlds;
        expect(finalWorlds.length).toBe(0);
    });
});