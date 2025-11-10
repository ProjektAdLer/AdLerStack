##############################################
# TEST 1: S2 submits xAPI for C1 module (not enrolled)
# VULNERABILITY: S2 should NOT be able to submit scores for C1
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_h5p_learning_element
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
xapi: {"object":{"id":"http://example.com/{{c1_cm_id}}"}}

HTTP 200
[Asserts]
# Abort only if no exception - meaning unauthorized access succeeded
jsonpath "$.exception" exists

##############################################
# TEST 2: M2 submits xAPI for C1 module (not course owner)
# VULNERABILITY: M2 should NOT submit scores for C1 (M1 owns C1)
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_h5p_learning_element
moodlewsrestformat: json
wstoken: {{moodleM2Token}}
xapi: {"object":{"id":"http://example.com/{{c1_cm_id}}"}}

HTTP 200
[Asserts]
# Abort only if no exception - meaning unauthorized access succeeded
jsonpath "$.exception" exists

##############################################
# TEST 5: Missing object.id field
# Causes undefined property access when trying to access $statement->object->id
# Should throw exception
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_h5p_learning_element
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
xapi: {"verb":"completed"}

HTTP 200
[Asserts]
# Abort only if no exception - should reject malformed xAPI
jsonpath "$.exception" exists

##############################################
# TEST 6: Empty xAPI string
# json_decode("") returns null, which becomes array(null)
# Should throw exception
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_h5p_learning_element
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
xapi:

HTTP 200
[Asserts]
# Abort only if no exception - should reject empty xAPI
jsonpath "$.exception" exists

##############################################
# TEST 7: Path traversal in object.id
# Tests URL parsing with path traversal attempt
# Should fail gracefully with exception
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_h5p_learning_element
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
xapi: {"object":{"id":"../../../etc/passwd"}}

HTTP 200
[Asserts]
# Abort only if no exception - should reject path traversal
jsonpath "$.exception" exists

##############################################
# TEST 11: Non-existent context_id
# Valid JSON but context_id doesn't exist in database
# instance_by_id() should throw exception for non-existent ID
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_score_h5p_learning_element
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
xapi: {"object":{"id":"http://example.com/999999"}}

HTTP 200
[Asserts]
# Abort only if no exception - should reject non-existent context_id
jsonpath "$.exception" exists