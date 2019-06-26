'use strict';

const { struct } = require('superstruct');

/**
 * Generates a Relationship struct
 *
 * @param {string|struct} idStruct The identifier structure
 * @param {object} customStruct The custom structure for each relationship. It will be added to the basic struct
 * @return {struct} The generated struct for the list of relationships
 *
 * @example
 *  const myRelationshipStruct = RelationshipGenerator('number', { comment: 'string?' });
 * @example
 *  const myRelationshipStruct = RelationshipGenerator(struct.function(id => Uuid.validate(id)), { anotherField: struct.list(['string']) });
 */
const RelationshipGenerator = (idStruct = 'number', customStruct) => {

	const idObject = { id: idStruct };

	if(customStruct) {
		return struct.intersection([
			struct.interface(idObject),
			struct.interface(customStruct)
		]);
	}

	const idsStruct = struct.union([
		idStruct,
		idObject
	]);

	return idsStruct;
};

module.exports = RelationshipGenerator;
