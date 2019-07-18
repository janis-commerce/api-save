'use strict';

const { struct } = require('superstruct');
const path = require('path');

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
			const errorParh = e.path.join('.');
			throw new ApiSaveError(`${e.message} in ${errorParh}`, ApiSaveError.codes.INVALID_REQUEST_DATA);
		}
	}

	validateModel() {
		try {
			return this._getModelInstance();
		} catch(e) {
			throw new ApiSaveError(e.message, ApiSaveError.codes.INVALID_ENTITY);
		}
	}

	/* istanbul ignore next */
	_getModelInstance() {
		// eslint-disable-next-line global-require, import/no-dynamic-require
		const Model = require(path.join(process.cwd(), process.env.MS_PATH, 'models', this.apiInstance.entity));
		return new Model();
	}

}

module.exports = ApiSaveValidator;
