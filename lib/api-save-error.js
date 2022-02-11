'use strict';

/**
 * @class representing a ApiSaveError.
 * @extends Error
 */

/**
 * @typedef CodesError
 * @property {Number} INVALID_REQUEST_DATA
 * @property {Number} INVALID_ENTITY
 * @property {Number} VALIDATION_ERROR
 * @property {Number} DUPLICATED_KEY_ERROR
 * @property {Number} INTERNAL_ERROR
 */

/**
 * @typedef {Object} Error An instance of Error class
 */

module.exports = class ApiSaveError extends Error {

	/**
	 * Get the error codes
	 *
	 * @static
	 * @returns {CodesError}
	 */
	static get codes() {

		return {
			INVALID_REQUEST_DATA: 1,
			INVALID_ENTITY: 2,
			VALIDATION_ERROR: 3,
			DUPLICATED_KEY_ERROR: 98,
			INTERNAL_ERROR: 99
		};

	}

	/**
	 * @param {Error} err The details of the error
	 * @param {CodesError} code The error code
	 */
	constructor(err, code) {

		const message = err.message || err;

		super(message);
		this.message = message;
		this.code = code;
		this.name = 'ApiSaveError';

		if(err instanceof Error)
			this.previousError = err;
	}
};
