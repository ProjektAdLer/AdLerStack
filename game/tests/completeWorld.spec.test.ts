import {expect} from "@playwright/test";
import {test} from "./libs/enhanced_test";
import {enrollInMoodleCourse} from "./libs/moodle_helpers";

test.describe.serial("Complete a Learning World", () => {
    // test.beforeAll(async ({request, resetEnvironment, uploadWorld}) => {
    //
    //     // await resetEnvironment();
    //
    //     const uploadedWorld = await uploadWorld('completableWorld');
    //
    //     await enrollInMoodleCourse(
    //         request,
    //         process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!,
    //         process.env._USER_STUDENT_PW!,
    //         uploadedWorld.worldNameInLms
    //     );
    // });

    // empty test to trigger the beforeAll
    test("empty test", async () => {
        expect(true).toBeTruthy();
    });

    test("room 2 is not open from the start", async ({page}) => {
        await page.goto("/");
        await page.setViewportSize({width: 1920, height: 1080});
        await page.getByTestId("userName").click();
        await page
            .getByTestId("userName")
            .fill(process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!);
        await page.getByTestId("userName").press("Tab");
        await page.getByTestId("password").fill(process.env._USER_STUDENT_PW!);
        await page.getByTestId("loginButton").click();
        await page.locator("body").click();
        await page.getByRole("button").filter({hasText: /^$/}).nth(1).click();
        await page
            .getByRole("button", {name: "completableWorld"})
            .first()
            .click();
        await page.getByRole('button', {name: 'Lernwelt öffnen!'}).click();
        await page.getByTitle("room 2").click();
        await expect(page.getByRole('button', {name: 'Lernraum betreten!'})).toHaveCount(0);
    });
});
