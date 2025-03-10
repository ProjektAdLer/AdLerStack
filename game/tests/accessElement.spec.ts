import {expect} from '@playwright/test';
import {enrollInMoodleCourse} from "./libs/moodle_helpers";
import {test} from "./libs/enhanced_test";

test.describe.serial("Access a Learning Element in 3D", () => {

    test.beforeAll(async ({request, resetEnvironment, uploadWorld}) => {
        // request: Objekt von Playwright, das HTTP-Anfragen senden kann

        // resetEnvironment: Funktion, die die Testumgebung zurücksetzt. Dazu haben wir WSL aufgesetzt

        // uploadWorld: Funktion, die eine Welt hochlädt und Informationen darüber zurückgibt
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

    // empty test to trigge the beforeAll
    test('empty test', async () => {
        expect(true).toBeTruthy();
    });

    test('Student can Acces first Learning Element in the Room', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('userName').click();
        await page.getByTestId('userName').click();
        await page.getByTestId('userName').fill('integration_test_student');
        await page.getByTestId('password').click();
        await page.getByTestId('password').fill('Student1234!1234');
        await page.getByTestId('password').click();
        await page.getByTestId('loginButton').click();
        await page.getByRole('button').filter({ hasText: /^$/ }).nth(1).click();
        await page.getByRole('button', { name: 'testwelt' }).click();
        await page.getByRole('button', { name: 'Lernwelt öffnen!' }).click();
        await page.getByTestId('rf__node-1').getByRole('button', { name: 'testraum' }).click();
        await page.getByRole('button', { name: 'Lernraum betreten!' }).click();
        await page.getByRole('button', { name: 'Weiter zum Lernraum' }).click();
        await page.getByRole('button', { name: 'Weiter zum Lernraum' }).click();
    });
})