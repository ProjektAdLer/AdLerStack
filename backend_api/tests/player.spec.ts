import { expect } from '@playwright/test';
import { test } from './libs/enhanced_test';

test.beforeAll(async ({ resetEnvironment }) => {
    await resetEnvironment();
});

test('Get player data', async ({ request }) => {
    const username = process.env._PLAYWRIGHT_USER_MANAGER_USERNAME;
    const password = process.env._USER_MANAGER_PW;
    
    if (!username || !password) {
        throw new Error('Required environment variables are not set');
    }

    // First get a token by logging in
    const loginResponse = await request.get('/api/Users/Login', {
        params: {
            UserName: username,
            Password: password
        }
    });
    expect(loginResponse.ok(), 'Login request failed').toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.lmsToken, 'No token in login response').toBeTruthy();
    
    // Then use the token to get player data
    const playerResponse = await request.get('/api/Player', {
        headers: {
            token: loginData.lmsToken
        }
    });
    expect(playerResponse.ok(), 'Player request failed').toBeTruthy();
    
    const playerData = await playerResponse.json();
    
    expect(playerData.lmsUserName).toBe(username);
});

