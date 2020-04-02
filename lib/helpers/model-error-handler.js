'use strict';

const ApiSaveError = require('../api-save-error');

class ModelErrorHandler {

	/**
	 * Handle an error for a model operation
	 * Evaluates the error then set the respective response code and message
	 * @param {API} apiInstance API instance (for setting response codes)
	 * @param {Error} err The error to handle
	 * @throws The received error parsed
	 */
	static handle(apiInstance, err) {

		if(!this._isDuplicatedKey(err))
			throw new ApiSaveError(err, ApiSaveError.codes.INTERNAL_ERROR);

		this._handleDuplicatedKeyError(apiInstance, err);
	}

	static _isDuplicatedKey(message) {

	}

	static _handleDuplicatedKeyError(apiInstance, err) {

		apiInstance.setCode(400);

		err.message = `Duplicated key: ${err.message}`;

		throw new ApiSaveError(err, ApiSaveError.codes.DUPLICATED_KEY_ERROR);
	}
}

module.exports = ModelErrorHandler;