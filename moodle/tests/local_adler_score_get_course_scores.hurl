##############################################
# TEST 1: S2 gets scores for C1 (not enrolled)
# VULNERABILITY: S2 should NOT access C1 scores
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_get_course_scores
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
course_id: {{course_c1_id}}

HTTP 200
[Asserts]
# Abort only if no exception - meaning unauthorized access succeeded
jsonpath "$.exception" exists
[Captures]
test1_has_exception: jsonpath "$.exception"

##############################################
# TEST 2: M2 gets scores for C1 (not course owner)
# VULNERABILITY: M2 should NOT access C1 scores (M1 owns C1)
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_get_course_scores
moodlewsrestformat: json
wstoken: {{moodleM2Token}}
course_id: {{course_c1_id}}

HTTP 200
[Asserts]
# Abort only if no exception - meaning unauthorized access succeeded
jsonpath "$.exception" exists

##############################################
# TEST 4: SQL injection in course_id
# Payload: 1' OR '1'='1
# Could return scores from all courses if vulnerable
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_get_course_scores
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
course_id: 1' OR '1'='1

HTTP 200
[Asserts]
# Abort only if no exception - meaning SQL injection succeeded
jsonpath "$.exception" exists

##############################################
# TEST 4b: SQL injection in course_id with double quotes
# Payload: 1" OR "1"="1
# Could return scores from all courses if vulnerable
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_get_course_scores
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
course_id: 1\" OR \"1\"=\"1

HTTP 200
[Asserts]
# Abort only if no exception - meaning SQL injection succeeded
jsonpath "$.exception" exists

##############################################
# TEST 5: Negative course_id
# Edge case: requesting scores with negative ID
# Should fail gracefully with exception
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_get_course_scores
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
course_id: -1

HTTP 200
[Asserts]
# Abort only if no exception - should reject negative ID
jsonpath "$.exception" exists

##############################################
# TEST 8: Empty course_id
# Invalid input: empty string instead of integer
# Should fail with exception
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_get_course_scores
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
course_id:

HTTP 200
[Asserts]
# Abort only if no exception - should reject empty course_id
jsonpath "$.exception" exists