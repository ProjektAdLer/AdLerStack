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
})