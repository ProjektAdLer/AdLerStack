import {test, expect} from '@playwright/test';

test('Response contains a valid token @safe', async ({request}) => {
    const response = await request.post(`/login/token.php`, {
        form: {
            username: process.env._MOODLE_USER,
            password: process.env._MOODLE_PW,
            service: 'moodle_mobile_app',
        },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.token).toBeTruthy();
    let moodleToken = body.token;


    const response2 = await request.post(`/webservice/rest/server.php`, {
        form: {
            wstoken: moodleToken,
            wsfunction: 'core_webservice_get_site_info',
            moodlewsrestformat: 'json',
        },
    });
    expect(response2.ok()).toBeTruthy();
    const body2 = await response2.json();
    expect(body2.sitename).toBeTruthy();
});