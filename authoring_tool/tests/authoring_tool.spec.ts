import {expect, test} from '@playwright/test';
import {execSync} from 'child_process';
import * as path from 'path';

let apiToken: string;
let userId: number;

test.beforeAll(async ({request}) => {
    // Copy and extract fixture data to authoring tool container
    const fixturesPath = path.resolve(__dirname, 'fixtures/AdLerAuthoring.tar.gz');
    execSync(`docker cp "${fixturesPath}" adler_e2e_tests-authoring-tool-1:/tmp/AdLerAuthoring.tar.gz`);
    execSync(`docker exec adler_e2e_tests-authoring-tool-1 sh -c "mkdir -p /root/.config && tar -xzf /tmp/AdLerAuthoring.tar.gz -C /root/.config"`);

    // Get token
    const loginResponse = await request.get(`http://${process.env._URL_BACKEND}/api/Users/Login`, {
        params: {
            UserName: process.env._PLAYWRIGHT_USER_MANAGER_USERNAME,
            Password: process.env._USER_MANAGER_PW
        }
    });
    if (!loginResponse.ok()) throw new Error(`Login failed with status ${loginResponse.status()}`);

    const loginData = await loginResponse.json();
    if (!loginData.lmsToken) throw new Error('No token in login response');
    apiToken = loginData.lmsToken;

    // Get user details
    const userResponse = await request.get(`http://${process.env._URL_BACKEND}/api/Player`, {
        headers: {
            'token': `${apiToken}`
        }
    });
    if (!userResponse.ok()) throw new Error(`User details failed with status ${userResponse.status()}`);

    const userData = await userResponse.json();
    if (typeof userData.userId !== 'number') throw new Error('Invalid user ID in response');
    userId = userData.userId;
});

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
});

test('Upload world', async ({page, request}) => {
    await page.goto('/MyLearningWorldsOverview');
    await page.getByText('testwelt').last().hover();
    await page.getByRole('button', {name: 'Öffnen'}).click();
    await page.getByRole('button', {name: 'Lernwelt als Moodle-Lernwelt-'}).click();
    await page.getByRole('button', {name: 'Veröffentlichen', exact: true}).click();
    await expect(page.locator('h6')).toContainText('Veröffentlichen erfolgreich', {timeout: 60000});

    // Verify world exists in backend
    const response = await request.get(`http://${process.env._URL_BACKEND}/api/Worlds/author/${userId}`, {
        headers: {
            'token': `${apiToken}`
        }
    });
    expect(response.ok()).toBeTruthy();

    const worlds = (await response.json()).worlds;
    expect(worlds.some(world => world.worldName === 'testwelt')).toBeTruthy();
});

test('List and delete world', async ({page, request}) => {
    // Verify initial state
    const initialResponse = await request.get(`http://${process.env._URL_BACKEND}/api/Worlds/author/${userId}`, {
        headers: {
            'token': `${apiToken}`
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
    const finalResponse = await request.get(`http://${process.env._URL_BACKEND}/api/Worlds/author/${userId}`, {
        headers: {
            'token': `${apiToken}`
        }
    });
    const finalWorlds = (await finalResponse.json()).worlds;
    expect(finalWorlds.length).toBe(0);
});
