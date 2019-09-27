'use strict';

class ApiSaveError extends Error {

	static get codes() {

		return {
			INVALID_REQUEST_DATA: 1,
			INVALID_ENTITY: 2,
			INTERNAL_ERROR: 99
		};

	}

	constructor(err, code, previousError) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'ApiSaveError';

		if(previousError)
			this.previousError = previousError;
	}
}

module.exports = ApiSaveError;
