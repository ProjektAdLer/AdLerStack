import {readFileSync} from "fs";
import * as path from "path";
import {expect} from '@playwright/test';
import {enrollInMoodleCourse} from "./libs/moodle_helpers";
import {test} from "./libs/testcase_with_credentials";

test.describe.serial('Student access workflow', () => {
    let worldId: number;
    let learningElementId: number;
    let adaptivityElementId: number;

    test.beforeAll(async ({request, managerAuth, studentAuth}) => {
        // Upload world as manager
        const uploadResponse = await request.post('/api/Worlds', {
            headers: {'token': managerAuth.token},
            multipart: {
                backupFile: {
                    name: 'testwelt.mbz',
                    mimeType: 'application/octet-stream',
                    buffer: readFileSync(path.join(__dirname, 'fixtures', 'testwelt.mbz'))
                },
                atfFile: {
                    name: 'testwelt.awf',
                    mimeType: 'application/json',
                    buffer: readFileSync(path.join(__dirname, 'fixtures', 'testwelt.json'))
                }
            }
        });
        console.log('Upload response:', await uploadResponse.text());
        expect(uploadResponse.ok(), 'World upload failed').toBeTruthy();
        const result = await uploadResponse.json();
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
            headers: {'token': studentAuth.token}
        });
        expect(response.ok(), 'Getting world list failed').toBeTruthy();
        const worlds = (await response.json()).worlds;
        expect(worlds.some(w => w.worldId === worldId), 'Uploaded world not found in student list').toBeTruthy();
    });

    test('Student can access world ATF', async ({request, studentAuth}) => {
        const response = await request.get(`/api/Worlds/${worldId}`, {
            headers: {'token': studentAuth.token}
        });
        expect(response.ok(), 'Getting ATF file failed').toBeTruthy();
        const atf = await response.json();
        expect(atf.world.worldName, 'ATF file has no world name').toBeTruthy();

        // Find and store element IDs from ATF
        const normalElement = atf.world.elements.find(e => e.elementCategory === 'text');
        const adaptivityElement = atf.world.elements.find(e => e.elementCategory === 'adaptivity');

        expect(normalElement, 'Learning element not found in ATF').toBeTruthy();
        expect(adaptivityElement, 'Adaptivity element not found in ATF').toBeTruthy();

        learningElementId = normalElement.elementId;
        adaptivityElementId = adaptivityElement.elementId;
    });

    test('Student can get world status', async ({request, studentAuth}) => {
        const response = await request.get(`/api/Worlds/${worldId}/Status`, {
            headers: {'token': studentAuth.token}
        });
        expect(response.ok(), 'Getting world status failed').toBeTruthy();
        const status = await response.json();
        expect(status.worldId, 'Status response missing world ID').toBe(worldId);
        expect(Array.isArray(status.elements), 'Status response missing elements array').toBeTruthy();
    });

    test('Student can get element file paths and access files', async ({request, studentAuth}) => {
        // Test regular learning element
        const pathResponse = await request.get(
            `/api/Elements/FilePath/World/${worldId}/Element/${learningElementId}`,
            {
                headers: {'token': studentAuth.token}
            }
        );
        expect(pathResponse.ok(), `Getting file path for learning element failed`).toBeTruthy();
        const pathData = await pathResponse.json();
        expect(pathData.filePath, `No URL returned for learning element`).toBeTruthy();

        // Access the learning element file
        const fileResponse = await request.get(pathData.filePath, {
            headers: {'token': studentAuth.token}
        });
        expect(fileResponse.ok(), `Accessing file for learning element failed`).toBeTruthy();
        const fileContent = await fileResponse.text();
        expect(fileContent, `File content doesn't match expected value`).toBe('test');
    });

    test('Student can complete learning element', async ({request, studentAuth}) => {
        // Check initial score (should be incomplete)
        const initialScoreResponse = await request.get(
            `/api/Elements/World/${worldId}/Element/${learningElementId}/Score`,
            {
                headers: {'token': studentAuth.token}
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
                    'token': studentAuth.token,
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
                headers: {'token': studentAuth.token}
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
                headers: {'token': studentAuth.token}
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
                headers: {'token': studentAuth.token}
            }
        );

        expect(initialScoreResponse.ok(), 'Getting initial adaptivity element score failed').toBeTruthy();
        const initialAdaptivityElementScore = await initialScoreResponse.json();
        expect(initialAdaptivityElementScore.success, 'Adaptivity element should be incomplete initially').toBeFalsy();

        // Get Adaptivity Element Details
        const adaptivityElementDetails = await request.get(
            `/api/Elements/World/${worldId}/Element/${adaptivityElementId}/Adaptivity`,
            {
                headers: {'token': studentAuth.token}
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
                    'token': studentAuth.token,
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
                headers: {'token': studentAuth.token}
            }
        );

        expect(adaptivityScoreAfterCompletion.ok(), 'Getting initial adaptivity element score failed').toBeTruthy();
        const adaptivityScoreAfterCompletionValue = await adaptivityScoreAfterCompletion.json();
        expect(adaptivityScoreAfterCompletionValue.success, 'Adaptivity element should be incomplete initially').toBeTruthy();
    });

    test.afterAll(async ({request, managerAuth}) => {
        if (worldId) {
            await request.delete(`/api/Worlds/${worldId}`, {
                headers: {'token': managerAuth.token}
            });
        }
    });
});