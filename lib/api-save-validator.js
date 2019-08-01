'use strict';

const { struct } = require('superstruct');
const path = require('path');

const ApiSaveError = require('./api-save-error');

class ApiSaveValidator {

	get struct() {
		return {
			id: this.apiInstance.constructor.idStruct,
			main: this.apiInstance.constructor.mainStruct,
			relationships: this.apiInstance.constructor.relationshipsStruct
		};
	}

	constructor(apiInstance) {
		this.apiInstance = apiInstance;
	}

	validateData() {

		const validationStruct = this.struct;

		const dataToValidate = {
			...this.apiInstance.data,
			...this.apiInstance.parents
		};

		try {
			return struct(validationStruct)({
				id: this.apiInstance.recordId,
				main: dataToValidate,
				relationships: dataToValidate
			});
		} catch(e) {
			const errorPath = e.path.join('.');
			throw new ApiSaveError(`${e.message} in ${errorPath}`, ApiSaveError.codes.INVALID_REQUEST_DATA);
		}
	}

	validateModel() {
		try {
			return this._getModelInstance(path.join(process.cwd(), process.env.MS_PATH || '', 'models', this.apiInstance.modelName));
		} catch(e) {
			throw new ApiSaveError(e.message, ApiSaveError.codes.INVALID_ENTITY);
		}
	}

	/* istanbul ignore next */
	_getModelInstance(modelPath) {
		// eslint-disable-next-line global-require, import/no-dynamic-require
		const Model = require(modelPath);
		return this.client ? this.client.getInstance(Model) : new Model();
	}

}

module.exports = ApiSaveValidator;
