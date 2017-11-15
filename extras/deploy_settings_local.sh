#!/usr/bin/env bash

APPENGINE_INSTANCE=local
SETTINGS_MODULE="development app_engine ggrc_basic_permissions.settings.development ggrc_risks.settings.development ggrc_risk_assessments.settings.development ggrc_workflows.settings.development ggrc_gdrive_integration.settings.development"
DATABASE_URI="mysql+mysqldb://root:root@${GGRC_DATABASE_HOST:-localhost}/ggrcdev?charset=utf8"
SECRET_KEY='Something-secret'
GOOGLE_ANALYTICS_ID=""
GOOGLE_ANALYTICS_DOMAIN=""
GAPI_KEY="$GGRC_GAPI_KEY"
GAPI_CLIENT_ID="$GGRC_GAPI_CLIENT_ID"
GAPI_CLIENT_SECRET="$GGRC_GAPI_CLIENT_SECRET"
GAPI_ADMIN_GROUP='<Google Group Email Address>'
BOOTSTRAP_ADMIN_USERS='user@example.com'
MIGRATOR='Default Migrator <migrator@example.com>'
RISK_ASSESSMENT_URL='http://localhost:8080'
CUSTOM_URL_ROOT=''
ABOUT_URL='#'
ABOUT_TEXT='About GGRC'
EXTERNAL_HELP_URL='#set_GGRC_EXTERNAL_HELP_URL_env_var'
EXTERNAL_IMPORT_HELP_URL='#set_GGRC_EXTERNAL_IMPORT_HELP_URL_env_var'
INSTANCE_CLASS='B4'
MAX_INSTANCES='4'
SCALING=$(printf "manual_scaling:\n  instances: ${MAX_INSTANCES}\n")
STATIC_SERVING=""
GGRC_Q_INTEGRATION_URL=""
INTEGRATION_SERVICE_URL="${GGRC_INTEGRATION_SERVICE_URL}"
URLFETCH_SERVICE_ID="${URLFETCH_SERVICE_ID}"
ISSUE_TRACKER_ENABLED="${ISSUE_TRACKER_ENABLED}"
ISSUE_TRACKER_BUG_URL_TMPL="${ISSUE_TRACKER_BUG_URL_TMPL}"
DASHBOARD_INTEGRATION="On"
ALLOWED_QUERYAPI_APP_IDS=""
APPENGINE_EMAIL=""
AUTHORIZED_DOMAIN="example.com"
ACCESS_TOKEN="$ACCESS_TOKEN"
