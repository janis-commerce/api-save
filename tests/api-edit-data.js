'use strict';

const assert = require('assert');
const { Controller } = require('@janiscommerce/model-controller');

const sandbox = require('sinon').createSandbox();

const { ApiSave } = require('..');
const { ApiSaveError } = require('../lib');

describe('API Save', () => {

	afterEach(() => {
		sandbox.restore();
	});

	describe('Validation', () => {

		it('Should throw if controller is not found', () => {

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.throws('Controller does not exist');

			const apiSave = new ApiSave();
			apiSave.entity = 'some-entity';

			assert.throws(() => apiSave.validate(), ApiSaveError);

			sandbox.assert.calledOnce(controllerStub);
			sandbox.assert.calledWithExactly(controllerStub, 'some-entity');
		});

	});

	describe('Process', () => {
	});

});
