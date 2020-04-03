'use strict';

const ApiSaveError = require('../api-save-error');

const duplicatedKeyRegExp = new RegExp('(?<=index: ).*(?= dup key:)', 'g');

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

	static _isDuplicatedKey(err) {
		return duplicatedKeyRegExp.test(err.message);
	}

	static _handleDuplicatedKeyError(apiInstance, err) {

		apiInstance.setCode(400);

		const [field] = err.message.match(duplicatedKeyRegExp);

		err.message = `A document for field: '${field}' already exists`;

		throw new ApiSaveError(err, ApiSaveError.codes.DUPLICATED_KEY_ERROR);
	}
}

module.exports = ModelErrorHandler;
