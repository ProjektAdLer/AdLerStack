import {expect, test as base} from '@playwright/test';

type AuthData = {
    token: string;
    userId: number;
};

type ManagerAuthFixture = {
    managerAuth: AuthData;
};

type StudentAuthFixture = {
    studentAuth: AuthData;
};

async function loginAndFetchUser(
    request: typeof base['prototype']['request'],
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

export const test = base.extend<ManagerAuthFixture & StudentAuthFixture>({
    managerAuth: async ({request}, use) => {
        const manager = await loginAndFetchUser(
            request,
            process.env._PLAYWRIGHT_USER_MANAGER_USERNAME!,
            process.env._USER_MANAGER_PW!
        );
        await use(manager);
    },

    studentAuth: async ({request}, use) => {
        const student = await loginAndFetchUser(
            request,
            process.env._PLAYWRIGHT_USER_STUDENT_USERNAME!,
            process.env._USER_STUDENT_PW!
        );
        await use(student);
    }
});
