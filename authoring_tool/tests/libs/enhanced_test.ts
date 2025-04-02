// noinspection DuplicatedCode

import {test as baseTest, expect} from '@playwright/test';
import {execSync} from 'child_process';
import {readFileSync} from 'fs';
import * as path from 'path';

type AuthData = {
    token: string;
    userId: number;
};

type WorldUploadResult = {
    worldId: number;
    worldNameInLms: string;
};

type UploadWorldFixture = {
    uploadWorld: (worldFileName: string) => Promise<WorldUploadResult>;
};

type ManagerAuthFixture = {
    managerAuth: () => Promise<AuthData>;
};

type StudentAuthFixture = {
    studentAuth: () => Promise<AuthData>;
};

async function loginAndFetchUser(
    request: typeof baseTest['prototype']['request'],
    username: string,
    password: string
): Promise<AuthData> {
    // 1. Login
    const loginResponse = await request.get(`http://${process.env._URL_BACKEND}/api/Users/Login`, {
        params: {UserName: username, Password: password}
    });
    expect(loginResponse.ok(), 'Login request failed').toBeTruthy();
    const loginData = await loginResponse.json();

    // 2. Retrieve user details
    const userResponse = await request.get(`http://${process.env._URL_BACKEND}/api/Player`, {
        headers: {token: loginData.lmsToken}
    });
    expect(userResponse.ok(), 'User details request failed').toBeTruthy();
    const userData = await userResponse.json();

    // 3. Return relevant auth data
    return {token: loginData.lmsToken, userId: userData.userId};
}


let cachedManagerAuth: AuthData | undefined;
let cachedStudentAuth: AuthData | undefined;

const test = baseTest.extend<
    UploadWorldFixture &
    ManagerAuthFixture &
    StudentAuthFixture &
    { resetEnvironment: () => Promise<void> }
>({
    uploadWorld: async ({request, managerAuth}, use) => {
        await use(async (worldFileName: string) => {
            // Get base name without extension
            const baseFileName = path.basename(worldFileName, path.extname(worldFileName));

            // Build file paths
            const mbzFilePath = path.join(__dirname, '..', 'fixtures', `${baseFileName}.mbz`);
            const awfFilePath = path.join(__dirname, '..', 'fixtures', `${baseFileName}.json`);

            // Upload world as manager
            const uploadResponse = await request.post(`http://${process.env._URL_BACKEND}/api/Worlds`, {
                headers: {'token': (await managerAuth()).token},
                multipart: {
                    backupFile: {
                        name: `${baseFileName}.mbz`,
                        mimeType: 'application/octet-stream',
                        buffer: readFileSync(mbzFilePath)
                    },
                    atfFile: {
                        name: `${baseFileName}.awf`,
                        mimeType: 'application/json',
                        buffer: readFileSync(awfFilePath)
                    }
                }
            });

            console.log('Upload response:', await uploadResponse.text());
            expect(uploadResponse.ok(), 'World upload failed').toBeTruthy();
            return await uploadResponse.json();
        });
    },

    resetEnvironment: async ({}, use, testInfo) => {
        const resetFn = async () => {
            const currentTimeout = testInfo.timeout;
            testInfo.setTimeout(currentTimeout + 90000);

            if (process.platform !== 'linux' && process.platform !== 'darwin') {
                throw new Error('Environment reset is only supported on Linux and macOS.');
            }
            console.log('Resetting environment. This will take around half a minute...');

            try {
                const output = execSync('./docker-volumes-snapshot.sh restore 2>&1', {
                    encoding: 'utf-8',
                    cwd: '..',
                    stdio: ['inherit', 'pipe', 'pipe'],
                });
                console.log('Script output:', output);
            } catch (error) {
                console.error('Error details:', {
                    message: error.message,
                    status: error.status,
                    stdout: error.stdout,
                    stderr: error.stderr
                });
                throw error;
            }

            // This is crucial! Without it there is a strange timing issue with subsequent stuff in the same test/beforeX block.
            await new Promise(resolve => setTimeout(resolve, 100));

            // Clear cached auth after reset
            cachedManagerAuth = undefined;
            cachedStudentAuth = undefined;
        };

        await use(resetFn);
    },

    managerAuth: async ({request}, use) => {
        await use(async () => {
            if (!cachedManagerAuth) {
                cachedManagerAuth = await loginAndFetchUser(
                    request,
                    process.env._PLAYWRIGHT_USER_MANAGER_USERNAME!,
                    process.env._USER_MANAGER_PW!
                );
            }
            return cachedManagerAuth;
        });
    },

    studentAuth: async ({request}, use) => {
        await use(async () => {
            if (!cachedStudentAuth) {
                cachedStudentAuth = await loginAndFetchUser(
                    request,
                    process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!,
                    process.env._USER_STUDENT_PW!
                );
            }
            return cachedStudentAuth;
        });
    },
});

export {test};
