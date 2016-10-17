USE ggrcdev;

DROP TABLE IF EXISTS `access_control_list`;
DROP TABLE IF EXISTS `access_control_roles`;

CREATE TABLE `access_control_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` text NOT NULL,
  `description` text,
  `read` tinyint(1) DEFAULT NULL,
  `edit` tinyint(1) DEFAULT NULL,
  `delete` tinyint(1) DEFAULT NULL,
  `create` tinyint(1) DEFAULT NULL,
  `admin` tinyint(1) DEFAULT NULL,
  `my_work` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

CREATE TABLE `access_control_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `group_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `resource_id` int(11) DEFAULT NULL,
  `resource_type` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id_fkey_idx` (`user_id`),
  KEY `parent_id_fkey_idx` (`parent_id`),
  KEY `role_id_fkey_idx` (`role_id`),
  KEY `resource_id_idx` (`resource_id`),
  KEY `resource_type_idx` (`resource_type`),
  CONSTRAINT `parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `access_control_list` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `access_control_roles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `people` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=606796 DEFAULT CHARSET=utf8;



INSERT INTO `access_control_roles` VALUES
(1,'Admin',NULL,1,1,1,1,1,NULL),
(2,'Create',NULL,NULL,NULL,NULL,1,NULL,NULL),
(3,'Read',NULL,1,NULL,NULL,NULL,NULL,NULL),
(4,'Edit',NULL,NULL,1,NULL,NULL,NULL,NULL),
(5,'Program Manager',NULL,1,1,1,1,1,1),
(6,'Program Editor',NULL,1,1,1,1,NULL,1),
(7,'Program Reader',NULL,1,NULL,NULL,NULL,NULL,1),
(8,'Program Manager Mapped',NULL,1,1,1,NULL,NULL,NULL),
(9,'Program Editor Mapped',NULL,1,1,1,NULL,NULL,NULL),
(10,'Program Reader Mapped',NULL,1,0,0,NULL,NULL,NULL),
(11,'Owner',NULL,1,1,1,NULL,NULL,NULL),
(12,'Assessor',NULL,1,1,1,NULL,NULL,NULL);

-- ADD GLOBAL CREATE ROLES
INSERT INTO access_control_list (user_id, role_id)
SELECT 
	ur.person_id,
	acr.id
FROM user_roles as ur
JOIN roles AS r ON ur.role_id = r.id
JOIN access_control_roles AS acr ON acr.name = 'Create'
WHERE scope = 'System' AND r.name in ('Creator', 'Reader', 'Editor');

-- ADD GLOBAL READ ROLES
INSERT INTO access_control_list (user_id, role_id)
SELECT 
	ur.person_id,
	acr.id
FROM user_roles as ur
JOIN roles AS r ON ur.role_id = r.id
JOIN access_control_roles AS acr ON acr.name = 'Read'
WHERE scope = 'System' AND r.name in ('Reader', 'Editor');

-- ADD GLOBAL EDIT ROLES
INSERT INTO access_control_list (user_id, role_id)
SELECT 
	ur.person_id,
	acr.id
FROM user_roles as ur
JOIN roles AS r ON ur.role_id = r.id
JOIN access_control_roles AS acr ON acr.name = 'Edit'
WHERE scope = 'System' AND r.name in ('Editor');

-- ADD ADMINISTRATORS
INSERT INTO access_control_list (user_id, role_id)
SELECT 
	ur.person_id,
	acr.id
FROM user_roles as ur
JOIN roles AS r ON ur.role_id = r.id
JOIN access_control_roles AS acr ON acr.name = 'Admin'
WHERE scope = 'Admin' AND r.name in ('Administrator');

-- ADD GLOBAL DELETE ROLES
-- INSERT INTO access_control_list (user_id, role_id)
-- SELECT 
-- 	ur.person_id,
-- 	acr.id
--  FROM user_roles as ur
-- JOIN roles AS r ON ur.role_id = r.id
-- JOIN access_control_roles AS acr ON acr.name = 'Delete'
-- WHERE scope = 'System' AND r.name in ('Editor');

-- ADD PROGRAM ROLES TO ACL
INSERT INTO access_control_list (user_id, role_id, resource_id, resource_type)
SELECT 
	ur.person_id,
	CASE
		WHEN r.name = 'ProgramOwner' THEN (SELECT id FROM access_control_roles as acr WHERE acr.name = 'Program Manager' LIMIT 1)
		WHEN r.name = 'ProgramEditor' THEN (SELECT id FROM access_control_roles as acr WHERE acr.name = 'Program Editor' LIMIT 1)
        WHEN r.name = 'ProgramReader' THEN (SELECT id FROM access_control_roles as acr WHERE acr.name = 'Program Reader' LIMIT 1)
	END AS role_id,
	p.id,
    'Program'
FROM programs as p 
JOIN user_roles as ur ON p.context_id = ur.context_id 
JOIN roles as r where ur.role_id = r.id;


-- ADD PROGRAM MAPPED TO ACL
INSERT INTO access_control_list (user_id, role_id, parent_id, resource_id, resource_type)
SELECT 
    acl.user_id,
    (SELECT id FROM access_control_roles as pm_acr WHERE pm_acr.name = acr.name LIMIT 1),
    acl.id as parent_id,
    rel.object_id, 
    rel.object_type
FROM 
(SELECT destination_id as object_id, destination_type as object_type, source_id as program_id 
	FROM relationships 
    WHERE source_type = "Program"
UNION
SELECT source_id as object_id, source_type as object_type, destination_id as program_id 		
	FROM relationships
    WHERE destination_type = "Program") as rel
JOIN access_control_list AS acl ON acl.resource_id = rel.program_id AND acl.resource_type = 'Program'
JOIN access_control_roles as acr ON acl.role_id = acr.id;

-- ADD OBJECT OWNERS TO ACL
INSERT INTO access_control_list (user_id, role_id, resource_id, resource_type)
SELECT person_id, 9 as role_id, ownable_id, ownable_type FROM object_owners;

-- ASSIGNEE RELATIONSHIPS
-- Do this in a loop fo Creator, Verifier, Assessor, Requestor
INSERT INTO access_control_list (user_id, role_id, resource_id, resource_type)
SELECT 
	r.source_id,
    (SELECT id FROM access_control_roles as acr WHERE acr.name = 'Assessor' LIMIT 1),
    r.destination_id,
    r.destination_type
FROM relationships AS r
JOIN relationship_attrs AS ra ON ra.relationship_id = r.id
WHERE ra.attr_value LIKE '%Assessor%';

INSERT INTO access_control_list (user_id, role_id, parent_id, resource_id, resource_type)
SELECT 
	acl.user_id,
    -- (SELECT id FROM access_control_roles as acr WHERE acr.name = 'Mapped' LIMIT 1),
	10, 
    acl.id,
    r.destination_id,
    r.destination_type
FROM relationships AS r 
JOIN access_control_list AS acl ON acl.resource_id = r.source_id AND acl.resource_type = r.source_type
JOIN access_control_roles AS acr ON acl.role_id = acr.id
WHERE acr.name IN ('Assessor', 'Creator', 'Requestor', 'Verifier');

SELECT DISTINCT frp.key, frp.type, acr.* FROM fulltext_record_properties AS frp 
JOIN access_control_list AS acl ON frp.key = acl.resource_id AND frp.type = acl.resource_type OR acl.resource_id is null
JOIN access_control_roles as acr ON acl.role_id = acr.id
WHERE acl.user_id = 3 AND acr.read = 1