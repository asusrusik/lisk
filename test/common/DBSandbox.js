/*
 * Copyright © 2018 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 */
'use strict';

var child_process = require('child_process');
var rewire = require('rewire');

var database = rewire('../../db');
var pgOptions = database.__get__('pgOptions');
// Prevent protocol locking, so we can redefine database properties,
// see: http://vitaly-t.github.io/pg-promise/module-pg-promise
pgOptions.noLocking = true;
database.__set__('pgOptions', pgOptions);

var testDatabaseNames = [];

/**
 * @param {string} table
 * @param {Logger} logger
 * @param {Object} db
 * @param {function} cb
 */
function clearDatabaseTable (db, logger, table, cb) {
	db.query('DELETE FROM ' + table).then(function (result) {
		cb(null, result);
	}).catch(function (err) {
		console.error('Failed to clear database table: ' + table);
		throw err;
	});
}

function DBSandbox (dbConfig, testDatabaseName) {
	this.dbConfig = dbConfig;
	this.originalDatabaseName = dbConfig.database;
	this.testDatabaseName = testDatabaseName || this.originalDatabaseName;
	this.dbConfig.database = this.testDatabaseName;
	testDatabaseNames.push(this.testDatabaseName);

	var dropCreatedDatabases = function () {
		testDatabaseNames.forEach(function (testDatabaseName) {
			child_process.exec('dropdb ' + testDatabaseName);
		});
	};

	process.on('exit', function () {
		dropCreatedDatabases();
	});
}

DBSandbox.prototype.create = function (cb) {
	child_process.exec('dropdb ' + this.dbConfig.database, function () {
		child_process.exec('createdb ' + this.dbConfig.database, function () {
			database.connect(this.dbConfig, console, cb);
		}.bind(this));
	}.bind(this));
};

DBSandbox.prototype.destroy = function (logger) {
	database.disconnect(logger);
	this.dbConfig.database = this.originalDatabaseName;
};

module.exports = {
	clearDatabaseTable: clearDatabaseTable,
	DBSandbox: DBSandbox,
};
