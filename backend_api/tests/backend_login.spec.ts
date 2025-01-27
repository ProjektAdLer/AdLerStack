import {test, expect} from '@playwright/test';

test('Backend login and user verification @safe', async ({request}) => {
    // Get login token
    const loginResponse = await request.get(`http://${process.env._URL_BACKEND}/api/Users/Login`, {
        params: {
            UserName: process.env._PLAYWRIGHT_USER_MANAGER_USERNAME,
            Password: process.env._USER_MANAGER_PW
        }
    });
    expect(loginResponse.ok(), 'Login request failed').toBeTruthy();
    
    const loginData = await loginResponse.json();
    expect(loginData.lmsToken, 'No token in login response').toBeTruthy();
    const apiToken = loginData.lmsToken;
});