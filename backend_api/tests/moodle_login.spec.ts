import {expect, test} from '@playwright/test';

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

