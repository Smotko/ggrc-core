# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

DEBUG = True
TESTING = True
LOGIN_DISABLED = False
PRODUCTION = False
HOST = '0.0.0.0'
FULLTEXT_INDEXER = 'ggrc.fulltext.mysql.MysqlIndexer'
LOGIN_MANAGER = 'ggrc.login.noop'
# SQLALCHEMY_ECHO = True
MEMCACHE_MECHANISM = False
