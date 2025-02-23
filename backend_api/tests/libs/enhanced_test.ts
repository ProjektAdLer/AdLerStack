import {test as baseTest, expect} from '@playwright/test';
import {execSync} from 'child_process';

type AuthData = {
    token: string;
    userId: number;
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
    const loginResponse = await request.get('/api/Users/Login', {
        params: {UserName: username, Password: password}
    });
    expect(loginResponse.ok(), 'Login request failed').toBeTruthy();
    const loginData = await loginResponse.json();

    // 2. Retrieve user details
    const userResponse = await request.get('/api/Player', {
        headers: {token: loginData.lmsToken}
    });
    expect(userResponse.ok(), 'User details request failed').toBeTruthy();
    const userData = await userResponse.json();

    // 3. Return relevant auth data
    return {token: loginData.lmsToken, userId: userData.userId};
}


let cachedManagerAuth: AuthData | undefined;
let cachedStudentAuth: AuthData | undefined;

// TODO: port these changes to all projects
// TODO: refactor all code to use the new *auth fixtures

const test = baseTest.extend<ManagerAuthFixture & StudentAuthFixture & { resetEnvironment: () => Promise<void> }>({
    resetEnvironment: async ({}, use, testInfo) => {
        const resetFn = async () => {
            const currentTimeout = testInfo.timeout;
            testInfo.setTimeout(currentTimeout + 90000);

            if (process.platform !== 'linux') {
                throw new Error('Environment reset is only supported on Linux');
            }
            console.log('Resetting environment. This will take around half a minute...');

            const output = execSync('./docker-volumes-snapshot.sh restore 2>&1', {
                encoding: 'utf-8',
                cwd: '..',
            });
            console.log(output);

            // This is crucial! Without it there is a strange timing issue with subsequent stuff in the same test/beforeX block.
            await new Promise(resolve => setTimeout(resolve, 1));

            // Clear cached auth after reset
            cachedManagerAuth = undefined;
            cachedStudentAuth = undefined;
        };

        await use(resetFn);
    },

    managerAuth: async ({ request }, use) => {
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

    studentAuth: async ({ request }, use) => {
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
