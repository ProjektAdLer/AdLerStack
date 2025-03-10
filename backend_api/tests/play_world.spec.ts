
import {expect} from '@playwright/test';
import {enrollInMoodleCourse} from "./libs/moodle_helpers";
import {test} from "./libs/enhanced_test";

test.describe.serial('Play world', () => {
    let worldId: number;
    let learningElementId: number;
    let adaptivityElementId: number;
    let elementInRoom2Id: number;

    test.beforeAll(async ({request, resetEnvironment, uploadWorld}) => {
        await resetEnvironment();

        const result = await uploadWorld('testwelt');
        worldId = result.worldId;

        // Enroll student
        await enrollInMoodleCourse(
            request,
            process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!,
            process.env._USER_STUDENT_PW!,
            result.worldNameInLms
        );
    });

    test('Student can see enrolled world', async ({request, studentAuth}) => {
        const response = await request.get('/api/Worlds', {
            headers: {'token': (await studentAuth()).token}
        });
        expect(response.ok(), 'Getting world list failed').toBeTruthy();
        const worlds = (await response.json()).worlds;
        expect(worlds.some(w => w.worldId === worldId), 'Uploaded world not found in student list').toBeTruthy();
    });

    test('Student can access world ATF', async ({request, studentAuth}) => {
        const response = await request.get(`/api/Worlds/${worldId}`, {
            headers: {'token': (await studentAuth()).token}
        });
        expect(response.ok(), 'Getting ATF file failed').toBeTruthy();
        const atf = await response.json();
        expect(atf.world.worldName, 'ATF file has no world name').toBeTruthy();

        // Find and store element IDs from ATF
        // We find the element by name for now, but this is not ideal
        const normalElement = atf.world.elements.find(e => e.elementName === 'test_LE');
        const adaptivityElement = atf.world.elements.find(e => e.elementName === 'adaptivitaet');
        const elementInRoom2 = atf.world.elements.find(e => e.elementName === 'testElement');

        expect(normalElement, 'Learning element not found in ATF').toBeTruthy();
        expect(adaptivityElement, 'Adaptivity element not found in ATF').toBeTruthy();

        learningElementId = normalElement.elementId;
        adaptivityElementId = adaptivityElement.elementId;
        elementInRoom2Id = elementInRoom2.elementId;
    });

    test('Student can get world status', async ({request, studentAuth}) => {
        const response = await request.get(`/api/Worlds/${worldId}/Status`, {
            headers: {'token': (await studentAuth()).token}
        });
        expect(response.ok(), 'Getting world status failed').toBeTruthy();
        const status = await response.json();
        expect(status.worldId, 'Status response missing world ID').toBe(worldId);
        expect(Array.isArray(status.elements), 'Status response missing elements array').toBeTruthy();
    });

    test('Student can get element file paths and access files of element in Room 1', async ({request, studentAuth}) => {
        // Test regular learning element
        const pathResponse = await request.get(
            `/api/Elements/FilePath/World/${worldId}/Element/${learningElementId}`,
            {
                headers: {'token': (await studentAuth()).token}
            }
        );
        expect(pathResponse.ok(), `Getting file path for learning element failed`).toBeTruthy();
        const pathData = await pathResponse.json();
        expect(pathData.filePath, `No URL returned for learning element`).toBeTruthy();

        // Access the learning element file
        const fileResponse = await request.get(pathData.filePath, {
            headers: {'token': (await studentAuth()).token}
        });
        expect(fileResponse.ok(), `Accessing file for learning element failed`).toBeTruthy();
        const fileContent = await fileResponse.text();
        expect(fileContent, `File content doesn't match expected value`).toBe('test');
    });

    test("Student can NOT get element file paths and access files of element in Room 2", async ({
                                                                                                    request,
                                                                                                    studentAuth
                                                                                                }) => {

        const pathResponse = await request.get(
            `/api/Elements/FilePath/World/${worldId}/Element/${elementInRoom2Id}`,
            {
                headers: {'token': (await studentAuth()).token}
            }
        );
        expect(pathResponse.status(), `Element 2 in Room 2 is supposed to be locken, but fround to be open`).toBe(403);

    });

    test('Student can complete learning element', async ({request, studentAuth}) => {
        // Check initial score (should be incomplete)
        const initialScoreResponse = await request.get(
            `/api/Elements/World/${worldId}/Element/${learningElementId}/Score`,
            {
                headers: {'token': (await studentAuth()).token}
            }
        );
        expect(initialScoreResponse.ok(), 'Getting initial score failed').toBeTruthy();
        const initialScore = await initialScoreResponse.json();
        expect(initialScore.success, 'Element should be incomplete initially').toBeFalsy();

        // Complete the element
        const completeResponse = await request.patch(
            `/api/Elements/World/${worldId}/Element/${learningElementId}`,
            {
                headers: {
                    'token': (await studentAuth()).token,
                    'Content-Type': 'application/json'
                },
                data: {serializedXapiEvent: null}
            }
        );
        expect(completeResponse.ok(), 'Completing element failed').toBeTruthy();
        const completeResult = await completeResponse.json();
        expect(completeResult.isSuccess, 'Element completion should be successful').toBeTruthy();

        // Verify element is now completed
        const finalScoreResponse = await request.get(
            `/api/Elements/World/${worldId}/Element/${learningElementId}/Score`,
            {
                headers: {'token': (await studentAuth()).token}
            }
        );
        expect(finalScoreResponse.ok(), 'Getting final score failed').toBeTruthy();
        const finalScore = await finalScoreResponse.json();
        expect(finalScore.success, 'Element should be completed after scoring').toBeTruthy();
    });

    test("Student can get adaptivity element content", async ({request, studentAuth}) => {
        const response = await request.get(
            `/api/Elements/World/${worldId}/Element/${adaptivityElementId}/Adaptivity`,
            {
                headers: {'token': (await studentAuth()).token}
            }
        );

        expect(response.ok(), 'Getting adaptivity element content failed').toBeTruthy();
        const adaptivityElementContent = await response.json();
        expect(adaptivityElementContent, 'Adaptivity element content not found').toBeTruthy();

        // TODO an sich könnte man hier auf Testen, ob der content auch die Strings enthält, die im AMG gesetzt wurden.
    });

    test("Student can complete adaptivity element", async ({request, studentAuth}) => {
        // Get initial adaptivity element score (should be incomplete)
        const initialScoreResponse = await request.get(
            `/api/Elements/World/${worldId}/Element/${adaptivityElementId}/Score`,
            {
                headers: {'token': (await studentAuth()).token}
            }
        );

        expect(initialScoreResponse.ok(), 'Getting initial adaptivity element score failed').toBeTruthy();
        const initialAdaptivityElementScore = await initialScoreResponse.json();
        expect(initialAdaptivityElementScore.success, 'Adaptivity element should be incomplete initially').toBeFalsy();

        // Get Adaptivity Element Details
        const adaptivityElementDetails = await request.get(
            `/api/Elements/World/${worldId}/Element/${adaptivityElementId}/Adaptivity`,
            {
                headers: {'token': (await studentAuth()).token}
            }
        );
        expect(adaptivityElementDetails.ok(), 'Getting adaptivity element details failed').toBeTruthy();
        const adaptivityElement = await adaptivityElementDetails.json();
        expect(adaptivityElement, 'Adaptivity element not found').toBeTruthy();

        // Complete the adaptivity element
        const completeResponse = await request.patch(
            `/api/Elements/World/${worldId}/Element/${adaptivityElementId}/Question/1`,
            {
                headers: {
                    'token': (await studentAuth()).token,
                    'Content-Type': 'text/json'
                },
                data: "[true,false]"
            }
        );
        expect(completeResponse.ok(), 'Completing adaptivity element failed').toBeTruthy();
        const completeResult = await completeResponse.json();
        expect(completeResult.elementScore.success, 'Adaptivity element completion should be successful').toBeTruthy();

        // Double check, if the element is marked as completed using the default Endpoint for all elements
        // Get initial adaptivity element score (should be incomplete)
        const adaptivityScoreAfterCompletion = await request.get(
            `/api/Elements/World/${worldId}/Element/${adaptivityElementId}/Score`,
            {
                headers: {'token': (await studentAuth()).token}
            }
        );

        expect(adaptivityScoreAfterCompletion.ok(), 'Getting initial adaptivity element score failed').toBeTruthy();
        const adaptivityScoreAfterCompletionValue = await adaptivityScoreAfterCompletion.json();
        expect(adaptivityScoreAfterCompletionValue.success, 'Adaptivity element should be incomplete initially').toBeTruthy();
    });

    test("Element 2 in Room 2 sould now be accessible", async ({request, studentAuth}) => {
        const pathResponse = await request.get(
            `/api/Elements/FilePath/World/${worldId}/Element/${elementInRoom2Id}`,
            {
                headers: {'token': (await studentAuth()).token}
            }
        );
        expect(pathResponse.ok(), `Getting file path for element in Room 2 failed`).toBeTruthy();
        const pathData = await pathResponse.json();
        expect(pathData.filePath, `No URL returned for element in Room 2`).toBeTruthy();

        // Access the element file
        const fileResponse = await request.get(pathData.filePath, {
            headers: {'token': (await studentAuth()).token}
        });
        expect(fileResponse.ok(), `Accessing file for element in Room 2 failed`).toBeTruthy();
        const fileContent = await fileResponse.text();
        expect(fileContent, `File content doesn't match expected value`).toBe('test');
    });

    test.afterAll(async ({request, managerAuth}) => {
        if (worldId) {
            await request.delete(`/api/Worlds/${worldId}`, {
                headers: {'token': (await managerAuth()).token}
            });
        }
    });
});