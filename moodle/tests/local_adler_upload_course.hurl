##############################################
# TEST 1: S1 uploads course (student role)
# VULNERABILITY: Students should NOT be able to create courses
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
[MultipartFormData]
wstoken: {{moodleS1Token}}
wsfunction: local_adler_upload_course
moodlewsrestformat: json
mbz: file,./setup_test_environment/fixtures/testwelt.mbz; application/octet-stream

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 3: M2 uploads to category owned/restricted by M1
# VULNERABILITY: M2 should NOT upload to M1's restricted category
# Test should FAIL if exception field is missing in response
# Note: Replace category_id with actual restricted category if available
##############################################
POST {{host}}/webservice/rest/server.php
[MultipartFormData]
wstoken: {{moodleM2Token}}
wsfunction: local_adler_upload_course
moodlewsrestformat: json
category_id: {{m1_category_id}}
mbz: file,./setup_test_environment/fixtures/testwelt.mbz; application/octet-stream

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 4a: Upload PHP file disguised as MBZ
# VULNERABILITY: Arbitrary file upload - should reject non-MBZ files
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
[MultipartFormData]
wstoken: {{moodleM1Token}}
wsfunction: local_adler_upload_course
moodlewsrestformat: json
mbz: file,./tests/fixtures/local_adler_upload_course_malicious.php; application/octet-stream

HTTP 200
[Asserts]
jsonpath "$.exception" exists


##############################################
# TEST 4b: Upload empty file
# VULNERABILITY: Empty/corrupted file handling
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
[MultipartFormData]
wstoken: {{moodleM1Token}}
wsfunction: local_adler_upload_course
moodlewsrestformat: json
mbz: file,./tests/fixtures/local_adler_upload_course_empty.mbz; application/octet-stream

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 7: SQL injection in category_id
# Payload: 1' OR '1'='1
# Could create course in unauthorized categories
##############################################
POST {{host}}/webservice/rest/server.php
[MultipartFormData]
wstoken: {{moodleM1Token}}
wsfunction: local_adler_upload_course
moodlewsrestformat: json
category_id: 1' OR '1'='1
mbz: file,./setup_test_environment/fixtures/testwelt.mbz; application/octet-stream

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 7b: SQL injection in category_id with double quotes
# Payload: 1" OR "1"="1
##############################################
POST {{host}}/webservice/rest/server.php
[MultipartFormData]
wstoken: {{moodleM1Token}}
wsfunction: local_adler_upload_course
moodlewsrestformat: json
category_id: 1" OR "1"="1
mbz: file,./setup_test_environment/fixtures/testwelt.mbz; application/octet-stream

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 8: Negative category_id
# Edge case: negative category ID
# Should fail gracefully with exception
##############################################
POST {{host}}/webservice/rest/server.php
[MultipartFormData]
wstoken: {{moodleM1Token}}
wsfunction: local_adler_upload_course
moodlewsrestformat: json
category_id: -1
mbz: file,./setup_test_environment/fixtures/testwelt.mbz; application/octet-stream

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 10: Missing MBZ file
# VULNERABILITY: Required field validation
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
[MultipartFormData]
wstoken: {{moodleM1Token}}
wsfunction: local_adler_upload_course
moodlewsrestformat: json
only_check_permissions: 0

HTTP 200
[Asserts]
jsonpath "$.exception" exists
