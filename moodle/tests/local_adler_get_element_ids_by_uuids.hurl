##############################################
# TEST 0: Valid request - S1 queries element from C1 (enrolled)
# POSITIVE TEST: S1 is enrolled in C1, should successfully get element IDs
# Expected: HTTP 200 with valid element data, no exception
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_get_element_ids_by_uuids
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
elements[0][course_id]: {{course_c1_id}}
elements[0][element_type]: cm
elements[0][uuid]: {{c1_cm_uuid}}

HTTP 200
[Asserts]
# Should NOT have an exception - this is a valid request
jsonpath "$.exception" not exists
# Should return element data
jsonpath "$.data" count > 0

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
elements[0][course_id]: {{course_c1_id}}
elements[0][element_type]: cm
elements[0][uuid]: {{c1_cm_uuid}}

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
elements[0][course_id]: {{course_c1_id}}
elements[0][element_type]: cm
elements[0][uuid]: {{c1_cm_uuid}}

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
elements[0][course_id]: 999999
elements[0][element_type]: cm
elements[0][uuid]: {{c1_cm_uuid}}

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
elements[0][course_id]: 1' OR '1'='1
elements[0][element_type]: cm
elements[0][uuid]: {{c1_cm_uuid}}

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
elements[0][course_id]: {{course_c1_id}}
elements[0][element_type]: cm
elements[0][uuid]: abc' OR '1'='1

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
elements[0][course_id]: {{course_c1_id}}
elements[0][element_type]: cm
elements[0][uuid]:

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
elements[0][course_id]: {{course_c1_id}}
elements[0][element_type]: cm
elements[0][uuid]: *

HTTP 200
[Asserts]
jsonpath "$.exception" exists
