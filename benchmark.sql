set profiling=1;
use ggrcdev;

SELECT * FROM access_control_list as acl 
              JOIN access_control_roles as acr ON acr.id = acl.role_id
              WHERE acr.read = 1 and acl.user_id = 3 and acl.resource_id is null;

SELECT DISTINCT frp.key, frp.type FROM fulltext_record_properties AS frp
WHERE EXISTS (SELECT * FROM access_control_list as acl 
              JOIN access_control_roles as acr ON acr.id = acl.role_id
              WHERE acr.read = 1 and acl.user_id = 3 and acl.resource_id is null);
              

SELECT DISTINCT frp.key, frp.type FROM fulltext_record_properties AS frp
JOIN access_control_list AS acl USE INDEX(user_id_idx) ON acl.resource_id = frp.key AND acl.resource_type = frp.type
JOIN access_control_roles as acr ON acl.role_id = acr.id
WHERE acl.user_id = 3 AND acr.read = 1;

SELECT DISTINCT frp.key, frp.type FROM fulltext_record_properties AS frp
JOIN access_control_list AS acl USE INDEX(resource_id_idx) ON acl.resource_id = frp.key AND acl.resource_type = frp.type OR acl.resource_id = null
JOIN access_control_roles as acr ON acl.role_id = acr.id
WHERE acl.user_id = 3 AND acr.read = 1;


-- SHOW ALL OBJECTS THE USER CAN REA
SELECT DISTINCT frp.key, frp.type FROM fulltext_record_properties AS frp
JOIN access_control_list AS acl USE INDEX(resource_id_idx) ON acl.resource_id = frp.key AND acl.resource_type = frp.type OR acl.resource_id = null
JOIN access_control_roles as acr ON acl.role_id = acr.id
WHERE acl.user_id = 3 AND acr.read = 1;

 
SELECT DISTINCT * FROM (
SELECT frp.key, frp.type FROM fulltext_record_properties AS frp 
JOIN access_control_list AS acl ON acl.resource_id = null
JOIN access_control_roles as acr ON acl.role_id = acr.id
WHERE acl.user_id = 3 AND acr.read = 1
UNION
SELECT frp.key, frp.type FROM fulltext_record_properties AS frp 
JOIN access_control_list AS acl ON acl.resource_id = frp.key AND acl.resource_type = frp.type
JOIN access_control_roles as acr ON acl.role_id = acr.id
WHERE acl.user_id = 3 AND acr.read = 1) as lal;;

SELECT frp.key, frp.type FROM access_control_roles AS acr
JOIN access_control_list AS acl ON acr.read = 1 AND acl.role_id = acr.id AND acl.user_id = 3
JOIN fulltext_record_properties AS frp ON acl.resource_id = frp.key AND acl.resource_type = frp.type OR acl.resource_id = null;

-- ADD PERMISSIONS TO OBJECT QUERY
SELECT obj.slug, acl.user_id, acr.* FROM controls as obj 
JOIN access_control_list as acl ON obj.id = acl.resource_id AND acl.resource_type = 'Control' OR acl.resource_id is null
JOIN access_control_roles as acr ON acl.role_id = acr.id
WHERE acl.user_id = 5
order by obj.id;

-- SHOW ALL USERS/ROLES THAT CAN ACCESS AN OBJECT
SELECT obj.slug, acl.user_id, acr.* FROM controls as obj 
JOIN access_control_list as acl ON obj.id = acl.resource_id AND acl.resource_type = 'Control' OR acl.resource_id is null
JOIN access_control_roles as acr ON acl.role_id = acr.id
WHERE acr.read = 1 OR acr.admin = 1
order by acl.user_id;

SELECT * FROM access_control_list where user_id = 2 and resource_id is null;
SELECT * FROM people;

show profiles;