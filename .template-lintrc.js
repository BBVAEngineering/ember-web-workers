module.exports = {
	extends: 'octane',
	rules: {
		'no-bare-strings': true,
		'block-indentation': 'tab',
		'no-html-comments': true,
		'no-nested-interactive': true,
		'self-closing-void-elements': true,
		'no-triple-curlies': true,
		'deprecated-each-syntax': true,
		'link-rel-noopener': true,
		'no-invalid-interactive': true,
		'require-valid-alt-text': true,
		'style-concatenation': true,
		'deprecated-inline-view-helper': true,
		'no-unused-block-params': true,
		'inline-link-to': true,
		'no-inline-styles': true,
		'simple-unless': false
	},
	ignore: [
		'tests/dummy/**'
	]
};
