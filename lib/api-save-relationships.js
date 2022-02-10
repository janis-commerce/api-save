'use strict';

const isEqual = require('lodash.isequal');

class ApiSaveRelationships {

	/**
	 * Constructor
	 * @param {*} apiInstance
	 * @param {*} mainId
	 * @param {*} isNewRecord
	 */
	constructor(apiInstance, mainId, isNewRecord) {
		this.apiInstance = apiInstance;
		this.mainId = mainId;
		this.isNewRecord = isNewRecord;
	}

	/**
	 * Save the current item.
	 * @returns {<Promise>} - The promise of the save.
	 */
	process() {

		const promises = Object.keys(this.apiInstance.dataToSave.relationships).map(relationship => this.save(relationship));

		return Promise.all(promises);
	}

	/**
	 * Save the current item.
	 * @param {string} relationship - The relationship to save.
	 * @returns {Boolean} - Boolean if the save was successful.
	 * @throws if the operation fails
	 */
	save(relationship) {

		const relationshipParameters = this.getRelationshipParameters(relationship);

		if(!relationshipParameters)
			throw new Error(`relationshipParameters not defined for ${relationship}`);

		if(!this.isNewRecord && relationshipParameters.shouldClean)
			return this.insertAndRemove(relationship, relationshipParameters);

		return this.insert(relationship, relationshipParameters);
	}

	/**
	 * Formatting the relationships and relationshipParameters to insert.
	 * @param {*} relationship
	 * @param {*} relationshipParameters
	 * @returns {Boolean|undefined} - The relationships to insert.
	 */
	insert(relationship, relationshipParameters) {

		const { modelClass: ModelClass } = relationshipParameters;

		const relationshipsToSave = this._formatRelationshipsToInsert(relationship, relationshipParameters);

		if(!relationshipsToSave.length)
			return Promise.resolve();

		const model = this.apiInstance.session ? this.apiInstance.session.getSessionInstance(ModelClass) : new ModelClass();

		return model.multiInsert(relationshipsToSave);
	}

	/**
	 * Insert and remove the relationships.
	 * @param {*} relationship
	 * @param {*} relationshipParameters
	 * @returns {Array<Promise>} - Array promise of the insert and remove.
	 */
	async insertAndRemove(relationship, relationshipParameters) {

		const { modelClass: ModelClass, mainIdentifierField } = relationshipParameters;

		const model = this.apiInstance.session ? this.apiInstance.session.getSessionInstance(ModelClass) : new ModelClass();
		const currentRelationships = await model.get({
			[mainIdentifierField]: this.mainId
		});

		const relationshipsToSave = this._formatRelationshipsToInsert(relationship, relationshipParameters);

		const { insertData, removeData } = this._splitRelationshipsToUpdate(currentRelationships, relationshipsToSave, relationshipParameters);

		const removePromise = removeData.length ? model.multiRemove(removeData) : Promise.resolve();
		const insertPromise = insertData.length ? model.multiInsert(insertData) : Promise.resolve();

		return Promise.all([removePromise, insertPromise]);
	}

	/**
	 * Get relationship parameters.
	 * @param {*} relationship
	 * @returns {Object} - The relationship parameters.
	 */
	getRelationshipParameters(relationship) {
		return this.apiInstance.constructor.relationshipsParameters[relationship];
	}

	/**
	 * Formatting the relationships and relationshipParameters before insert.
	 * @param {*} relationship
	 * @param {*} relationshipParameters
	 * @returns {Array} - The relationships to insert.
	 */
	_formatRelationshipsToInsert(relationship, relationshipParameters) {

		const { mainIdentifierField, secondaryIdentifierField } = relationshipParameters;

		return this.apiInstance.dataToSave.relationships[relationship]
			.map(relationshipData => {

				if(typeof relationshipData !== 'object')
					relationshipData = { id: relationshipData };

				const { id: relationshipId, ...restOfRelationshipData } = relationshipData;

				return {
					[mainIdentifierField]: this.mainId,
					[secondaryIdentifierField]: relationshipId,
					...restOfRelationshipData
				};
			});
	}

	/**
	 * Split the relationships to insert and remove.
	 * @param {*} currentRelationships
	 * @param {*} relationshipsToSave
	 * @param {*} relationshipParameters
	 * @returns {Object} - The insert and remove data.
	 */
	_splitRelationshipsToUpdate(currentRelationships, relationshipsToSave, relationshipParameters) {

		if(!currentRelationships.length) {
			return {
				insertData: relationshipsToSave,
				removeData: []
			};
		}

		if(!relationshipsToSave.length) {
			return {
				insertData: [],
				removeData: currentRelationships.map(currentRelationship => this._formatRelationshipToRemove(currentRelationship, relationshipParameters))
			};
		}

		const formattedCurrentRelationships = this._formatByIndexes(currentRelationships, relationshipParameters);
		const formattedSaveRelationships = this._formatByIndexes(relationshipsToSave, relationshipParameters);

		const insertData = relationshipsToSave
			.filter(relationshipToSave => !this._relationshipIsTheSame(relationshipToSave, formattedCurrentRelationships, relationshipParameters));

		const removeData = currentRelationships
			.filter(currentRelationship => !this._relationshipIsTheSame(currentRelationship, formattedSaveRelationships, relationshipParameters))
			.map(currentRelationship => this._formatRelationshipToRemove(currentRelationship, relationshipParameters));

		return { insertData, removeData };
	}

	_formatRelationshipToRemove(relationship, { mainIdentifierField, secondaryIdentifierField }) {
		return {
			[mainIdentifierField]: this.mainId,
			[secondaryIdentifierField]: relationship[secondaryIdentifierField]
		};
	}

	_formatByIndexes(relationships, { mainIdentifierField, secondaryIdentifierField }) {

		const formattedRelationships = {};

		for(const relationship of relationships) {

			if(!formattedRelationships[relationship[mainIdentifierField]])
				formattedRelationships[relationship[mainIdentifierField]] = {};

			formattedRelationships[relationship[mainIdentifierField]][relationship[secondaryIdentifierField]] = relationship;
		}

		return formattedRelationships;
	}

	_relationshipIsTheSame(relationship, relationshipsToValidate, { mainIdentifierField, secondaryIdentifierField }) {
		const mainId = relationship[mainIdentifierField];
		const secondaryId = relationship[secondaryIdentifierField];

		return relationshipsToValidate[mainId]
			&& relationshipsToValidate[mainId][secondaryId]
			&& isEqual(relationshipsToValidate[mainId][secondaryId], relationship);
	}

}

module.exports = ApiSaveRelationships;
