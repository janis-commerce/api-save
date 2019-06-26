'use strict';

const { Controller } = require('@janiscommerce/model-controller');
const { struct } = require('superstruct');

const ApiSaveError = require('./api-save-error');

class ApiSaveValidator {

	static get defaultStruct() {
		return struct({
			id: struct.optional('string|number'),
			main: struct('object'),
			relationships: struct('object')
		});
	}

	constructor(apiInstance) {
		this.apiInstance = apiInstance;
	}

	validateData() {

		const validationStruct = this.apiInstance.getStruct ? this.apiInstance.getStruct() : this.constructor.defaultStruct;

		try {
			return validationStruct({
				id: this.apiInstance.pathParameters[0],
				main: this.apiInstance.data,
				relationships: this.apiInstance.data
			});
		} catch(e) {
			const path = e.path.join('.');
			throw new ApiSaveError(`${e.message} in ${path}`, ApiSaveError.codes.INVALID_REQUEST_DATA);
		}
	}

	validateController() {
		try {
			return Controller.getInstance(this.apiInstance.entity);
		} catch(e) {
			throw new ApiSaveError(e.message, ApiSaveError.codes.INVALID_ENTITY);
		}
	}

}

module.exports = ApiSaveValidator;
