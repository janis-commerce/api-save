'use strict';

const assert = require('assert');
const { Controller } = require('@janiscommerce/model-controller');
const { struct } = require('superstruct');

const sandbox = require('sinon').createSandbox();

const { ApiSaveData } = require('..');
const { ApiSaveError } = require('../lib');

describe('API Save', () => {

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
					controller: Controller.getInstance('other-entity'),
					mainIdentifierField: 'theFirstId',
					secondaryIdentifierField: 'theSecondId',
					shouldClean: false
				},
				otherRelatedStuff: {
					controller: Controller.getInstance('yet-another-entity'),
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
					controller: Controller.getInstance('other-entity'),
					mainIdentifierField: 'theFirstId',
					secondaryIdentifierField: 'theSecondId',
					shouldClean: false
				},
				otherRelatedStuff: {
					controller: Controller.getInstance('yet-another-entity'),
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

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({});

			const apiSave = new ApiSaveData();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = ['invalidId'];
			apiSave.data = ['notValidData'];

			assert.throws(() => apiSave.validate(), ApiSaveError);
		});

		it('Should throw if data does not match struct', () => {

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({});

			const apiSave = new MyApiSaveWithStruct();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {};

			assert.throws(() => apiSave.validate(), ApiSaveError);
		});

		it('Should throw if a relationship does not match struct', () => {

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({});

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

		it('Should throw if controller is not found', () => {

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.throws('Controller does not exist');

			const apiSave = new ApiSaveData();
			apiSave.entity = 'some-entity';
			apiSave.pathParameters = [10];
			apiSave.data = {};

			assert.throws(() => apiSave.validate(), ApiSaveError);

			sandbox.assert.calledOnce(controllerStub);
			sandbox.assert.calledWithExactly(controllerStub, 'some-entity');
		});

		it('Should pass validation if data matches struct', () => {

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({});

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

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({});

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

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({});

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

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
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

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
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

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
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

			const fakeUpdate = sandbox.fake();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
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

			const fakeInsert = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.fake.throws();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				insert: fakeInsert,
				multiInsert: fakeMultiInsert
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
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should save relationships properly', async () => {

			const fakeInsert = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.stub();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				insert: fakeInsert,
				multiInsert: fakeMultiInsert
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

			sandbox.assert.calledTwice(fakeMultiInsert);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 'other-stuff' }
			]);
		});
	});

	describe('Process existing record with simple relationships', () => {

		it('Should throw if relationship save throws', async () => {

			const fakeGet = sandbox.fake.returns([]);
			const fakeInsert = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.fake.throws();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				get: fakeGet,
				insert: fakeInsert,
				multiInsert: fakeMultiInsert
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
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});
		});

		it('Should save relationships properly, without removing when there are not existing relationships', async () => {

			const fakeGet = sandbox.fake.returns([]);
			const fakeUpdate = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.stub();
			const fakeMultiRemove = sandbox.stub();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				get: fakeGet,
				update: fakeUpdate,
				multiInsert: fakeMultiInsert,
				multiRemove: fakeMultiRemove
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

			sandbox.assert.calledOnce(fakeGet);
			sandbox.assert.calledWithExactly(fakeGet, { otherFirstId: 10 });

			sandbox.assert.calledTwice(fakeMultiInsert);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 'other-stuff' }
			]);

			sandbox.assert.notCalled(fakeMultiRemove);
		});

		it('Should save relationships properly, removing the existing relationships that changed', async () => {

			const fakeGet = sandbox.fake.returns([{ otherFirstId: 10, otherSecondId: 'this-should-be-removed' }]);
			const fakeUpdate = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.stub();
			const fakeMultiRemove = sandbox.stub();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				get: fakeGet,
				update: fakeUpdate,
				multiInsert: fakeMultiInsert,
				multiRemove: fakeMultiRemove
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

			sandbox.assert.calledOnce(fakeGet);
			sandbox.assert.calledWithExactly(fakeGet, { otherFirstId: 10 });

			sandbox.assert.calledTwice(fakeMultiInsert);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 'other-stuff' }
			]);

			sandbox.assert.calledOnce(fakeMultiRemove);
			sandbox.assert.calledWithExactly(fakeMultiRemove, [
				{ otherFirstId: 10, otherSecondId: 'this-should-be-removed' }
			]);
		});

		it('Should save the only relationship with elements, removing the existing relationships that changed', async () => {

			const fakeGet = sandbox.fake.returns([{ otherFirstId: 10, otherSecondId: 'this-should-be-removed' }]);
			const fakeUpdate = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.stub();
			const fakeMultiRemove = sandbox.stub();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				get: fakeGet,
				update: fakeUpdate,
				multiInsert: fakeMultiInsert,
				multiRemove: fakeMultiRemove
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

			sandbox.assert.calledOnce(fakeGet);
			sandbox.assert.calledWithExactly(fakeGet, { otherFirstId: 10 });

			sandbox.assert.calledOnce(fakeMultiInsert);
			sandbox.assert.calledWithExactly(fakeMultiInsert, [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);

			sandbox.assert.calledOnce(fakeMultiRemove);
			sandbox.assert.calledWithExactly(fakeMultiRemove, [
				{ otherFirstId: 10, otherSecondId: 'this-should-be-removed' }
			]);
		});

		it('Should not insert or remove if the relationships did not change', async () => {

			const fakeGet = sandbox.fake.returns([{ otherFirstId: 10, otherSecondId: 'other-stuff' }]);
			const fakeUpdate = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.stub();
			const fakeMultiRemove = sandbox.stub();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				get: fakeGet,
				update: fakeUpdate,
				multiInsert: fakeMultiInsert,
				multiRemove: fakeMultiRemove
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

			sandbox.assert.calledOnce(fakeGet);
			sandbox.assert.calledWithExactly(fakeGet, { otherFirstId: 10 });

			sandbox.assert.calledOnce(fakeMultiInsert);
			sandbox.assert.calledWithExactly(fakeMultiInsert, [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);

			sandbox.assert.notCalled(fakeMultiRemove);
		});
	});

	describe('Process new record with complex relationships', () => {

		it('Should throw if relationship save throws', async () => {

			const fakeInsert = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.fake.throws();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				insert: fakeInsert,
				multiInsert: fakeMultiInsert
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

			const fakeInsert = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.stub();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				insert: fakeInsert,
				multiInsert: fakeMultiInsert
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

			sandbox.assert.calledTwice(fakeMultiInsert);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 90, title: 'First title' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);
		});
	});

	describe('Process existing record with complex relationships', () => {

		it('Should throw if relationship save throws', async () => {

			const fakeGet = sandbox.fake.returns([]);
			const fakeInsert = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.fake.throws();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				get: fakeGet,
				insert: fakeInsert,
				multiInsert: fakeMultiInsert
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

			const fakeGet = sandbox.fake.returns([]);
			const fakeUpdate = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.stub();
			const fakeMultiRemove = sandbox.stub();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				get: fakeGet,
				update: fakeUpdate,
				multiInsert: fakeMultiInsert,
				multiRemove: fakeMultiRemove
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

			sandbox.assert.calledOnce(fakeGet);
			sandbox.assert.calledWithExactly(fakeGet, { otherFirstId: 10 });

			sandbox.assert.calledTwice(fakeMultiInsert);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 90, title: 'First title' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);

			sandbox.assert.notCalled(fakeMultiRemove);
		});

		it('Should save relationships properly, removing the existing relationships that changed', async () => {

			const fakeGet = sandbox.fake.returns([
				{ otherFirstId: 10, otherSecondId: 88, title: 'this-should-be-removed' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'this-should-be-removed-too', comment: 'Because of this the changes' }
			]);
			const fakeUpdate = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.stub();
			const fakeMultiRemove = sandbox.stub();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				get: fakeGet,
				update: fakeUpdate,
				multiInsert: fakeMultiInsert,
				multiRemove: fakeMultiRemove
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

			sandbox.assert.calledOnce(fakeGet);
			sandbox.assert.calledWithExactly(fakeGet, { otherFirstId: 10 });

			sandbox.assert.calledTwice(fakeMultiInsert);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(0), [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);
			sandbox.assert.calledWithExactly(fakeMultiInsert.getCall(1), [
				{ otherFirstId: 10, otherSecondId: 90, title: 'First title' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);

			sandbox.assert.calledOnce(fakeMultiRemove);
			sandbox.assert.calledWithExactly(fakeMultiRemove, [
				{ otherFirstId: 10, otherSecondId: 88 },
				{ otherFirstId: 10, otherSecondId: 91 }
			]);
		});

		it('Should save the only relationship with elements, removing the existing relationships that changed', async () => {

			const fakeGet = sandbox.fake.returns([
				{ otherFirstId: 10, otherSecondId: 88, title: 'this-should-be-removed' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'this-should-be-removed-too', comment: 'Because of this the changes' }
			]);
			const fakeUpdate = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.stub();
			const fakeMultiRemove = sandbox.stub();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				get: fakeGet,
				update: fakeUpdate,
				multiInsert: fakeMultiInsert,
				multiRemove: fakeMultiRemove
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

			sandbox.assert.calledOnce(fakeGet);
			sandbox.assert.calledWithExactly(fakeGet, { otherFirstId: 10 });

			sandbox.assert.calledOnce(fakeMultiInsert);
			sandbox.assert.calledWithExactly(fakeMultiInsert, [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);

			sandbox.assert.calledOnce(fakeMultiRemove);
			sandbox.assert.calledWithExactly(fakeMultiRemove, [
				{ otherFirstId: 10, otherSecondId: 88 },
				{ otherFirstId: 10, otherSecondId: 91 }
			]);
		});

		it('Should not insert or remove if the relationships did not change', async () => {

			const fakeGet = sandbox.fake.returns([
				{ otherFirstId: 10, otherSecondId: 90, title: 'First title' },
				{ otherFirstId: 10, otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);
			const fakeUpdate = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.stub();
			const fakeMultiRemove = sandbox.stub();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				get: fakeGet,
				update: fakeUpdate,
				multiInsert: fakeMultiInsert,
				multiRemove: fakeMultiRemove
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

			sandbox.assert.calledOnce(fakeGet);
			sandbox.assert.calledWithExactly(fakeGet, { otherFirstId: 10 });

			sandbox.assert.calledOnce(fakeMultiInsert);
			sandbox.assert.calledWithExactly(fakeMultiInsert, [
				{ theFirstId: 10, theSecondId: 'stuff-one' },
				{ theFirstId: 10, theSecondId: 'stuff-two' }
			]);

			sandbox.assert.notCalled(fakeMultiRemove);
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

			const fakeGet = sandbox.fake.returns([]);
			const fakeInsert = sandbox.fake.returns(10);
			const fakeMultiInsert = sandbox.fake.throws();

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
				get: fakeGet,
				insert: fakeInsert,
				multiInsert: fakeMultiInsert
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

			const controllerStub = sandbox.stub(Controller, 'getInstance');
			controllerStub.returns({
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
