import { expect } from '@playwright/test';
import * as path from 'path';
import {readFileSync} from 'fs';
import {test} from "./libs/testcase_with_credentials";

test.describe.serial('World lifecycle', () => {
    let initialWorldCount: number;
    let uploadedWorldId: number;

    test.beforeAll(async ({ resetEnvironment }) => {
        await resetEnvironment();
    });

    test('Get initial world count', async ({ request, managerAuth }) => {
        const response = await request.get(`/api/Worlds/author/${(await managerAuth()).userId}`, {
            headers: { 'token': (await managerAuth()).token }
        });
        expect(response.ok(), 'Failed to get initial world list').toBeTruthy();
        const worlds = (await response.json()).worlds;
        console.log('World list response:', (await response.text()));
        initialWorldCount = worlds.length;
    });

    test('Upload world', async ({ request, managerAuth }) => {
        const response = await request.post(`/api/Worlds`, {
            headers: { 'token': (await managerAuth()).token },
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
        expect(response.ok(), 'World upload request failed').toBeTruthy();
        const result = await response.json();
        uploadedWorldId = result.worldId;
        expect(uploadedWorldId, 'No world ID returned after upload').toBeTruthy();
    });

    test('Verify world in list', async ({ request, managerAuth }) => {
        const response = await request.get(`/api/Worlds/author/${(await managerAuth()).userId}`, {
            headers: { 'token': (await managerAuth()).token }
        });
        expect(response.ok(), 'Failed to get world list after upload').toBeTruthy();
        const worlds = (await response.json()).worlds;
        expect(worlds.length, 'World count did not increase after upload').toBe(initialWorldCount + 1);
        expect(worlds.some(w => w.worldId === uploadedWorldId), 'Uploaded world not found in list').toBeTruthy();
    });

    test('Delete world', async ({ request, managerAuth }) => {
        const response = await request.delete(`/api/Worlds/${uploadedWorldId}`, {
            headers: { 'token': (await managerAuth()).token }
        });
        expect(response.ok(), 'World deletion request failed').toBeTruthy();
    });

    test('Verify world deleted', async ({ request, managerAuth }) => {
        const response = await request.get(`/api/Worlds/author/${(await managerAuth()).userId}`, {
            headers: { 'token': (await managerAuth()).token }
        });
        expect(response.ok(), 'Failed to get world list after deletion').toBeTruthy();
        const worlds = (await response.json()).worlds;
        expect(worlds.length, 'World count did not decrease after deletion').toBe(initialWorldCount);
        expect(worlds.some(w => w.worldId === uploadedWorldId), 'Deleted world still exists in list').toBeFalsy();
    });
});


// https://github.com/ProjektAdLer/AdLerBackend/issues/29
// test.describe('Student unauthorized actions', () => {
//     let worldId: number;
//     let managerUserId: number;
//
//
//     test.beforeAll(async ({ resetEnvironment }) => {
//         await resetEnvironment();
//     });
//
//     test.beforeEach(async ({ request, managerAuth }) => {
//         // Setup: Upload fresh world before EACH test
//         const uploadResponse = await request.post('/api/Worlds', {
//             headers: { 'token': (await managerAuth()).token },
//             multipart: {
//                 backupFile: {
//                     name: 'testwelt.mbz',
//                     mimeType: 'application/octet-stream',
//                     buffer: readFileSync(path.join(__dirname, 'fixtures', 'testwelt.mbz'))
//                 },
//                 atfFile: {
//                     name: 'testwelt.awf',
//                     mimeType: 'application/json',
//                     buffer: readFileSync(path.join(__dirname, 'fixtures', 'testwelt.json'))
//                 }
//             }
//         });
//         expect(uploadResponse.ok(), 'World setup upload failed').toBeTruthy();
//         const result = await uploadResponse.json();
//         worldId = result.worldId;
//         managerUserId = (await managerAuth()).userId;
//     });
//
//     test.afterEach(async ({ request, managerAuth }) => {
//         // Teardown: Delete world after EACH test
//         if (worldId) {
//             await request.delete(`/api/Worlds/${worldId}`, {
//                 headers: { 'token': (await managerAuth()).token }
//             });
//         }
//     });
//
//     test('Student cannot delete world uploaded by manager', async ({ request, studentAuth }) => {
//         const response = await request.delete(`/api/Worlds/${worldId}`, {
//             headers: { 'token': (await studentAuth()).token }
//         });
//         console.log('Response:', await response.text());
//         expect(response.ok(), 'Student should not be able to delete world').toBeFalsy();
//         expect(response.status(), 'Should return 403 Forbidden').toBe(403);
//     });
// });
