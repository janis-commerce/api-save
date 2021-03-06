'use strict';

class ApiSaveError extends Error {

	static get codes() {

		return {
			INVALID_REQUEST_DATA: 1,
			INVALID_ENTITY: 2,
			VALIDATION_ERROR: 3,
			DUPLICATED_KEY_ERROR: 98,
			INTERNAL_ERROR: 99
		};

	}

	constructor(err, code) {

		const message = err.message || err;

		super(message);
		this.message = message;
		this.code = code;
		this.name = 'ApiSaveError';

		if(err instanceof Error)
			this.previousError = err;
	}
}

module.exports = ApiSaveError;
