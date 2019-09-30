'use strict';

const assert = require('assert');
const Model = require('@janiscommerce/model');
const { struct } = require('superstruct');

const sandbox = require('sinon').createSandbox();

const { ApiSaveData } = require('..');
const { ApiSaveError } = require('../lib');
const ApiSaveValidator = require('../lib/api-save-validator');

describe('API Save', () => {

	beforeEach(() => {
		sandbox.stub(Model.prototype);
	});

	afterEach(() => {
		sandbox.restore();
	});

	class MyApiSaveWithStruct extends ApiSaveData {

		static get idStruct() {
			return 'string?';
		}

		static get mainStruct() {
			return struct.partial({
				name: 'string'
			});
		}

		static get relationshipsStruct() {
			return struct.partial({});
		}
	}

	class MyApiSaveWithStructAndRelationships extends ApiSaveData {

		static get relationshipsParameters() {
			return {
				relatedStuff: {
					modelClass: Model,
					mainIdentifierField: 'theFirstId',
					secondaryIdentifierField: 'theSecondId',
					shouldClean: false
				},
				otherRelatedStuff: {
					modelClass: Model,
					mainIdentifierField: 'otherFirstId',
					secondaryIdentifierField: 'otherSecondId',
					shouldClean: true
				}
			};
		}

		static get idStruct() {
			return 'string?';
		}

		static get mainStruct() {
			return struct.partial({
				name: 'string'
			});
		}

		static get relationshipsStruct() {
			return struct.partial({
				relatedStuff: ['string'],
				otherRelatedStuff: ['string']
			});
		}
	}

	class MyApiSaveWithStructAndComplexRelationships extends ApiSaveData {

		static get relationshipsParameters() {
			return {
				relatedStuff: {
					modelClass: Model,
					mainIdentifierField: 'theFirstId',
					secondaryIdentifierField: 'theSecondId',
					shouldClean: false
				},
				otherRelatedStuff: {
					modelClass: Model,
					mainIdentifierField: 'otherFirstId',
					secondaryIdentifierField: 'otherSecondId',
					shouldClean: true
				}
			};
		}

		static get idStruct() {
			return 'string?';
		}

		static get mainStruct() {
			return struct.partial({
				name: 'string'
			});
		}

		static get relationshipsStruct() {
			return struct.partial({
				relatedStuff: ['string'],
				otherRelatedStuff: struct.list([{
					id: 'number',
					title: 'string',
					comment: 'string?'
				}])
			});
		}
	}

	describe('Static relationshipsParameters getter', () => {
		it('Should return and object', () => {
			assert.deepStrictEqual(typeof ApiSaveData.relationshipsParameters, 'object');
		});
	});

	describe('Validation', () => {

		it('Should throw if data does not match struct', async () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {};

			await assert.rejects(() => apiSave.validate(), ApiSaveError);
		});

		it('Should throw if a relationship does not match struct', async () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: 'other-stuff-but-invalid'
			};

			await assert.rejects(() => apiSave.validate(), ApiSaveError);
		});

		it('Should throw if model is not found', async () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.throws('Model does not exist');

			const apiSave = new ApiSaveData();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {};

			await assert.rejects(() => apiSave.validate(), ApiSaveError);
		});

		it('Should pass validation if data matches struct', async () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name'
			};

			const validation = await apiSave.validate();

			assert.strictEqual(validation, undefined);
		});

		it('Should pass validation if data matches struct, including simple relationships', async () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: []
			};

			const validation = await apiSave.validate();

			assert.strictEqual(validation, undefined);
		});

		it('Should pass validation if data matches struct, including complex relationships', async () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = await apiSave.validate();

			assert.strictEqual(validation, undefined);
		});
	});

	describe('Process with the default struct', async () => {

		it('Should save every field as main data, and none of them as relationships', async () => {

			const fakeInsert = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new ApiSaveData();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sandbox.assert.calledOnce(fakeInsert);
			sandbox.assert.calledWithExactly(fakeInsert, {
				name: 'The name',
				otherField: 'foo'
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});

			assert.strictEqual(apiSave.hasRelationships(), false);
		});
	});

	describe('Process new record without relationships', async () => {

		it('Should throw if Save Main throws', async () => {

			const fakeInsert = sandbox.fake.throws(new Error('Some internal error'));

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should throw if Save Main throws with nested exception', async () => {

			const nestedException = { name: 'TypeError', code: 99, message: 'previous message of nested exception' };

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: sandbox.stub().throws(nestedException)
			});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR,
				previousError: { name: 'TypeError', code: 99, message: 'previous message of nested exception' }
			});
		});

		it('Should throw if Save Main fails to save', async () => {

			const fakeInsert = sandbox.fake.returns(false);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should insert the record and set the ID in the response body', async () => {

			const fakeInsert = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sandbox.assert.calledOnce(fakeInsert);
			sandbox.assert.calledWithExactly(fakeInsert, {
				name: 'The name'
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});
		});

		it('Should insert the record and set the ID in the response body without saving relationships', async () => {

			const fakeInsert = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo',
				relatedStuff: [],
				otherRelatedStuff: []
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sandbox.assert.calledOnce(fakeInsert);
			sandbox.assert.calledWithExactly(fakeInsert, {
				name: 'The name'
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});
		});
	});

	describe('Process existing record without relationships', () => {

		it('Should throw if Save Main throws', async () => {

			const fakeUpdate = sandbox.fake.throws(new Error('Some internal error'));

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should throw if Save Main fails to update', async () => {

			const fakeUpdate = sandbox.fake.returns(false);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should update the record and set the ID in the response body', async () => {

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sandbox.assert.calledOnce(fakeUpdate);
			sandbox.assert.calledWithExactly(fakeUpdate, {
				name: 'The name'
			}, {
				id: '10'
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});
		});
	});

	describe('Process new record with simple relationships', () => {

		it('Should throw if relationship save throws', async () => {

			Model.prototype.multiInsert.throws('Some error');

			const fakeInsert = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should save relationships properly', async () => {

			Model.prototype.multiInsert.returns();

			const fakeInsert = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 'other-stuff' }
			]);
		});
	});

	describe('Process existing record with simple relationships', () => {

		it('Should throw if relationship save throws', async () => {

			Model.prototype.multiInsert.throws();
			Model.prototype.get.returns([]);

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});

			sandbox.assert.calledOnce(fakeUpdate);
		});

		it('Should throw if relationship save throws with nested exception', async () => {

			Model.prototype.multiInsert.throws({ name: 'TypeError', code: 99, message: 'previous message of nested exception' });
			Model.prototype.get.returns([]);

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR,
				previousError: { name: 'TypeError', code: 99, message: 'previous message of nested exception' }
			});

			sandbox.assert.calledOnce(fakeUpdate);
		});

		it('Should save relationships properly, without removing when there are not existing relationships', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([]);

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 'other-stuff' }
			]);

			sandbox.assert.notCalled(Model.prototype.multiRemove);
		});

		it('Should save relationships properly, removing the existing relationships that changed', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([{ otherFirstId: '10', otherSecondId: 'this-should-be-removed' }]);

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 'other-stuff' }
			]);

			sandbox.assert.calledOnce(Model.prototype.multiRemove);
			sandbox.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: '10', otherSecondId: 'this-should-be-removed' }
			]);
		});

		it('Should save the only relationship with elements, removing the existing relationships that changed', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([{ otherFirstId: '10', otherSecondId: 'this-should-be-removed' }]);

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: []
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sandbox.assert.calledOnce(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);

			sandbox.assert.calledOnce(Model.prototype.multiRemove);
			sandbox.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: '10', otherSecondId: 'this-should-be-removed' }
			]);
		});

		it('Should not insert or remove if the relationships did not change', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([{ otherFirstId: '10', otherSecondId: 'other-stuff' }]);

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sandbox.assert.calledOnce(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);

			sandbox.assert.notCalled(Model.prototype.multiRemove);
		});
	});

	describe('Process new record with complex relationships', () => {

		it('Should throw if relationship save throws', async () => {

			Model.prototype.multiInsert.throws();
			Model.prototype.get.returns([{ otherFirstId: '10', otherSecondId: 'other-stuff' }]);

			const fakeInsert = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should save relationships properly', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([{ otherFirstId: '10', otherSecondId: 'other-stuff' }]);

			const fakeInsert = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 90, title: 'First title' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);
		});
	});

	describe('Process existing record with complex relationships', () => {

		it('Should throw if relationship save throws', async () => {

			Model.prototype.multiInsert.throws();
			Model.prototype.get.returns([]);

			const fakeInsert = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should save relationships properly, without removing when there are not existing relationships', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([]);

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 90, title: 'First title' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);

			sandbox.assert.notCalled(Model.prototype.multiRemove);
		});

		it('Should save relationships properly, removing the existing relationships that changed', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([
				{ otherFirstId: '10', otherSecondId: 88, title: 'this-should-be-removed' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'this-should-be-removed-too', comment: 'Because of this the changes' }
			]);

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 90, title: 'First title' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);

			sandbox.assert.calledOnce(Model.prototype.multiRemove);
			sandbox.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: '10', otherSecondId: 88 },
				{ otherFirstId: '10', otherSecondId: 91 }
			]);
		});

		it('Should save the only relationship with elements, removing the existing relationships that changed', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([
				{ otherFirstId: '10', otherSecondId: 88, title: 'this-should-be-removed' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'this-should-be-removed-too', comment: 'Because of this the changes' }
			]);

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: []
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sandbox.assert.calledOnce(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);

			sandbox.assert.calledOnce(Model.prototype.multiRemove);
			sandbox.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: '10', otherSecondId: 88 },
				{ otherFirstId: '10', otherSecondId: 91 }
			]);
		});

		it('Should not insert or remove if the relationships did not change', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([
				{ otherFirstId: '10', otherSecondId: 90, title: 'First title' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sandbox.assert.calledOnce(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);

			sandbox.assert.notCalled(Model.prototype.multiRemove);
		});
	});

	describe('Process with misconfigured relationships', () => {

		it('Should throw if there are not parameters for a given relationship', async () => {

			class MyApiSaveWithMisconfiguredRelationships extends ApiSaveData {

				static get idStruct() {
					return 'string?';
				}

				static get mainStruct() {
					return struct.partial({
						name: 'string'
					});
				}

				static get relationshipsStruct() {
					return struct.partial({
						badRelationship: ['string']
					});
				}
			}

			Model.prototype.multiInsert.throws();
			Model.prototype.get.returns([]);

			const fakeInsert = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithMisconfiguredRelationships();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				badRelationship: ['stuff-one', 'stuff-two']
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR,
				message: /badRelationship/
			});
		});
	});

	describe('Process with format method', () => {

		it('Should format the data properly before saving', async () => {

			class MyApiSaveWithStructAndFormat extends ApiSaveData {
				static get idStruct() {
					return 'string?';
				}

				static get mainStruct() {
					return struct.partial({
						name: 'string'
					});
				}

				static get relationshipsStruct() {
					return struct.partial({});
				}

				format(record) {
					return {
						...record,
						newField: 'foo'
					};
				}
			}


			const fakeInsert = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndFormat();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sandbox.assert.calledOnce(fakeInsert);
			sandbox.assert.calledWithExactly(fakeInsert, {
				name: 'The name',
				newField: 'foo'
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});
		});
	});

	describe('Process with client specific model', () => {

		it('Should instance the models through the client getInstance method when creating a record', async () => {

			const clientMock = {
				getInstance: sandbox.fake.returns(new Model())
			};

			const fakeInsert = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff-one', 'other-stuff-two']
			};
			apiSave.client = clientMock;

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sandbox.assert.calledTwice(clientMock.getInstance);
			sandbox.assert.calledWithExactly(clientMock.getInstance, Model);
		});

		it('Should instance the models through the client getInstance method when updating a record', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([]);

			const clientMock = {
				getInstance: sandbox.fake.returns(new Model())
			};

			const fakeUpdate = sandbox.fake.returns('10');

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff-one', 'other-stuff-two']
			};
			apiSave.client = clientMock;

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sandbox.assert.calledTwice(clientMock.getInstance);
			sandbox.assert.calledWithExactly(clientMock.getInstance, Model);
		});
	});

});
