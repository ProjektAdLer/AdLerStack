import {test} from "./libs/enhanced_test";
import {userLogin, userLogout, navigateToAvatarEditor, navigateToLearningWorldMenu} from "./libs/welcomeScreen_helper"
import {expect} from "@playwright/test";
import {enrollInMoodleCourse} from "./libs/moodle_helpers";
import {viewPorts} from "./libs/viewPorts";

test.beforeAll(async ({ request, resetEnvironment, uploadWorld }) => {
    await resetEnvironment();
    const uploadedWorld = await uploadWorld('testwelt');
    await enrollInMoodleCourse(
        request,
        process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!,
        process.env._USER_STUDENT_PW!,
        uploadedWorld.worldNameInLms
    );
});

viewPorts.forEach(({width, height}) => {

    test(`user logs in (${width}x${height})`, async ({page}) => {
        await page.setViewportSize({width: width, height: height});
        await userLogin(page);
        await expect(page.getByTestId("login-button")).toBeVisible();
    })

    test(`user logs out (${width}x${height})`, async ({page}) => {
        await page.setViewportSize({width: width, height: height});
        await userLogin(page);
        await userLogout(page);
        await expect(page.getByTestId("userName")).toBeVisible()
        await expect(page.getByTestId("password")).toBeVisible()
    })

    test(`user navigates to learning world menu (${width}x${height})`, async ({page}) => {
        await page.setViewportSize({width: width, height: height});
        await userLogin(page);
        await navigateToLearningWorldMenu(page);
        await expect(page.url()).toContain("worldmenu");
        await expect(page.getByRole('button', { name: 'testwelt' })).toBeVisible();
    })

    test(`user navigates to avatar-editor (${width}x${height})`, async ({page}) => {
        await page.setViewportSize({width: width, height: height});
        await userLogin(page);
        await navigateToAvatarEditor(page);
        await expect(page.url()).toContain("avatarEditor");
        await expect(page.locator("canvas")).toBeVisible();
    })
})
