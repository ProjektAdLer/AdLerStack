import {expect} from '@playwright/test';
import {test} from "./libs/enhanced_test";

test.describe.serial("Access a Learning Element in 3D", () => {

    // test.beforeAll(async ({request, resetEnvironment, uploadWorld}) => {
    //     // request: Objekt von Playwright, das HTTP-Anfragen senden kann
    //
    //     // resetEnvironment: Funktion, die die Testumgebung zurücksetzt. Dazu haben wir WSL aufgesetzt
    //
    //     // uploadWorld: Funktion, die eine Welt hochlädt und Informationen darüber zurückgibt
    //     await resetEnvironment();
    //
    //     const uploadedWorld = await uploadWorld('testwelt');
    //
    //     // Enroll student
    //     await enrollInMoodleCourse(
    //         request,
    //         process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!,
    //         process.env._USER_STUDENT_PW!,
    //         uploadedWorld.worldNameInLms
    //     );
    // });

    // empty test to trigge the beforeAll
    test('empty test', async () => {
        expect(true).toBeTruthy();
    });

    test('Student can Acces first Learning Element in the Room', async ({page}) => {
        // So kommt man zu dem "BaseUrl", welche in den Projekteinstellungen gesetzt wurde. In unserem Fall die AdLer
        // Engine
        await page.goto('/');
        // All das wurde von dem Codegenerator erstellt
        await page.setViewportSize({width: 1920, height: 1080});
        await page.getByTestId('userName').fill('integration_test_student');
        await page.getByTestId('password').fill('Student1234!1234');
        await page.getByTestId('loginButton').click();
        await page.getByRole('button').filter({hasText: /^$/}).nth(1).click();
        await page.getByRole('button', {name: 'testwelt'}).click();
        await page.getByRole('button', {name: 'Lernwelt öffnen!'}).click();
        await page.getByTestId('rf__node-1').getByRole('button', {name: 'testraum'}).click();
        await page.getByRole('button', {name: 'Lernraum betreten!'}).click();
        await page.getByRole('button', {name: 'Weiter zum Lernraum'}).click();

        // Das Lernelement über die Accessibility-Funktion öffnen
        await page.locator('#accessibility-host > button:nth-child(1)').dispatchEvent('click');

        // Ein Assert. Dieser ist ebenfalls mit dem Generator erstellt worden
        await expect(page.getByRole('paragraph')).toContainText('test');
    });
})