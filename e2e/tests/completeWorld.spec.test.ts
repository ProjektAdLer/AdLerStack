import {expect} from "@playwright/test";
import {test} from "./libs/enhanced_test";
import * as path from 'path';
import {execSync} from "child_process";

test.describe.serial("Complete a Learning World", () => {
    const worldName = "completableWorld";

    test.beforeAll(async ({resetEnvironment}) => {
        await resetEnvironment();
    });

    test.describe.serial('Upload world in Authoring Tool', () => {
        test.beforeAll(async () => {
            // Restore world to Authoring tool. Copy and extract fixture data to authoring tool container
            const fixturesPath = path.resolve(__dirname, 'fixtures/AdLerAuthoring.tar.gz');
            execSync(`docker compose cp "${fixturesPath}" authoring-tool:/tmp/AdLerAuthoring.tar.gz`);
            execSync(`docker compose exec authoring-tool sh -c "mkdir -p /root/.config && tar -xzf /tmp/AdLerAuthoring.tar.gz -C /root/.config"`);
            execSync(`docker compose restart authoring-tool && docker compose up -d --wait authoring-tool`);
        });

        test('Login', async ({page}) => {
            await page.goto(`http://${process.env._URL_AUTHORING_TOOL}/MyLearningWorldsOverview`);
            await page.waitForTimeout(1000);

            // Click login button
            await page.locator('#LmsLoginButton\\.OpenLmsDialog\\.Button').click();

            // Fill backend URL field
            await page.locator('#LmsLoginDialog\\.BackendUrl\\.TextField').click();
            await page.locator('#LmsLoginDialog\\.BackendUrl\\.TextField').fill(`http://${process.env._URL_BACKEND}/api`);

            // Fill username field
            await page.locator('#LmsLoginDialog\\.Username\\.TextField').click();
            await page.locator('#LmsLoginDialog\\.Username\\.TextField').fill(`${process.env._PLAYWRIGHT_USER_MANAGER_USERNAME}`);

            // Fill password field
            await page.locator('#LmsLoginDialog\\.Password\\.TextField').click();
            await page.locator('#LmsLoginDialog\\.Password\\.TextField').fill(`${process.env._USER_MANAGER_PW}`);

            // Click submit button
            await page.locator('#LmsLoginDialog\\.SubmitForm\\.Button').click();

            // Verify successful login
            await expect(page.locator('#LmsLoginDialog\\.LoggedInUserName\\.Text'))
                .toContainText(process.env._PLAYWRIGHT_USER_MANAGER_USERNAME);
        });

        test('Upload world', async ({page, request, managerAuth}) => {
            await page.goto(`http://${process.env._URL_AUTHORING_TOOL}/MyLearningWorldsOverview`);
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
            expect(worlds.some(world => world.worldName === worldName)).toBeTruthy();
        });
    });

    test.describe.serial('Enroll in course via Moodle UI', () => {
        // Store shared browser context and authenticated page
        let sharedContext;
        let sharedPage;

        test.beforeAll(async ({browser}, testInfo) => {
            sharedContext = await browser.newContext({
                recordVideo: {
                    dir: testInfo.outputPath('video.webm'),
                }
            });
            await sharedContext.tracing.start({
                screenshots: true,
                snapshots: true,
                sources: true
            });

            sharedPage = await sharedContext.newPage();
        });

        test.afterAll(async ({}, testInfo) => {
            // Stop tracing and save the trace file
            await sharedContext.tracing.stop({
                path: testInfo.outputPath('trace.zip')
            });

            // Close the shared context when done
            await sharedPage?.close();
            await sharedContext?.close();

            const path = await sharedPage.video()!.path();
            testInfo.attachments.push({name: 'video', path, contentType: 'video/webm'});

            // Add trace as attachment
            testInfo.attachments.push({
                name: 'trace',
                path: testInfo.outputPath('trace.zip'),
                contentType: 'application/zip'
            });
        });

        test('Login as student', async () => {
            await sharedPage.goto(`http://${process.env._URL_MOODLE}/`);
            await sharedPage.getByRole('link', {name: 'Log in'}).click();
            await sharedPage.getByRole('textbox', {name: 'Username'}).click();
            await sharedPage.getByRole('textbox', {name: 'Username'}).fill(process.env._PLAYWRIGHT_USER_STUDENT_USERNAME);
            await sharedPage.locator('input[type="password"]').click();
            await sharedPage.locator('input[type="password"]').fill(process.env._USER_STUDENT_PW);
            await sharedPage.getByRole('button', {name: 'Log in'}).click();

            // Wait for login to complete by checking for a user-specific element
            await expect(sharedPage.locator('.usermenu')).toBeVisible({timeout: 10000});
        });

        test('Enroll in course', async () => {
            await sharedPage.goto(`http://${process.env._URL_MOODLE}/?redirect=0`);
            await sharedPage.getByRole('link', {name: worldName}).click();
            await sharedPage.getByRole('button', {name: 'Enrol me'}).click();
            await expect(sharedPage.locator('h1')).toContainText(worldName);
            await expect(sharedPage.getByRole('alert')).toContainText('You are enrolled in the course');
        });
    });

    test.describe.serial('Play world in Game', () => {
        // Store shared browser context and authenticated state
        let sharedContext;
        let sharedPage;

        test.beforeAll(async ({browser}, testInfo) => {
            // Create persistent context
            sharedContext = await browser.newContext({
                recordVideo: {
                    dir: testInfo.outputPath('video.webm'),
                }
            });
            await sharedContext.tracing.start({
                screenshots: true,
                snapshots: true,
                sources: true
            });

            sharedPage = await sharedContext.newPage();
        });

        test.afterAll(async ({}, testInfo) => {
            // Stop tracing and save the trace file
            await sharedContext.tracing.stop({
                path: testInfo.outputPath('trace.zip')
            });

            // Close the shared context when done
            await sharedPage?.close();
            await sharedContext?.close();

            const path = await sharedPage.video()!.path();
            testInfo.attachments.push({name: 'video', path, contentType: 'video/webm'});

            // Add trace as attachment
            testInfo.attachments.push({
                name: 'trace',
                path: testInfo.outputPath('trace.zip'),
                contentType: 'application/zip'
            });
        });

        test("login to the application", async () => {
            await sharedPage.goto(`http://${process.env._URL_3D}/`);
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
            await sharedPage.goto(`http://${process.env._URL_3D}/`);

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


})
;

/**
 * Clicks on a 3D element within the accessibility host
 * @param page The Playwright page object
 * @param elementText The text content of the element to click
 */
async function click3dElement(page: any, elementText: string) {
    await page.locator(`#accessibility-host button:has-text("${elementText}")`).dispatchEvent('click');
}