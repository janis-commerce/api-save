'use strict';

const { struct } = require('@janiscommerce/superstruct');
const path = require('path');

const ApiSaveError = require('./api-save-error');

/**
 * @class representing a ApiSaveValidator.
 */

/**
 * @typedef {Object} ApiSaveError A instance of ApiSaveError class
 */
class ApiSaveValidator {

	/**
	 * @static
	 * @return {Function}
	 */
	get struct() {
		return {
			id: this.apiInstance.constructor.idStruct,
			main: this.apiInstance.constructor.mainStruct,
			relationships: this.apiInstance.constructor.relationshipsStruct
		};
	}

	/**
	 * Constructor.
	 * @param {Object} apiInstance
	 */
	constructor(apiInstance) {
		this.apiInstance = apiInstance;
	}

	/**
	 * Validates the struct data.
	 *
	 * @returns {object} - The data to save.
	 * @throws {ApiSaveError} if the validate fails
	 */
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
			e.message = `${e.message} in ${errorPath}`;
			throw new ApiSaveError(e, ApiSaveError.codes.VALIDATION_ERROR);
		}
	}

	/**
	 * Validate model.
	 *
	 * @returns {object} - The model instance.
	 * @throws {ApiSaveError} if the validate model fails
	 */
	validateModel() {
		try {
			return this._getModelInstance(path.join(process.cwd(), process.env.MS_PATH || '', 'models', this.apiInstance.modelName));
		} catch(e) {
			throw new ApiSaveError(e, ApiSaveError.codes.INVALID_ENTITY);
		}
	}

	/**
	 * Get model instance.
	 *
	 * @param {*} modelPath
	 * @returns {object} - The model instance.
	 */
	_getModelInstance(modelPath) {

		// eslint-disable-next-line global-require, import/no-dynamic-require
		const Model = require(modelPath);

		if(!this.apiInstance.session)
			return new Model();

		return this.apiInstance.session.getSessionInstance(Model);
	}

}

module.exports = ApiSaveValidator;
