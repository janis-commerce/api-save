'use strict';

class ApiSaveMain {

	constructor(apiInstance) {
		this.apiInstance = apiInstance;
	}

	async process() {

		const dataToSave = {
			...this.apiInstance.dataToSave.main
		};

		if(this.apiInstance.dataToSave.id) {
			await this.apiInstance.controller.update(dataToSave, { id: this.apiInstance.dataToSave.id });
			return this.apiInstance.dataToSave.id;
		}

		return this.apiInstance.controller.insert(dataToSave);
	}

}

module.exports = ApiSaveMain;
