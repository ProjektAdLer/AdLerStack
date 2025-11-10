##############################################
# TEST 1: S2 marks C1 module as viewed (not enrolled)
# VULNERABILITY: S2 should NOT mark modules in C1 as viewed
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_trigger_event_cm_viewed
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
module_id: {{c1_cm_id}}

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 3: SQL injection in module_id
# Payload: 1' OR '1'='1
# Could mark all modules as viewed if vulnerable
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_trigger_event_cm_viewed
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
module_id: 1' OR '1'='1

HTTP 200
[Asserts]
jsonpath "$.exception" exists

##############################################
# TEST 3b: SQL injection in module_id with double quotes
# Payload: 1" OR "1"="1
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: local_adler_trigger_event_cm_viewed
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
module_id: 1" OR "1"="1

HTTP 200
[Asserts]
jsonpath "$.exception" exists
