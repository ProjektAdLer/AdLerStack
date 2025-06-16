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
    const worldName = "testwelt";

    test('Login', async ({page}) => {
        await page.goto('/MyLearningWorldsOverview');
        await page.waitForTimeout(1000);  // somehow during first start a delay of at least 250ms is needed
        await page.locator('#LmsLoginButton\\.OpenLmsDialog\\.Button').click();
        await page.locator('#LmsLoginDialog\\.BackendUrl\\.TextField').click();
        await page.locator('#LmsLoginDialog\\.BackendUrl\\.TextField').press('ControlOrMeta+a');
        await page.locator('#LmsLoginDialog\\.BackendUrl\\.TextField').fill(`http://${process.env._URL_BACKEND}/api`);
        await page.locator('#LmsLoginDialog\\.Username\\.TextField').click();
        await page.locator('#LmsLoginDialog\\.Username\\.TextField').press('ControlOrMeta+a');
        await page.locator('#LmsLoginDialog\\.Username\\.TextField').fill(`${process.env._PLAYWRIGHT_USER_MANAGER_USERNAME}`);
        await page.locator('#LmsLoginDialog\\.Password\\.TextField').click();
        await page.locator('#LmsLoginDialog\\.Password\\.TextField').fill(`${process.env._USER_MANAGER_PW}`);
        await page.locator('#LmsLoginDialog\\.SubmitForm\\.Button').click();
        await expect(page.locator('#LmsLoginDialog\\.LoggedInUserName\\.Text'))
            .toContainText(process.env._PLAYWRIGHT_USER_MANAGER_USERNAME);

        await new Promise(resolve => setTimeout(resolve, 5000));  // Workaround for backend initialization bug in 2.4.2-rc.4
    });

    test('Upload world', async ({page, request, managerAuth}) => {
        await page.goto('/MyLearningWorldsOverview');
        await page.getByText(worldName).last().hover();
        await page.locator('#LearningWorldCard\\.OpenLearningWorld\\.Button-' + worldName).click();
        await page.waitForTimeout(1000);  // without it might happen that the button is clicked to early
        await page.locator('#HeaderBar\\.GenerateLearningWorld\\.Button').click();
        await page.locator('#GenericCancellationConfirmationDialog\\.Submit\\.Button').click();
        await expect(page.locator('#UploadSuccessfulDialog\\.DialogContent\\.Text'))
            .toBeVisible({timeout: 30000});

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
        await page.waitForTimeout(1000);
        await page.locator('#LmsLoginButton\\.OpenLmsDialog\\.Button').click();
      //  await expect(page.locator('#LmsLoginDialog.Dialog.Paper')).toContainText('testwelt');
        await page.getByRole('button', { name: 'Moodle-Kurs löschen' }).click();
        await page.getByRole('button', { name: 'Ja' }).click();

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