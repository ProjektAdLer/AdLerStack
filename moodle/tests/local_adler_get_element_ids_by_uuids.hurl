##############################################
# TEST 1: S2 queries element from C1 (not enrolled)
# Should be BLOCKED - s2 is not enrolled in c1
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_get_element_ids_by_uuids
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
elements: [{"course_id":"{{course_c1_id}}","element_type":"cm","uuid":"{{c1_cm_uuid}}"}]

HTTP 200
[Asserts]
# If vulnerable, would return element data. If secure, should return error or empty.
# We'll check the response for security issues
jsonpath "$.exception" exists

##############################################
# TEST 2: M2 queries element from C1 (not course owner)
# Should be BLOCKED - m2 doesn't own c1 (m1 does)
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_get_element_ids_by_uuids
moodlewsrestformat: json
wstoken: {{moodleM2Token}}
elements: [{"course_id":"{{course_c1_id}}","element_type":"cm","uuid":"{{c1_cm_uuid}}"}]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 3: S2 queries with C1 UUID but different course_id
# Should be BLOCKED - attempts to bypass enrollment check via wrong course_id
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_get_element_ids_by_uuids
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
elements: [{"course_id":"999999","element_type":"cm","uuid":"{{c1_cm_uuid}}"}]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 4: SQL injection in course_id
# Payload: 1' OR '1'='1
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_get_element_ids_by_uuids
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
elements: [{"course_id":"1' OR '1'='1","element_type":"cm","uuid":"{{c1_cm_uuid}}"}]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 5: SQL injection in UUID
# Payload: abc' OR '1'='1
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_get_element_ids_by_uuids
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
elements: [{"course_id":"{{course_c1_id}}","element_type":"cm","uuid":"abc' OR '1'='1"}]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 6: Empty UUID
# Should handle gracefully or reject
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_get_element_ids_by_uuids
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
elements: [{"course_id":"{{course_c1_id}}","element_type":"cm","uuid":""}]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 7: Wildcard UUID (*)
# Could return all elements if not properly validated
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_get_element_ids_by_uuids
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
elements: [{"course_id":"{{course_c1_id}}","element_type":"cm","uuid":"*"}]

HTTP 200
[Asserts]
jsonpath "$.exception" exists
