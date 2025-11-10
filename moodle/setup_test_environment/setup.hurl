# Does the per test setup.
# - Create two student users s1 and s2
# - Create two manager users m1 and m2
# - Create one course c1
#   - c1: author: m1, enrolled: s1
#
# Will provide the following variables:
# - moodleAdminToken: Site admin token for Adler admin service
# - s1_username: Username for student 1
# - s1_id: User ID for student 1
# - s2_username: Username for student 2
# - m1_username: Username for manager 1
# - m1_category_id: Category ID for manager 1
# - m2_username: Username for manager 2
# - moodleM1Token: Token for manager 1
# - moodleM2Token: Token for manager 2
# - moodleS1Token: Token for student 1
# - moodleS2Token: Token for student 2
# - course_c1_id: Course ID for course c1 (created by m1)
# - c1_cm_uuid: UUID of a course module in course c1
# - c1_cm_id: Course module ID for a learning element in course c1
# - c1_adaptivity_uuid: UUID of the adaptivity element in c1
# - c1_adaptivity_id: Course module ID for the adaptivity element in c1
# - c1_adaptivity_question1_uuid: uuid of the first question of the adaptivity element

# Initialize variables (needs a fake request)
GET {{host}}/webservice/rest/simpleserver.php
[Options]
variable: c1_cm_uuid=f734f354-6b0a-4102-a19d-57ab6f151146
variable: c1_adaptivity_uuid=b228a001-d5a6-4298-9321-56270b476465
variable: c1_adaptivity_question1_uuid=ac525937-0dd3-45a6-9e31-7e64936db61d

# test login as site admin for adler_admin_service
POST {{host}}/webservice/rest/simpleserver.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_site_admin_login
moodlewsrestformat: json
wsusername: {{admin_username}}
wspassword: {{admin_password}}

HTTP 200
[Captures]
moodleAdminToken: jsonpath "$.token"

[Asserts]
jsonpath "$.token" != ""


# Create users
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_create_users
moodlewsrestformat: json
wstoken: {{moodleAdminToken}}
users[0][username]: s1-{{newUuid}}
users[0][password]: password
users[0][firstname]: Student
users[0][lastname]: One
users[0][email]: s1-{{newUuid}}@example.de
users[1][username]: s2-{{newUuid}}
users[1][password]: password
users[1][firstname]: Student
users[1][lastname]: Two
users[1][email]: s2-{{newUuid}}@example.de
users[2][username]: m1-{{newUuid}}
users[2][password]: password
users[2][firstname]: Manager
users[2][lastname]: One
users[2][email]: m2-{{newUuid}}@example.de
users[3][username]: m2-{{newUuid}}
users[3][password]: password
users[3][firstname]: Manager
users[3][lastname]: Two
users[3][email]: m2-{{newUuid}}@example.de

HTTP 200
[Captures]
s1_username: jsonpath "$.[0].username"
s1_id: jsonpath "$.[0].id"
s2_username: jsonpath "$.[1].username"
m1_username: jsonpath "$.[2].username"
m2_username: jsonpath "$.[3].username"

[Asserts]
jsonpath "$.[0].username" contains "s1-"
jsonpath "$.[1].username" contains "s2-"
jsonpath "$.[2].username" contains "m1-"
jsonpath "$.[3].username" contains "m2-"


# Promote m1 and m2 to manager role
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_declarativesetup_create_course_cat_and_assign_user_role
moodlewsrestformat: json
wstoken: {{moodleAdminToken}}
elements[0][username]: {{m1_username}}
elements[0][role]: adler_manager
elements[1][username]: {{m2_username}}
elements[1][role]: adler_manager

HTTP 200
[Captures]
m1_category_id: jsonpath "$.data[0].category_id"

# {"data":[{"username":"m1-8f3206a5-3969-42a0-94a4-0102779f23f9","role":"adler_manager","category_path":null,"category_id":4},{"username":"m2-d579316a-d1db-4ae8-a03a-189fce37bb78","role":"adler_manager","category_path":null,"category_id":5}]}


# authenticate m1 to get token
POST {{host}}/login/token.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
username: {{m1_username}}
password: password
service: adler_services
HTTP 200
[Captures]
moodleM1Token: jsonpath "$.token"
[Asserts]
jsonpath "$.token" != ""

# authenticate m2 to get token
POST {{host}}/login/token.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
username: {{m2_username}}
password: password
service: adler_services
HTTP 200
[Captures]
moodleM2Token: jsonpath "$.token"
[Asserts]
jsonpath "$.token" != ""

# authenticate s1 to get token
POST {{host}}/login/token.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
username: {{s1_username}}
password: password
service: adler_services
HTTP 200
[Captures]
moodleS1Token: jsonpath "$.token"
[Asserts]
jsonpath "$.token" != ""

# authenticate s2 to get token
POST {{host}}/login/token.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
username: {{s2_username}}
password: password
service: adler_services
HTTP 200
[Captures]
moodleS2Token: jsonpath "$.token"
[Asserts]
jsonpath "$.token" != ""



# Create course c1 with author m1
POST {{host}}/webservice/rest/server.php
[MultipartFormData]
wstoken: {{moodleM1Token}}
wsfunction: local_adler_upload_course
moodlewsrestformat: json
mbz: file,./setup_test_environment/fixtures/testwelt.mbz; application/octet-stream
HTTP 200
[Captures]
course_c1_id: jsonpath "$.data.course_id"

# Enroll s1 in course c1
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: enrol_manual_enrol_users
moodlewsrestformat: json
wstoken: {{moodleAdminToken}}
enrolments[0][roleid]: 5  # student role, there is no api endpoint to convert role name to id
enrolments[0][userid]: {{s1_id}}
enrolments[0][courseid]: {{course_c1_id}}
HTTP 200
[Asserts]
jsonpath "$.exception" not exists

# Get module id of one learning element and the adaptivity element in course c1
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_get_element_ids_by_uuids
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
elements[0][course_id]: {{course_c1_id}}
elements[0][element_type]: cm
elements[0][uuid]: {{c1_cm_uuid}}
elements[1][course_id]: {{course_c1_id}}
elements[1][element_type]: cm
elements[1][uuid]: {{c1_adaptivity_uuid}}
HTTP 200
[Captures]
c1_cm_id: jsonpath "$.data[0].moodle_id"
c1_adaptivity_id: jsonpath "$.data[1].moodle_id"

# complete learning element as s1 to have progress in the course
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_trigger_event_cm_viewed
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
module_id: {{c1_cm_id}}
HTTP 200
[Asserts]
jsonpath "$.data[0].completed" == true
