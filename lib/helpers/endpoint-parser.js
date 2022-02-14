'use strict';

const ApiSaveError = require('../api-save-error');
const camelize = require('../utils/camelize');

/**
 * @class representing a ApiSaveMain.
 */

/**
 * @typedef {Object} ApiSaveError A instance of ApiSaveError class
 */
module.exports = class EndpointParser {

	/**
	 * Sanitize and validate the provided endpoint.
	 *
	 * @static
	 * @param {string} endpoint
	 * @returns {Object} modelName, recordId, parents - The parsed endpoint
	 * @throws {ApiSaveError} - If the endpoint is not valid
	 */
	static parse(endpoint) {

		if(!endpoint)
			throw new ApiSaveError('Endpoint not set.', ApiSaveError.codes.INTERNAL_ERROR);

		const sanitizedEndpoint = endpoint.replace(/^\/?(api\/?)?/i, '');

		if(!sanitizedEndpoint)
			throw new ApiSaveError('Invalid Rest endpoint.', ApiSaveError.codes.INVALID_REQUEST_DATA);

		const sanitizedEndpointParts = sanitizedEndpoint.split('/');

		const partsQuantity = sanitizedEndpointParts.length;

		let modelName;
		let recordId;
		const parents = {};

		for(let i = 0; i < partsQuantity; i += 2) {

			modelName = sanitizedEndpointParts[i].toLowerCase();

			if((i + 2) < partsQuantity)
				parents[camelize(sanitizedEndpointParts[i].toLowerCase())] = sanitizedEndpointParts[i + 1];
			else
				recordId = sanitizedEndpointParts[i + 1];
		}

		return {
			modelName,
			recordId,
			parents
		};
	}
};
