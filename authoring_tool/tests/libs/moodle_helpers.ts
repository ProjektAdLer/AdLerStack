// noinspection DuplicatedCode

import {APIRequestContext, expect} from '@playwright/test';

export async function enrollInMoodleCourse(
    request: APIRequestContext,
    username: string,
    password: string,
    worldNameInLms: string
): Promise<void> {
    // Get Moodle token
    const tokenResponse = await request.post(`http://${process.env._URL_MOODLE}/login/token.php`, {
        form: {
            username: username,
            password: password,
            service: 'moodle_mobile_app'
        }
    });
    const tokenData = await tokenResponse.json();
    expect(tokenData.token, 'No Moodle token received').toBeTruthy();

    // Get available courses
    const coursesResponse = await request.post(`http://${process.env._URL_MOODLE}/webservice/rest/server.php`, {
        form: {
            wstoken: tokenData.token,
            wsfunction: 'core_course_search_courses',
            moodlewsrestformat: 'json',
            criterianame: 'search',
            criteriavalue: worldNameInLms,
        }
    });
    const coursesText = await coursesResponse.text();
    const coursesResult = JSON.parse(coursesText);

    if (!coursesResult.total || !coursesResult.courses || coursesResult.courses.length === 0) {
        throw new Error(`No courses found matching ${worldNameInLms}`);
    }

    const matchingCourse = coursesResult.courses
        .filter(course => course.fullname === worldNameInLms)
        .sort((a, b) => b.id - a.id)[0];

    if (!matchingCourse) {
        throw new Error(`No course found with name ${worldNameInLms}`);
    }

    // Enroll student
    const enrollResponse = await request.post(`http://${process.env._URL_MOODLE}/webservice/rest/server.php`, {
        form: {
            wstoken: tokenData.token,
            wsfunction: 'enrol_self_enrol_user',
            moodlewsrestformat: 'json',
            courseid: matchingCourse.id
        }
    });
    const enrollResultText = await enrollResponse.text();
    const enrollResult = JSON.parse(enrollResultText);

    if ('exception' in enrollResult) {
        throw new Error(`Moodle enrollment failed: ${enrollResult.message}`);
    }
    expect(enrollResult.status, 'Enrollment not successful').toBe(true);
}