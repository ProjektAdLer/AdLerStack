import {expect} from "@playwright/test";
import {test} from "./libs/enhanced_test";
import {enrollInMoodleCourse} from "./libs/moodle_helpers";

// Store shared browser context and authenticated state
let sharedContext;
let sharedPage;

// test.describe.configure({mode: 'serial'});
test.describe("Complete a Learning World", () => {
    test.beforeAll(async ({browser, request, resetEnvironment, uploadWorld}) => {
        // Create persistent context
        sharedContext = await browser.newContext();
        sharedPage = await sharedContext.newPage();

        await resetEnvironment();
        const uploadedWorld = await uploadWorld('completableWorld');
        await enrollInMoodleCourse(
            request,
            process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!,
            process.env._USER_STUDENT_PW!,
            uploadedWorld.worldNameInLms
        );
    });

    test.afterAll(async () => {
        // Close the shared context when done
        await sharedPage?.close();
        await sharedContext?.close();
    });

    test("login to the application", async () => {
        await sharedPage.goto("/");
        await sharedPage.setViewportSize({width: 1920, height: 1080});
        await sharedPage.getByTestId("userName").click();
        await sharedPage
            .getByTestId("userName")
            .fill(process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!);
        await sharedPage.getByTestId("userName").press("Tab");
        await sharedPage.getByTestId("password").fill(process.env._USER_STUDENT_PW!);
        await sharedPage.getByTestId("loginButton").click();

        // Verify login was successful
        await expect(sharedPage.locator("body")).toBeVisible();

        // Store cookies and local storage for future tests
        await sharedPage.context().storageState({path: 'storage-state.json'});
    });

    test("room 2 is not open from the start", async () => {
        await sharedPage.getByRole("button").filter({hasText: /^$/}).nth(1).click();
        await sharedPage
            .getByRole("button", {name: "completableWorld"})
            .first()
            .click();
        await sharedPage.getByRole('button', {name: 'Lernwelt öffnen!'}).click();
        await sharedPage.getByTitle("room 2").click();
        await expect(sharedPage.getByRole('button', {name: 'Lernraum betreten!'})).toHaveCount(0);
    });

    test("open learning room 1a", async () => {
        await sharedPage.getByTestId('rf__node-1').getByRole('button', {name: 'room1a'}).click();
        await sharedPage.getByRole('button', {name: 'Lernraum betreten!'}).click();
        await sharedPage.getByRole('button', {name: 'Weiter zum Lernraum'}).click();
    });

    test("complete Learning element 1", async () => {
        await click3dElement(sharedPage, "learningelement Element 1 1 Point 1");
        // get the button with the name "Lernelement abschließen" and click it
        await sharedPage.getByRole('button', {name: 'Lernelement abschließen'}).click();

        await sharedPage.waitForTimeout(200);
    });

    test("complete Learning element 2", async () => {
        await click3dElement(sharedPage, "learningelement Element 2 1 Point 2");
        await sharedPage.getByRole('button', {name: 'Lernelement abschließen'}).click();
    });

    test("Exit Room 1a", async () => {
        await click3dElement(sharedPage, "exit door 1");
        await sharedPage.getByRole('button', {name: 'zurück zum Lernraum-Menü'}).click();
    });

    test("open learning room 1b", async () => {
        await sharedPage.getByTestId('rf__node-2').getByRole('button', {name: 'room1b'}).click();
        await sharedPage.getByRole('button', {name: 'Lernraum betreten!'}).click();
        await sharedPage.getByRole('button', {name: 'Weiter zum Lernraum'}).click();
    });

    test("Complete the Adaptive Learning Element", async () => {
        await click3dElement(sharedPage, "learningelement adaptivityElement 3");
        await sharedPage.getByRole('button', {name: 'Platzhalter-Icon Platzhalter-'}).click();
        await sharedPage.getByRole('button', {name: 'Platzhalter-Icon Platzhalter-'}).click();
        await sharedPage.getByRole('button', {name: 'Philipp'}).click();
        await sharedPage.getByRole('button', {name: 'Antworten abgeben'}).click();
    });

    test("Reset Page and test if the world is completed", async () => {
        // reset page and clear the cache
        await sharedPage.goto("/");

        await sharedPage.setViewportSize({width: 1920, height: 1080});
        await sharedPage.getByTestId("userName").click();
        await sharedPage
            .getByTestId("userName")
            .fill(process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!);
        await sharedPage.getByTestId("userName").press("Tab");
        await sharedPage.getByTestId("password").fill(process.env._USER_STUDENT_PW!);
        await sharedPage.getByTestId("loginButton").click();

        await sharedPage.getByRole("button").filter({hasText: /^$/}).nth(1).click();
        await sharedPage
            .getByRole("button", {name: "completableWorld"})
            .first()
            .click();
        await sharedPage.getByRole('button', {name: 'Lernwelt öffnen!'}).click();

        await expect(sharedPage.locator('#root')).toContainText('Lernwelt abgeschlossen!');


    });
});

/**
 * Clicks on a 3D element within the accessibility host
 * @param page The Playwright page object
 * @param elementText The text content of the element to click
 */
async function click3dElement(page: any, elementText: string) {
    await page.locator(`#accessibility-host button:has-text("${elementText}")`).dispatchEvent('click');
}