import {expect} from "@playwright/test";
import {test} from "./libs/enhanced_test";
import {enrollInMoodleCourse} from "./libs/moodle_helpers";
import {tabletLandscape, viewPorts} from "./fixtures/viewPorts";

test.describe.serial("Behaviour of StoryElements in 3D", () => {

    test.beforeAll(async ({request, resetEnvironment, uploadWorld}) => {
        await resetEnvironment();
        const uploadedWorld = await uploadWorld('storywelt');
        // Enroll student
        await enrollInMoodleCourse(
            request,
            process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!,
            process.env._USER_STUDENT_PW!,
            uploadedWorld.worldNameInLms
        );
    })

    viewPorts.forEach(
        ({width, height}) => {
            test(`Intro Cutscene is visible with width ${width}, and height ${height}`, async ({ page }) => {
                await page.goto('/');
                await page.setViewportSize({width: width, height: height});
                await page.getByTestId('userName').fill(process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!);
                await page.getByTestId('password').fill(process.env._USER_STUDENT_PW!);
                await page.getByTestId('loginButton').click();
                await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
                await page.getByRole('button', { name: 'StoryWelt_Test' }).click();
                await page.getByRole('button', { name: 'Lernwelt öffnen!' }).click();
                await page.getByRole('button', { name: 'Lernraum betreten!' }).click();
                await page.getByRole('button', { name: 'Weiter zum Lernraum' }).click();
                await page.waitForTimeout(3000);
                await expect(page.getByText('Intro', { exact: true })).toBeVisible();
                await expect(page.locator('#root')).toContainText('Intro');
            });
        }
    )

    test(`Outro Cutscene triggers if required learning space points are scored`, async ({page}) => {
        await page.goto('/');
        await page.setViewportSize(tabletLandscape);
        await page.getByTestId('userName').fill(process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!);
        await page.getByTestId('password').fill(process.env._USER_STUDENT_PW!);
        await page.getByTestId('loginButton').click();
        await page.getByRole('button').filter({hasText: /^$/}).nth(1).click();
        await page.getByRole('button', {name: 'StoryWelt_Test', exact: true}).click();
        await page.getByRole('button', {name: 'Lernwelt öffnen!'}).click();
        await page.getByTestId('rf__node-2').getByRole('button', {name: '1b_Outro'}).click();
        await page.getByRole('button', {name: 'Lernraum betreten!'}).click();
        await page.getByRole('button', {name: 'Weiter zum Lernraum'}).click();
        await expect(page.locator('section')).toContainText('0 von 1');
        await page.getByText('learningelement LE 2 2', {exact: true}).dispatchEvent('click');
        await page.getByRole('button', {name: 'Lernelement abschließen!'}).click();
        await page.waitForTimeout(3000);
        await expect(page.locator('#root')).toContainText('Outro');
        await expect(page.getByTestId('npcImage')).toBeVisible();
        await expect(page.locator('section')).toContainText('1 von 1');
    })

})