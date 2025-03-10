import {test} from './libs/enhanced_test';


test.describe.serial('Play 3D World', () => {
    test.beforeAll(async ({resetEnvironment}) => {
        await resetEnvironment();
    });

    test("Test 3D Acceleration", async ({page, playwright, context}) => {
        await page.goto('/');
        await page.getByTestId("loginButton").click();
        await page.getByRole("button", {name: "Zum Lernwelt-Menü"}).click();
        await page.getByRole("button", {name: "New World"}).click();
        await page.getByRole("button", {name: "Lernwelt öffnen!"}).click();
        await page
            .getByTestId("rf__node-1")
            .getByRole("button", {name: "Lernraum Bilder"})
            .click();
        await page.getByRole("button", {name: "Lernraum betreten!"}).click();
        await page.waitForSelector('button:has-text("Weiter zum Lernraum")', {
            timeout: 12000,
        });
        await page.getByRole("button", {name: "Weiter zum Lernraum"}).click();
        await page.locator("canvas").click({
            position: {
                x: 750,
                y: 354,
            },
        });
        // await page.waitForTimeout(5000);

    });
});