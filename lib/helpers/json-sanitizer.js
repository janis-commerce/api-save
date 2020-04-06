'use strict';

class JSONSanitizer {

	/**
	 * Sanitize relaxed JSON strings into a valid/parseable JSON string
	 * @param {String} relaxedJson A relaxed JSON string
	 * @returns {String} a valid/parseable JSON string
	 * @example
	 * sanitize('{ some: "data" }');
	 * // Result
	 * '{ "some": "data" }'
	 */
	static sanitize(relaxedJson) {
		return relaxedJson.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
	}

	/**
	 * Sanitize and parse a relaxed JSON string
	 * @param {String} relaxedJson A relaxed JSON string
	 * @returns {Object} the parsed JSON
	 * @example
	 * sanitizeAndParse('{ some: "data" }');
	 * // Result
	 * { some: 'data' }
	 */
	static sanitizeAndParse(relaxedJson) {
		return JSON.parse(this.sanitize(relaxedJson));
	}
}

module.exports = JSONSanitizer;
