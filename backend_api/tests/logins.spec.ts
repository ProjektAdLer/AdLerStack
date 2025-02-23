import { expect } from '@playwright/test';
import { test } from './libs/enhanced_test';

test.beforeAll(async ({ resetEnvironment }) => {
    await resetEnvironment();
});

test('Backend login and user verification', async ({ request }) => {
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
    expect(typeof loginData.lmsToken).toBe('string');
    expect(loginData.lmsToken.length).toBeGreaterThan(0);
});

test('Test Moodle login for adler_services', async ({request}) => {
    // Get Moodle token
    const loginResponse = await request.post(`http://${process.env._URL_MOODLE}/login/token.php`, {
        form: {
            username: process.env._PLAYWRIGHT_USER_MANAGER_USERNAME,
            password: process.env._USER_MANAGER_PW,
            service: 'adler_services',
        },
    });
    expect(loginResponse.ok(), 'Login request failed').toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.token, 'No token in response').toBeTruthy();
    const moodleToken = loginData.token;

    // Verify token works
    const siteInfoResponse = await request.post(`http://${process.env._URL_MOODLE}/webservice/rest/server.php`, {
        form: {
            wstoken: moodleToken,
            wsfunction: 'core_webservice_get_site_info',
            moodlewsrestformat: 'json',
        },
    });
    expect(siteInfoResponse.ok(), 'Site info request failed').toBeTruthy();
    const siteInfo = await siteInfoResponse.json();
    expect(siteInfo.sitename, 'No sitename in response').toBeTruthy();
});