/* eslint-env node */
'use strict';

module.exports = {
	reporters: [
		'html',
		'json',
		'json-summary',
		'lcov'
	],
	coverageFolder: 'coverage',
	excludes: [
		'tests/dummy/**/*'
	]
};
