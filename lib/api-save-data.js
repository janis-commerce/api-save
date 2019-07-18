'use strict';

const { APIView } = require('@janiscommerce/api-view');

const ApiSaveValidator = require('./api-save-validator');
const ApiSaveMain = require('./api-save-main');
const ApiSaveRelationships = require('./api-save-relationships');
const ApiSaveError = require('./api-save-error');

class ApiSaveData extends APIView {

	static get relationshipsParameters() {
		return {};
	}

	validate() {

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
			throw new ApiSaveError(e.message, ApiSaveError.codes.INTERNAL_ERROR);
		}
	}

	hasRelationships() {
		return Object.keys(this.dataToSave.relationships).length > 0;
	}
}

module.exports = ApiSaveData;
