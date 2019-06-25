'use strict';

const { APIView } = require('@janiscommerce/api-view');
const { Controller } = require('@janiscommerce/model-controller');

const ApiSaveError = require('./api-save-error');

class ApiSave extends APIView {

	validate() {
		this.validateController();
	}

	async process() {
		this.setBody({});
	}

	validateController() {
		try {
			this.controller = Controller.getInstance(this.entity);
		} catch(e) {
			throw new ApiSaveError(e.message, ApiSaveError.codes.INVALID_ENTITY);
		}
	}

}

module.exports = ApiSave;
