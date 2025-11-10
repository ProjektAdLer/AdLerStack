##############################################
# TEST 1: S2 gets task details for C1 adaptivity element (not enrolled)
# VULNERABILITY: S2 should NOT access C1 task details
# Test should FAIL if exception field is missing in response
##############################################
POST {{host}}/webservice/rest/server.php
Content-Type: application/x-www-form-urlencoded
[FormParams]
wsfunction: mod_adleradaptivity_get_task_details
moodlewsrestformat: json
wstoken: {{moodleS2Token}}
module[module_id]: {{c1_adaptivity_id}}

HTTP 200
[Asserts]
jsonpath "$.exception" exists
