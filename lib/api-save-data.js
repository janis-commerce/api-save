'use strict';

const { API } = require('@janiscommerce/api');
const { struct } = require('superstruct');

const ApiSaveValidator = require('./api-save-validator');
const ApiSaveMain = require('./api-save-main');
const ApiSaveRelationships = require('./api-save-relationships');
const ApiSaveError = require('./api-save-error');
const ErrorHandler = require('./helpers/error-handler');
const EndpointParser = require('./helpers/endpoint-parser');

/**
 * @class representing a ApiSaveData.
 * @extends API
 */

/**
 * @typedef {Object} ApiSaveError A instance of ApiSaveError class
 */

module.exports = class ApiSaveData extends API {

	/**
	 * Use this in case you're saving relationships with other models (mostly for relational databases)
	 * If don't have any relationship, there's no need to implement it.
	 * @static
	 * @return {Object}
	 */
	static get relationshipsParameters() {
		return {};
	}

	/**
	 * This is used to validate the ID received as path parameter.
	 * Defaults to an optional string or number.
	 * @static
	 * @return {Function}
	 */
	static get idStruct() {
		return struct.optional('string|number');
	}

	/**
	 * Used to validate the data received in the request, checking the data to be saved in the main entity.
	 * Defaults to an object with any property.
	 * @static
	 * @return {string}
	 */
	static get mainStruct() {
		return 'object';
	}

	/**
	 * Used to validate the data received in the request, checking the data to be passed to the relationships.
	 * Defaults to an object partial with no properties.
	 * @static
	 * @return {Function}
	 */
	static get relationshipsStruct() {
		return struct.partial({});
	}

	/**
	 * Validates the structure of the data to save before processing.
	 *
	 * @async
	 * @returns {void}
	 * @throws {ApiSaveError} if the validate fails
	 */
	async validate() {

		this._parseEndpoint();

		const apiSaveValidator = new ApiSaveValidator(this);

		this.dataToSave = apiSaveValidator.validateData();

		this.model = apiSaveValidator.validateModel();

		if(this.postStructValidate) {
			try {
				await this.postStructValidate();
			} catch(e) {
				throw new ApiSaveError(e, ApiSaveError.codes.INVALID_REQUEST_DATA);
			}
		}
	}

	/**
	 * The process formats, validates, then save the current item.
	 *
	 * @async
	 * @returns {Promise<void>} - The promise of the save.
	 * @throws {ApiSaveError} if the process fails
	 */
	async process() {

		try {

			this.dataToSave.main = await this.format(this.dataToSave.main);

			if(!(await this.shouldSave(this.dataToSave.main))) {

				if(!this.recordId)
					this.setCode(204); // 204 No Content

				return this.setBody({
					...this.recordId && { id: this.recordId }
				});
			}

			const apiSaveMain = new ApiSaveMain(this);
			const savedId = await apiSaveMain.process();

			if(!savedId)
				throw	new Error('common.message.internalError');

			if(this.hasRelationships()) {
				const apiSaveRelationships = new ApiSaveRelationships(this, savedId, !this.dataToSave.id);
				await apiSaveRelationships.process();
			}

			await this.postSaveHook(savedId, this.dataToSave.main);

			this.setBody({
				id: savedId
			});

		} catch(e) {
			ErrorHandler.handle(this, e);
		}
	}

	/**
	 * Get current item from DB.
	 *
	 * @async
	 * @returns {Object.<string, *>} - The current item.
	 * @throws {ApiSaveError} if the recordId is not found
	 */
	async getCurrent() {

		if(!this.recordId)
			throw new ApiSaveError('No recordId found', ApiSaveError.codes.INTERNAL_ERROR);

		if(!this._currentItem)
			this._currentItem = await this.model.getById(this.recordId);

		return this._currentItem;
	}

	/**
	 * Optional method allows you to validate if saving the item is really necessary. Is called after formatting.
	 *
	 * @async
	 * @param {Object} data - The data to save.
	 * @return {boolean} - True if should save, false otherwise.
	 */
	shouldSave() {
		return true;
	}

	/**
	 * Check if the current endpoint has relationships.
	 *
	 * @return {boolean} - True if has relationships, false otherwise.
	 */
	hasRelationships() {
		return Object.keys(this.dataToSave.relationships).length > 0;
	}

	/**
	 * Set the modelName, recordId and parents of API after parsing the endpoint
	 *
	 * @returns {void}
	*/
	_parseEndpoint() {

		const { modelName, recordId, parents } = EndpointParser.parse(this.endpoint);

		this.modelName = modelName;
		this.recordId = recordId;
		this.parents = parents;
	}

	/**
	 * Use this to format your main record before it's saved.
	 *
	 * @async
	 * @param {Object} data - The data to format.
	 * @return {Object} - The formatted data.
	 */
	format(data) {
		return data;
	}

	/**
	 * Use this to perform a task after saving your main record.
	 *
	 * @async
	 * @param {String} id - The id of the saved item
	 * @param {Object} data
	 * @return {Object}
	 */
	postSaveHook(id, data) {
		return (id, data);
	}
};
