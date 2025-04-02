import {expect} from '@playwright/test';
import {test} from "./libs/enhanced_test";
import {enrollInMoodleCourse} from "./libs/moodle_helpers";
import {tabletLandscape} from "./fixtures/viewPorts";

test.describe.serial("Access a Learning Element in 3D", () => {

    test.beforeAll(async ({request, resetEnvironment, uploadWorld}) => {
        await resetEnvironment();

        const uploadedWorld = await uploadWorld('testwelt');

        // Enroll student
        await enrollInMoodleCourse(
            request,
            process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!,
            process.env._USER_STUDENT_PW!,
            uploadedWorld.worldNameInLms
        );
    });

    test('learning world completion will be displayed', async ({page}) => {
        await page.goto('/');
        await page.setViewportSize(tabletLandscape);
        // menus
        await page.getByTestId('userName').fill(process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!);
        await page.getByTestId('password').fill(process.env._USER_STUDENT_PW!);
        await page.getByTestId('loginButton').click();
        await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
        await page.getByRole('button', { name: 'Lernwelt öffnen!' }).click();
        await page.getByTestId('rf__node-1').getByRole('button', { name: 'testraum' }).click();
        await page.getByRole('button', { name: 'Lernraum betreten!' }).click();
        await page.getByRole('button', { name: 'Weiter zum Lernraum' }).click();
        // learning element 1
        await page.getByText('learningelement test_LE 1', {exact: true}).dispatchEvent('click');
        await page.getByRole('button', { name: 'Lernelement abschließen!' }).click();
        // learning element 2 / adaptivity element
        await page.getByText('learningelement adaptivitaet 2', {exact: true}).dispatchEvent('click');
        await page.getByRole('button', { name: 'Platzhalter-Icon Platzhalter-' }).click();
        await page.getByRole('button', { name: 'Platzhalter-Icon Platzhalter-' }).click();
        await page.getByRole('button', { name: 'richtig' }).click();
        await page.getByRole('button', { name: 'Antwort abgeben' }).click();
        await page.getByRole('button', { name: 'CloseButton' }).click();
        // door
        await page.waitForTimeout(1000);
        await page.getByText('exit door 1').dispatchEvent('click');
        // loading screen
        await page.getByRole('button', { name: 'testraum2 betreten' }).click();
        await page.getByRole('button', { name: 'Weiter zum Lernraum' }).click();
        // learning element 3
        await page.getByText('learningelement testElement 3').dispatchEvent('click');
        await page.getByRole('button', { name: 'Lernelement abschließen!' }).click();

        await expect(page.getByText('Lernwelt abgeschlossen!Sie')).toBeVisible();
        await expect(page.locator('div').filter({ hasText: 'Lernwelt abgeschlossen!' }).nth(3)).toBeVisible();
    })
})
