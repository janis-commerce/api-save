'use strict';

const ApiSaveError = require('../api-save-error');

const JSONSanitizer = require('./json-sanitizer');

class ErrorHandler {

	/**
	 * Handle an error for a model operation
	 * Evaluates the error then set the respective response code and message
	 * @param {API} apiInstance API instance (for setting response codes)
	 * @param {Error} err The error to handle
	 * @throws The received error parsed
	 */
	static handle(apiInstance, err) {

		if(this._isDuplicatedKey(err))
			this._handleDuplicatedKeyError(apiInstance, err);

		this._handleInternalError(err);
	}

	static _isDuplicatedKey(err) {
		return /E11000 duplicate key error/g.test(err.message);
	}

	static _handleDuplicatedKeyError(apiInstance, err) {

		apiInstance.setCode(400);

		let [fields] = err.message.match(/{.*}/g);

		fields = JSONSanitizer.sanitizeAndParse(fields);

		fields = Object.keys(fields).reduce((fieldsList, field) => {
			return fieldsList ? `${fieldsList}, '${field}'` : `'${field}'`;
		}, '');

		err.message = `A document for field or fields: ${fields} already exists`;

		throw new ApiSaveError(err, ApiSaveError.codes.DUPLICATED_KEY_ERROR);
	}

	static _handleInternalError(err) {
		throw new ApiSaveError(err, ApiSaveError.codes.INTERNAL_ERROR);
	}
}

module.exports = ErrorHandler;
