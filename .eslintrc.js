module.exports = {
	root: true,
	parser: 'babel-eslint',
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
		ecmaFeatures: {
			legacyDecorators: true
		}
	},
	plugins: [
		'ember',
		'bbva'
	],
	extends: [
		'eslint:recommended',
		'plugin:ember/recommended',
		'eslint-config-bbva'
	],
	env: {
		browser: true
	},
	rules: {
		'ember/no-jquery': 'error'
	},
	overrides: [{
		files: [
			'.huskyrc.js',
			'.commitlintrc.js',
			'.eslintrc.js',
			'.template-lintrc.js',
			'ember-cli-build.js',
			'index.js',
			'testem.js',
			'blueprints/*/index.js',
			'config/**/*.js',
			'tests/dummy/config/**/*.js'
		],
		excludedFiles: [
			'addon/**',
			'addon-test-support/**',
			'app/**',
			'tests/dummy/app/**'
		],
		parserOptions: {
			sourceType: 'script'
		},
		env: {
			browser: false,
			node: true
		},
		plugins: ['node'],
		rules: Object.assign({}, require('eslint-plugin-node').configs.recommended.rules, {
			'no-process-env': 0
		})
	}]
};
