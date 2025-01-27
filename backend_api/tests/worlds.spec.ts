import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

let apiToken: string;
let userId: number;

test.beforeAll(async ({ request }) => {
    const loginResponse = await request.get(`/api/Users/Login`, {
        params: {
            UserName: process.env._PLAYWRIGHT_USER_MANAGER_USERNAME,
            Password: process.env._USER_MANAGER_PW
        }
    });
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    apiToken = loginData.lmsToken;

    const userResponse = await request.get(`/api/Player`, {
        headers: { 'token': apiToken }
    });
    expect(userResponse.ok()).toBeTruthy();
    const userData = await userResponse.json();
    userId = userData.userId;
});

test.describe.serial('World lifecycle', () => {
    let initialWorldCount: number;
    let uploadedWorldId: number;

    test('Get initial world count', async ({ request }) => {
        const response = await request.get(`/api/Worlds/author/${userId}`, {
            headers: { 'token': apiToken }
        });
        expect(response.ok()).toBeTruthy();
        const worlds = (await response.json()).worlds;
        initialWorldCount = worlds.length;
    });

    test('Upload world', async ({ request }) => {
        const response = await request.post(`/api/Worlds`, {
            headers: { 'token': apiToken },
            multipart: {
                backupFile: {
                    name: 'testwelt.mbz',
                    mimeType: 'application/octet-stream',
                    buffer: fs.readFileSync(path.join(__dirname, 'fixtures', 'testwelt.mbz'))
                },
                atfFile: {
                    name: 'testwelt.awf',
                    mimeType: 'application/json',
                    buffer: fs.readFileSync(path.join(__dirname, 'fixtures', 'testwelt.json'))
                }
            }
        });
        expect(response.ok()).toBeTruthy();
        const result = await response.json();
        uploadedWorldId = result.worldId;
        expect(uploadedWorldId).toBeTruthy();
    });

    test('Verify world in list', async ({ request }) => {
        const response = await request.get(`/api/Worlds/author/${userId}`, {
            headers: { 'token': apiToken }
        });
        expect(response.ok()).toBeTruthy();
        const worlds = (await response.json()).worlds;
        expect(worlds.length).toBe(initialWorldCount + 1);
        expect(worlds.some(w => w.worldId === uploadedWorldId)).toBeTruthy();
    });

    test('Delete world', async ({ request }) => {
        const response = await request.delete(`/api/Worlds/${uploadedWorldId}`, {
            headers: { 'token': apiToken }
        });
        expect(response.ok()).toBeTruthy();
    });

    test('Verify world deleted', async ({ request }) => {
        const response = await request.get(`/api/Worlds/author/${userId}`, {
            headers: { 'token': apiToken }
        });
        expect(response.ok()).toBeTruthy();
        const worlds = (await response.json()).worlds;
        expect(worlds.length).toBe(initialWorldCount);
        expect(worlds.some(w => w.worldId === uploadedWorldId)).toBeFalsy();
    });
});

test.describe('World delete workflow', () => {
    // Next test suite can follow here
    // Will use same apiToken and userId
});
