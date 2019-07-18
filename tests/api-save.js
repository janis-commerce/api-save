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
		getStruct() {
			return struct({
				id: 'number?',
				main: struct.partial({
					name: 'string'
				}),
				relationships: struct.partial({})
			});
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

		getStruct() {
			return struct({
				id: 'number?',
				main: struct.partial({
					name: 'string'
				}),
				relationships: struct.partial({
					relatedStuff: ['string'],
					otherRelatedStuff: ['string']
				})
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

		getStruct() {
			return struct({
				id: 'number?',
				main: struct.partial({
					name: 'string'
				}),
				relationships: struct.partial({
					relatedStuff: ['string'],
					otherRelatedStuff: struct.list([{
						id: 'number',
						title: 'string',
						comment: 'string?'
					}])
				})
			});
		}
	}

	describe('Static relationshipsParameters getter', () => {
		it('Should return and object', () => {
			assert.deepStrictEqual(typeof ApiSaveData.relationshipsParameters, 'object');
		});
	});

	describe('Validation', () => {

		it('Should throw if data does not match default struct', () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({});

			const apiSave = new ApiSaveData();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = ['invalidId'];
			apiSave.data = ['notValidData'];

			assert.throws(() => apiSave.validate(), ApiSaveError);
		});

		it('Should throw if data does not match struct', () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {};

			assert.throws(() => apiSave.validate(), ApiSaveError);
		});

		it('Should throw if a relationship does not match struct', () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: 'other-stuff-but-invalid'
			};

			assert.throws(() => apiSave.validate(), ApiSaveError);
		});

		it('Should throw if model is not found', () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.throws('Model does not exist');

			const apiSave = new ApiSaveData();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {};

			assert.throws(() => apiSave.validate(), ApiSaveError);
		});

		it('Should pass validation if data matches struct', () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name'
			};

			const validation = apiSave.validate();

			assert.strictEqual(validation, undefined);
		});

		it('Should pass validation if data matches struct, including simple relationships', () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: []
			};

			const validation = apiSave.validate();

			assert.strictEqual(validation, undefined);
		});

		it('Should pass validation if data matches struct, including complex relationships', () => {

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = apiSave.validate();

			assert.strictEqual(validation, undefined);
		});
	});

	describe('Process new record without relationships', () => {

		it('Should throw if Save Main throws', async () => {

			const fakeInsert = sandbox.fake.throws(new Error('Some internal error'));

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [];
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should throw if Save Main fails to save', async () => {

			const fakeInsert = sandbox.fake.returns(false);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [];
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should insert the record and set the ID in the response body', async () => {

			const fakeInsert = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [];
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sandbox.assert.calledOnce(fakeInsert);
			sandbox.assert.calledWithExactly(fakeInsert, {
				name: 'The name'
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
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
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = apiSave.validate();
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
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should update the record and set the ID in the response body', async () => {

			const fakeUpdate = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sandbox.assert.calledOnce(fakeUpdate);
			sandbox.assert.calledWithExactly(fakeUpdate, {
				name: 'The name'
			}, {
				id: 10
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});
		});
	});

	describe('Process new record with simple relationships', () => {

		it('Should throw if relationship save throws', async () => {

			Model.prototype.multiInsert.throws('Some error');

			const fakeInsert = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should save relationships properly', async () => {

			Model.prototype.multiInsert.returns();

			const fakeInsert = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 'other-stuff' }
			]);
		});
	});

	describe('Process existing record with simple relationships', () => {

		it('Should throw if relationship save throws', async () => {

			Model.prototype.multiInsert.throws();
			Model.prototype.get.returns([]);

			const fakeUpdate = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});

			sandbox.assert.calledOnce(fakeUpdate);
		});

		it('Should save relationships properly, without removing when there are not existing relationships', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([]);

			const fakeUpdate = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: 10 });

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 'other-stuff' }
			]);

			sandbox.assert.notCalled(Model.prototype.multiRemove);
		});

		it('Should save relationships properly, removing the existing relationships that changed', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([{ otherFirstId: 10, otherSecondId: 'this-should-be-removed' }]);

			const fakeUpdate = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: 10 });

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 'other-stuff' }
			]);

			sandbox.assert.calledOnce(Model.prototype.multiRemove);
			sandbox.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: 10, otherSecondId: 'this-should-be-removed' }
			]);
		});

		it('Should save the only relationship with elements, removing the existing relationships that changed', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([{ otherFirstId: 10, otherSecondId: 'this-should-be-removed' }]);

			const fakeUpdate = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: []
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: 10 });

			sandbox.assert.calledOnce(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);

			sandbox.assert.calledOnce(Model.prototype.multiRemove);
			sandbox.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: 10, otherSecondId: 'this-should-be-removed' }
			]);
		});

		it('Should not insert or remove if the relationships did not change', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([{ otherFirstId: 10, otherSecondId: 'other-stuff' }]);

			const fakeUpdate = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff']
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: 10 });

			sandbox.assert.calledOnce(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);

			sandbox.assert.notCalled(Model.prototype.multiRemove);
		});
	});

	describe('Process new record with complex relationships', () => {

		it('Should throw if relationship save throws', async () => {

			Model.prototype.multiInsert.throws();
			Model.prototype.get.returns([{ otherFirstId: 10, otherSecondId: 'other-stuff' }]);

			const fakeInsert = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should save relationships properly', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([{ otherFirstId: 10, otherSecondId: 'other-stuff' }]);

			const fakeInsert = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 90, title: 'First title' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);
		});
	});

	describe('Process existing record with complex relationships', () => {

		it('Should throw if relationship save throws', async () => {

			Model.prototype.multiInsert.throws();
			Model.prototype.get.returns([]);

			const fakeInsert = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = apiSave.validate();
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

			const fakeUpdate = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: 10 });

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 90, title: 'First title' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);

			sandbox.assert.notCalled(Model.prototype.multiRemove);
		});

		it('Should save relationships properly, removing the existing relationships that changed', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([
				{ otherFirstId: 10, otherSecondId: 88, title: 'this-should-be-removed' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'this-should-be-removed-too', comment: 'Because of this the changes' }
			]);

			const fakeUpdate = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: 10 });

			sandbox.assert.calledTwice(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 90, title: 'First title' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);

			sandbox.assert.calledOnce(Model.prototype.multiRemove);
			sandbox.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: 10, otherSecondId: 88 },
				{ otherFirstId: 10, otherSecondId: 91 }
			]);
		});

		it('Should save the only relationship with elements, removing the existing relationships that changed', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([
				{ otherFirstId: 10, otherSecondId: 88, title: 'this-should-be-removed' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'this-should-be-removed-too', comment: 'Because of this the changes' }
			]);

			const fakeUpdate = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: []
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: 10 });

			sandbox.assert.calledOnce(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);

			sandbox.assert.calledOnce(Model.prototype.multiRemove);
			sandbox.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: 10, otherSecondId: 88 },
				{ otherFirstId: 10, otherSecondId: 91 }
			]);
		});

		it('Should not insert or remove if the relationships did not change', async () => {

			Model.prototype.multiInsert.returns();
			Model.prototype.multiRemove.returns();
			Model.prototype.get.returns([
				{ otherFirstId: 10, otherSecondId: 90, title: 'First title' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);

			const fakeUpdate = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				update: fakeUpdate
			});

			const apiSave = new MyApiSaveWithStructAndComplexRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {
				name: 'The name',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: [
					{ id: 90, title: 'First title' },
					{ id: 91, title: 'Second title', comment: 'Optional comment' }
				]
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});

			sandbox.assert.calledOnce(Model.prototype.get);
			sandbox.assert.calledWithExactly(Model.prototype.get, { otherFirstId: 10 });

			sandbox.assert.calledOnce(Model.prototype.multiInsert);
			sandbox.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);

			sandbox.assert.notCalled(Model.prototype.multiRemove);
		});
	});

	describe('Process with misconfigured relationships', () => {

		it('Should throw if there are not parameters for a given relationship', async () => {

			class MyApiSaveWithMisconfiguredRelationships extends ApiSaveData {

				getStruct() {
					return struct({
						id: 'number?',
						main: struct.partial({
							name: 'string'
						}),
						relationships: struct.partial({
							badRelationship: ['string']
						})
					});
				}
			}

			Model.prototype.multiInsert.throws();
			Model.prototype.get.returns([]);

			const fakeInsert = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithMisconfiguredRelationships();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [];
			apiSave.data = {
				name: 'The name',
				badRelationship: ['stuff-one', 'stuff-two']
			};

			const validation = apiSave.validate();
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
				getStruct() {
					return struct({
						id: 'number?',
						main: struct.partial({
							name: 'string'
						}),
						relationships: struct.partial({})
					});
				}

				format(record) {
					return {
						...record,
						newField: 'foo'
					};
				}
			}


			const fakeInsert = sandbox.fake.returns(10);

			const getModelInstanceStub = sandbox.stub(ApiSaveValidator.prototype, '_getModelInstance');
			getModelInstanceStub.returns({
				insert: fakeInsert
			});

			const apiSave = new MyApiSaveWithStructAndFormat();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [];
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sandbox.assert.calledOnce(fakeInsert);
			sandbox.assert.calledWithExactly(fakeInsert, {
				name: 'The name',
				newField: 'foo'
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: 10
			});
		});
	});

});
