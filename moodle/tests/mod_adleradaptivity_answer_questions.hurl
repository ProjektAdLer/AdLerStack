# valid testcase
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: mod_adleradaptivity_answer_questions
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
module[module_id]: {{c1_adaptivity_id}}
questions[0][uuid]: {{c1_adaptivity_question1_uuid}}
questions[0][answer]: [true, false]

HTTP 200
[Asserts]
jsonpath "$.data" exists

##############################################
# TEST 1: S2 answers questions in C1 adaptivity element (not enrolled)
# VULNERABILITY: S2 should NOT submit answers for C1
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: mod_adleradaptivity_answer_questions
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
module[module_id]: {{c1_adaptivity_id}}
questions[0][uuid]: {{c1_adaptivity_question1_uuid}}
questions[0][answer]: [true, false]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 3: S2 uses valid c1_adaptivity_uuid but wrong module_id
# VULNERABILITY: Bypass enrollment check via module_id confusion
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: mod_adleradaptivity_answer_questions
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
module[module_id]: 999999
questions[0][uuid]: {{c1_adaptivity_question1_uuid}}
questions[0][answer]: [true, false]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 5: SQL injection in module_id
# Payload: 1' OR '1'='1
# Could submit answers to all modules if vulnerable
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: mod_adleradaptivity_answer_questions
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
module[module_id]: 1' OR '1'='1
questions[0][uuid]: {{c1_adaptivity_question1_uuid}}
questions[0][answer]: [true, false]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 5b: SQL injection in module_id with double quotes
# Payload: 1" OR "1"="1
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: mod_adleradaptivity_answer_questions
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
module[module_id]: 1" OR "1"="1
questions[0][uuid]: {{c1_adaptivity_question1_uuid}}
questions[0][answer]: [true, false]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 6: SQL injection in instance_id
# Payload: 1' OR '1'='1
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: mod_adleradaptivity_answer_questions
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
module[instance_id]: 1' OR '1'='1
questions[0][uuid]: {{c1_adaptivity_question1_uuid}}
questions[0][answer]: [true, false]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 6b: SQL injection in instance_id with double quotes
# Payload: 1" OR "1"="1
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: mod_adleradaptivity_answer_questions
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
module[instance_id]: 1" OR "1"="1
questions[0][uuid]: {{c1_adaptivity_question1_uuid}}
questions[0][answer]: [true, false]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 7: SQL injection in question UUID
# Payload: abc' OR '1'='1
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: mod_adleradaptivity_answer_questions
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
module[module_id]: {{c1_adaptivity_id}}
questions[0][uuid]: abc' OR '1'='1
questions[0][answer]: [true, false]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 7b: SQL injection in question UUID with double quotes
# Payload: abc" OR "1"="1
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: mod_adleradaptivity_answer_questions
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
module[module_id]: {{c1_adaptivity_id}}
questions[0][uuid]: abc" OR "1"="1
questions[0][answer]: [true, false]

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 8: SQL injection in answer field (DROP TABLE)
# Payload: '; DROP TABLE--
# Tests if answer content is properly sanitized
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: mod_adleradaptivity_answer_questions
moodlewsrestformat: json
wstoken: {{moodleS1Token}}
module[module_id]: {{c1_adaptivity_id}}
questions[0][uuid]: {{c1_adaptivity_question1_uuid}}
questions[0][answer]: '; DROP TABLE--

HTTP 200
[Asserts]
jsonpath "$.exception" exists
