'use strict';

/**
 * @class representing a ApiSaveMain.
 */

module.exports = class ApiSaveMain {

	/**
	 * Constructor
	 * @param {Object} apiInstance - The API instance.
	 */
	constructor(apiInstance) {
		this.apiInstance = apiInstance;
	}

	/**
	 * Save the current item (insert or update).
	 *
	 * @async
	 * @returns {Promise<void>} - The promise of the save.
	 */
	async process() {

		const dataToSave = {
			...this.apiInstance.dataToSave.main
		};

		if(this.apiInstance.dataToSave.id) {
			const updateResult = await this.apiInstance.model.update(dataToSave, { id: this.apiInstance.dataToSave.id });
			return !updateResult ? updateResult : this.apiInstance.dataToSave.id;
		}

		return this.apiInstance.model.insert(dataToSave);
	}
};
