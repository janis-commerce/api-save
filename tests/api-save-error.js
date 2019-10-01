'use strict';

const assert = require('assert');

const { ApiSaveError } = require('../lib');

describe('Api Save Error', () => {

	it('Should accept a message error and a code', () => {
		const error = new ApiSaveError('Some error', ApiSaveError.codes.INVALID_REQUEST_DATA);

		assert.strictEqual(error.message, 'Some error');
		assert.strictEqual(error.code, ApiSaveError.codes.INVALID_REQUEST_DATA);
		assert.strictEqual(error.name, 'ApiSaveError');
	});

	it('Should accept an error instance and a code', () => {

		const previousError = new Error('Some error');

		const error = new ApiSaveError(previousError, ApiSaveError.codes.INVALID_REQUEST_DATA);

		assert.strictEqual(error.message, 'Some error');
		assert.strictEqual(error.code, ApiSaveError.codes.INVALID_REQUEST_DATA);
		assert.strictEqual(error.name, 'ApiSaveError');
		assert.strictEqual(error.previousError, previousError);
	});
});
