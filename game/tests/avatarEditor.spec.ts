import {test} from "./libs/enhanced_test";
import {userLogin, navigateToAvatarEditor, userLogout} from "./libs/welcomeScreen_helper"
import {expect} from "@playwright/test";
import {enrollInMoodleCourse} from "./libs/moodle_helpers";
import {viewPorts} from "./libs/viewPorts";

test.describe.serial(`avatar editor`, () => {

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

        test(`user navigates from avatar editor to welcome screen (${width}x${height})`, async ({page}) => {
            await page.setViewportSize({width: width, height: height});
            await userLogin(page);
            const welcomScreenURL = page.url();
            await navigateToAvatarEditor(page);
            await page.getByRole('button', { name: 'Home Icon' }).click();
            await expect(page.url()).toEqual(welcomScreenURL);
        })

        test(`user selects avatar editor categories (${width}x${height})`, async ({page}) =>{
            //TODO: Replace getByRole-Query with getByTestId-Query when button has testid
            await page.setViewportSize({width: width, height: height});
            await userLogin(page);
            await navigateToAvatarEditor(page);
            await page.getByTestId('avatar-editor-category-tab-0').click();
            await expect(await page.getByRole('button', { name: /Frisur/i })).toBeVisible();
            await page.getByTestId('avatar-editor-category-tab-1').click();
            await expect(await page.getByRole('button', { name: /Augenbrauen/i })).toBeVisible();
            await page.getByTestId('avatar-editor-category-tab-2').click();
            await expect(await page.getByRole('button', { name: /Kopfbedeckung/i })).toBeVisible();
            await page.getByTestId('avatar-editor-category-tab-3').click();
            await expect(await page.getByRole('button', { name: /Oberteil/i })).toBeVisible();
            await page.getByTestId('avatar-editor-category-tab-4').click();
            await expect(await page.getByRole('heading', { name: /Hautfarbe/i })).toBeVisible();
        })
    })
})
