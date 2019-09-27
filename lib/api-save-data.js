'use strict';

const { API } = require('@janiscommerce/api');
const { struct } = require('superstruct');

const ApiSaveValidator = require('./api-save-validator');
const ApiSaveMain = require('./api-save-main');
const ApiSaveRelationships = require('./api-save-relationships');
const ApiSaveError = require('./api-save-error');
const EndpointParser = require('./helpers/endpoint-parser');

class ApiSaveData extends API {

	static get relationshipsParameters() {
		return {};
	}

	static get idStruct() {
		return struct.optional('string|number');
	}

	static get mainStruct() {
		return 'object';
	}

	static get relationshipsStruct() {
		return struct.partial({});
	}

	async validate() {

		this._parseEndpoint();

		const apiSaveValidator = new ApiSaveValidator(this);

		this.dataToSave = apiSaveValidator.validateData();

		this.model = apiSaveValidator.validateModel();
	}

	async process() {

		try {

			if(this.format)
				this.dataToSave.main = this.format(this.dataToSave.main);

			const apiSaveMain = new ApiSaveMain(this);
			const savedId = await apiSaveMain.process();

			if(!savedId)
				throw	new Error('common.message.internalError');

			if(this.hasRelationships()) {
				const apiSaveRelationships = new ApiSaveRelationships(this, savedId, !this.dataToSave.id);
				await apiSaveRelationships.process();
			}

			this.setBody({
				id: savedId
			});
		} catch(e) {
			throw new ApiSaveError(e.message, ApiSaveError.codes.INTERNAL_ERROR, e);
		}
	}

	hasRelationships() {
		return Object.keys(this.dataToSave.relationships).length > 0;
	}

	_parseEndpoint() {

		const { modelName, recordId, parents } = EndpointParser.parse(this.endpoint);

		this.modelName = modelName;
		this.recordId = recordId;
		this.parents = parents;
	}
}

module.exports = ApiSaveData;
