'use strict';

const assert = require('assert');
const path = require('path');

const mockRequire = require('mock-require');
const { struct } = require('@janiscommerce/superstruct');

const sinon = require('sinon');

const { ApiSaveData, ApiSaveError } = require('../lib');

const modelPath = path.join(process.cwd(), process.env.MS_PATH || '', 'models', 'some-entity');

describe('API Save', () => {

	class Model {

		async get() {
			return [];
		}

		async getById() {
			return {};
		}

		async insert() {
			return '10';
		}

		async update() {
			return '10';
		}

		async multiInsert() {
			return true;
		}

		async multiRemove() {
			return true;
		}
	}

	before(() => {
		mockRequire(modelPath, Model);
	});

	after(() => {
		mockRequire.stop(modelPath);
	});

	beforeEach(() => {
		sinon.stub(Model.prototype);
	});

	afterEach(() => {
		sinon.restore();
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

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {};

			await assert.rejects(() => apiSave.validate(), ApiSaveError);
		});

		it('Should throw if a relationship does not match struct', async () => {

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

			const apiSave = new ApiSaveData();
			apiSave.endpoint = '/api/some-other-entity/10';
			apiSave.data = {};

			await assert.rejects(() => apiSave.validate(), ApiSaveError);
		});

		it('Should pass validation if data matches struct', async () => {

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name'
			};

			const validation = await apiSave.validate();

			assert.strictEqual(validation, undefined);
		});

		it('Should pass validation if data matches struct, including simple relationships', async () => {

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

			Model.prototype.insert.returns('10');

			const apiSave = new ApiSaveData();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sinon.assert.calledOnceWithExactly(Model.prototype.insert, {
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

			Model.prototype.insert.throws(new Error('Some internal error'));

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
				previousError: new Error('Some internal error')
			});
		});

		it('Should throw if Save Main fails to save', async () => {

			Model.prototype.insert.returns(false);

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

		it('Should throw and format the duplicated key errors', async () => {

			Model.prototype.insert.rejects(
				new Error('E11000 duplicate key error collection: db.collection index: some_index dup key: { "field": "data" }')
			);

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
				code: ApiSaveError.codes.DUPLICATED_KEY_ERROR,
				message: 'A document for field or fields: \'field\' already exists'
			});
		});

		it('Should throw and format the duplicated key errors with multiple index', async () => {

			Model.prototype.insert.rejects(
				new Error('E11000 duplicate key error collection: db.collection index: some_index dup key: { "some": "data", "other": "data" }')
			);

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
				code: ApiSaveError.codes.DUPLICATED_KEY_ERROR,
				message: 'A document for field or fields: \'some\', \'other\' already exists'
			});
		});

		it('Should throw and format the duplicated key errors if error message has not a valid JSON', async () => {

			Model.prototype.insert.rejects(
				new Error('E11000 duplicate key error collection: db.collection index: some_index dup key: { "field",: "data" }')
			);

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
				code: ApiSaveError.codes.DUPLICATED_KEY_ERROR,
				message: 'A document already exists'
			});
		});

		it('Should insert the record and set the ID in the response body', async () => {

			Model.prototype.insert.returns('10');

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sinon.assert.calledOnceWithExactly(Model.prototype.insert, {
				name: 'The name'
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});
		});

		it('Should insert the record and set the ID in the response body without saving relationships', async () => {

			Model.prototype.insert.returns('10');

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

			sinon.assert.calledOnceWithExactly(Model.prototype.insert, {
				name: 'The name'
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});
		});
	});

	describe('Process existing record without relationships', () => {

		it('Should throw if Save Main throws', async () => {

			Model.prototype.update.throws(new Error('Some internal error'));

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
				code: ApiSaveError.codes.INTERNAL_ERROR,
				previousError: new Error('Some internal error')
			});
		});

		it('Should throw if Save Main fails to update', async () => {

			Model.prototype.update.returns(false);

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

			Model.prototype.update.returns('10');

			const apiSave = new MyApiSaveWithStruct();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sinon.assert.calledOnceWithExactly(Model.prototype.update, {
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

			Model.prototype.insert.returns('10');
			Model.prototype.multiInsert.throws(new Error('Some internal error'));

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

			Model.prototype.insert.returns('10');
			Model.prototype.multiInsert.returns(true);

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

			sinon.assert.calledTwice(Model.prototype.multiInsert);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 'other-stuff' }
			]);
		});
	});

	describe('Process existing record with simple relationships', () => {

		it('Should throw if relationship save throws', async () => {

			Model.prototype.update.returns('10');
			Model.prototype.multiInsert.throws(new Error('Some error'));
			Model.prototype.get.returns([]);

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
				previousError: new Error('Some error')
			});

			sinon.assert.calledOnce(Model.prototype.update);
		});

		it('Should save relationships properly, without removing when there are not existing relationships', async () => {

			Model.prototype.update.returns('10');
			Model.prototype.multiInsert.returns(true);
			Model.prototype.get.returns([]);

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

			sinon.assert.calledOnceWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sinon.assert.calledTwice(Model.prototype.multiInsert);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 'other-stuff' }
			]);

			sinon.assert.notCalled(Model.prototype.multiRemove);
		});

		it('Should save relationships properly, removing the existing relationships that changed', async () => {

			Model.prototype.update.returns('10');
			Model.prototype.multiInsert.returns(true);
			Model.prototype.multiRemove.returns(true);
			Model.prototype.get.returns([{ otherFirstId: '10', otherSecondId: 'this-should-be-removed' }]);

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

			sinon.assert.calledOnce(Model.prototype.get);
			sinon.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sinon.assert.calledTwice(Model.prototype.multiInsert);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 'other-stuff' }
			]);

			sinon.assert.calledOnce(Model.prototype.multiRemove);
			sinon.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: '10', otherSecondId: 'this-should-be-removed' }
			]);
		});

		it('Should save the only relationship with elements, removing the existing relationships that changed', async () => {

			Model.prototype.update.returns('10');
			Model.prototype.multiInsert.returns(true);
			Model.prototype.multiRemove.returns(true);
			Model.prototype.get.returns([{ otherFirstId: '10', otherSecondId: 'this-should-be-removed' }]);

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

			sinon.assert.calledOnce(Model.prototype.get);
			sinon.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sinon.assert.calledOnce(Model.prototype.multiInsert);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);

			sinon.assert.calledOnce(Model.prototype.multiRemove);
			sinon.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: '10', otherSecondId: 'this-should-be-removed' }
			]);
		});

		it('Should not insert or remove if the relationships did not change', async () => {

			Model.prototype.update.returns('10');
			Model.prototype.multiInsert.returns(true);
			Model.prototype.multiRemove.returns(true);
			Model.prototype.get.returns([{ otherFirstId: '10', otherSecondId: 'other-stuff' }]);

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

			sinon.assert.calledOnce(Model.prototype.get);
			sinon.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sinon.assert.calledOnce(Model.prototype.multiInsert);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);

			sinon.assert.notCalled(Model.prototype.multiRemove);
		});
	});

	describe('Process new record with complex relationships', () => {

		it('Should throw if relationship save throws', async () => {

			Model.prototype.insert.returns('10');
			Model.prototype.multiInsert.throws(new Error('Some error'));
			Model.prototype.get.returns([{ otherFirstId: '10', otherSecondId: 'other-stuff' }]);

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
				code: ApiSaveError.codes.INTERNAL_ERROR,
				previousError: new Error('Some error')
			});
		});

		it('Should save relationships properly', async () => {

			Model.prototype.insert.returns('10');
			Model.prototype.multiInsert.returns(true);
			Model.prototype.multiRemove.returns(true);
			Model.prototype.get.returns([{ otherFirstId: '10', otherSecondId: 'other-stuff' }]);

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

			sinon.assert.calledTwice(Model.prototype.multiInsert);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 90, title: 'First title' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);
		});
	});

	describe('Process existing record with complex relationships', () => {

		it('Should throw if relationship save throws', async () => {

			Model.prototype.update.returns('10');
			Model.prototype.multiInsert.throws(new Error('Some error'));
			Model.prototype.get.returns([]);

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

			await assert.rejects(() => apiSave.process(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR,
				previousError: new Error('Some error')
			});
		});

		it('Should save relationships properly, without removing when there are not existing relationships', async () => {

			Model.prototype.update.returns('10');
			Model.prototype.multiInsert.returns(true);
			Model.prototype.multiRemove.returns(true);
			Model.prototype.get.returns([]);

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

			sinon.assert.calledOnce(Model.prototype.get);
			sinon.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sinon.assert.calledTwice(Model.prototype.multiInsert);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 90, title: 'First title' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);

			sinon.assert.notCalled(Model.prototype.multiRemove);
		});

		it('Should save relationships properly, removing the existing relationships that changed', async () => {

			Model.prototype.update.returns('10');
			Model.prototype.multiInsert.returns(true);
			Model.prototype.multiRemove.returns(true);
			Model.prototype.get.returns([
				{ otherFirstId: '10', otherSecondId: 88, title: 'this-should-be-removed' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'this-should-be-removed-too', comment: 'Because of this the changes' }
			]);

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

			sinon.assert.calledOnce(Model.prototype.get);
			sinon.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sinon.assert.calledTwice(Model.prototype.multiInsert);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(0), [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert.getCall(1), [
				{ otherFirstId: '10', otherSecondId: 90, title: 'First title' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);

			sinon.assert.calledOnce(Model.prototype.multiRemove);
			sinon.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: '10', otherSecondId: 88 },
				{ otherFirstId: '10', otherSecondId: 91 }
			]);
		});

		it('Should save the only relationship with elements, removing the existing relationships that changed', async () => {

			Model.prototype.update.returns('10');
			Model.prototype.multiInsert.returns(true);
			Model.prototype.multiRemove.returns(true);
			Model.prototype.get.returns([
				{ otherFirstId: '10', otherSecondId: 88, title: 'this-should-be-removed' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'this-should-be-removed-too', comment: 'Because of this the changes' }
			]);

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

			sinon.assert.calledOnce(Model.prototype.get);
			sinon.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sinon.assert.calledOnce(Model.prototype.multiInsert);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);

			sinon.assert.calledOnce(Model.prototype.multiRemove);
			sinon.assert.calledWithExactly(Model.prototype.multiRemove, [
				{ otherFirstId: '10', otherSecondId: 88 },
				{ otherFirstId: '10', otherSecondId: 91 }
			]);
		});

		it('Should not insert or remove if the relationships did not change', async () => {

			Model.prototype.update.returns('10');
			Model.prototype.multiInsert.returns(true);
			Model.prototype.multiRemove.returns(true);
			Model.prototype.get.returns([
				{ otherFirstId: '10', otherSecondId: 90, title: 'First title' },
				{ otherFirstId: '10', otherSecondId: 91, title: 'Second title', comment: 'Optional comment' }
			]);

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

			sinon.assert.calledOnce(Model.prototype.get);
			sinon.assert.calledWithExactly(Model.prototype.get, { otherFirstId: '10' });

			sinon.assert.calledOnce(Model.prototype.multiInsert);
			sinon.assert.calledWithExactly(Model.prototype.multiInsert, [
				{ theFirstId: '10', theSecondId: 'stuff-one' },
				{ theFirstId: '10', theSecondId: 'stuff-two' }
			]);

			sinon.assert.notCalled(Model.prototype.multiRemove);
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

			Model.prototype.insert.returns('10');
			Model.prototype.multiInsert.throws(new Error('Some error'));
			Model.prototype.get.returns([]);

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


			Model.prototype.insert.returns('10');

			const apiSave = new MyApiSaveWithStructAndFormat();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sinon.assert.calledOnce(Model.prototype.insert);
			sinon.assert.calledWithExactly(Model.prototype.insert, {
				name: 'The name',
				newField: 'foo'
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});
		});

		it('Should format the data properly before saving with an async format method', async () => {

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

				async format(record) {
					return {
						...record,
						newField: 'foo'
					};
				}
			}


			Model.prototype.insert.returns('10');

			const apiSave = new MyApiSaveWithStructAndFormat();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sinon.assert.calledOnce(Model.prototype.insert);
			sinon.assert.calledWithExactly(Model.prototype.insert, {
				name: 'The name',
				newField: 'foo'
			});

			assert.deepStrictEqual(apiSave.response.body, {
				id: '10'
			});
		});
	});

	describe('Process with postSaveHook method', () => {

		it('Should execute the postSaveHook after saving', async () => {

			class MyApiSaveWithStructAndHook extends ApiSaveData {

				static get mainStruct() {
					return struct.partial({
						name: 'string'
					});
				}

				async postSaveHook(id, record) {
					return {
						id,
						record
					};
				}
			}

			sinon.spy(MyApiSaveWithStructAndHook.prototype, 'postSaveHook');

			Model.prototype.insert.returns('10');

			const apiSave = new MyApiSaveWithStructAndHook();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sinon.assert.calledOnce(MyApiSaveWithStructAndHook.prototype.postSaveHook);
			sinon.assert.calledWithExactly(MyApiSaveWithStructAndHook.prototype.postSaveHook, '10', {
				name: 'The name'
			});
		});
	});

	describe('Process with API Session', () => {

		it('Should instance the models through the session getSessionInstance method when creating a record', async () => {

			Model.prototype.insert.returns('10');

			const sessionMock = {
				getSessionInstance: sinon.fake.returns(new Model())
			};

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff-one', 'other-stuff-two']
			};
			apiSave.session = sessionMock;

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			// 1: Para obtener el model principal. 2 y 3: Para los modelos de las relaciones
			sinon.assert.calledThrice(sessionMock.getSessionInstance);
			sinon.assert.calledWithExactly(sessionMock.getSessionInstance, Model);
		});

		it('Should instance the models through the session getSessionInstance method when updating a record', async () => {

			Model.prototype.update.returns('10');
			Model.prototype.multiInsert.returns(true);
			Model.prototype.multiRemove.returns(true);
			Model.prototype.get.returns([]);

			const sessionMock = {
				getSessionInstance: sinon.fake.returns(new Model())
			};

			const apiSave = new MyApiSaveWithStructAndRelationships();
			apiSave.endpoint = '/api/some-entity/10';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo',
				relatedStuff: ['stuff-one', 'stuff-two'],
				otherRelatedStuff: ['other-stuff-one', 'other-stuff-two']
			};
			apiSave.session = sessionMock;

			const validation = await apiSave.validate();
			assert.strictEqual(validation, undefined);

			await apiSave.process();

			// 1: Para obtener el model principal. 2 y 3: Para los modelos de las relaciones
			sinon.assert.calledThrice(sessionMock.getSessionInstance);
			sinon.assert.calledWithExactly(sessionMock.getSessionInstance, Model);
		});
	});

	describe('Process with postStructValidate method', () => {

		it('Should execute the postStructValidate after validate data', async () => {

			class MyApiSaveWithPostStructValidate extends ApiSaveData {

				async postStructValidate() {

					const newField = 123;

					this.dataToSave.main.newField = newField;
				}
			}

			Model.prototype.insert.resolves('15');

			sinon.spy(MyApiSaveWithPostStructValidate.prototype, 'postStructValidate');

			const apiSave = new MyApiSaveWithPostStructValidate();

			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();

			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sinon.assert.calledOnce(MyApiSaveWithPostStructValidate.prototype.postStructValidate);
			sinon.assert.calledOnce(Model.prototype.insert);

			sinon.assert.calledWithExactly(Model.prototype.insert, {
				name: 'The name',
				otherField: 'foo',
				newField: 123
			});
		});

		it('Should fail if postStructValidate throws a exception', async () => {

			class MyApiSaveWithPostStructValidate extends ApiSaveData {

				async postStructValidate() {
					throw new Error('throws a nice exception');
				}
			}

			sinon.spy(MyApiSaveWithPostStructValidate.prototype, 'postStructValidate');

			const apiSave = new MyApiSaveWithPostStructValidate();

			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			await assert.rejects(() => apiSave.validate(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INVALID_REQUEST_DATA,
				previousError: new Error('throws a nice exception')
			});

			sinon.assert.calledOnce(MyApiSaveWithPostStructValidate.prototype.postStructValidate);
		});
	});

	describe('Process with shouldSave', () => {

		class MyApiSaveWithShouldSave extends ApiSaveData {

			format(data) {
				return {
					...data,
					extraField: 123
				};
			}

			async shouldSave(formattedItem) {
				const currentItem = await this.getCurrent();
				return currentItem.extraField !== formattedItem.extraField;
			}
		}

		it('should save when current has other data', async () => {

			const apiSave = new MyApiSaveWithShouldSave();

			Model.prototype.getById.returns({
				name: 'The name',
				otherField: 'foo',
				extraField: 321
			});

			Model.prototype.update.resolves(1);

			apiSave.endpoint = '/api/some-entity/9';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();

			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sinon.assert.calledOnceWithExactly(Model.prototype.update, {
				name: 'The name',
				otherField: 'foo',
				extraField: 123
			}, {
				id: '9'
			});

			sinon.assert.calledOnceWithExactly(Model.prototype.getById, '9');

			assert.deepStrictEqual(apiSave.response.body, {
				id: '9'
			});
		});

		it('should only hit one time at the model when using getCurrent several times', async () => {

			const apiSave = new MyApiSaveWithShouldSave();

			Model.prototype.getById.returns({
				name: 'The name',
				otherField: 'foo',
				extraField: 321
			});

			Model.prototype.update.resolves(1);

			apiSave.endpoint = '/api/some-entity/9';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();

			assert.strictEqual(validation, undefined);

			await apiSave.getCurrent();
			await apiSave.getCurrent();
			await apiSave.getCurrent();
			await apiSave.getCurrent();

			await apiSave.process();

			sinon.assert.calledOnceWithExactly(Model.prototype.update, {
				name: 'The name',
				otherField: 'foo',
				extraField: 123
			}, {
				id: '9'
			});

			sinon.assert.calledOnceWithExactly(Model.prototype.getById, '9');

			assert.deepStrictEqual(apiSave.response.body, { id: '9' });
		});

		it('shouldn\'t save when current has the same data', async () => {

			const apiSave = new MyApiSaveWithShouldSave();

			Model.prototype.getById.returns({
				name: 'The name',
				otherField: 'foo',
				extraField: 123
			});

			apiSave.endpoint = '/api/some-entity/9';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();

			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sinon.assert.notCalled(Model.prototype.update);

			assert.deepStrictEqual(apiSave.response.body, {
				id: '9'
			});
		});

		it('should reject when using getCurrent method on a APIPost', async () => {

			const apiSave = new MyApiSaveWithShouldSave();

			apiSave.endpoint = '/api/some-entity';
			apiSave.data = {
				name: 'The name',
				otherField: 'foo'
			};

			const validation = await apiSave.validate();

			assert.strictEqual(validation, undefined);

			await assert.rejects(() => apiSave.getCurrent(), {
				name: 'ApiSaveError',
				code: ApiSaveError.codes.INTERNAL_ERROR
			});

			sinon.assert.notCalled(Model.prototype.getById);
			sinon.assert.notCalled(Model.prototype.insert);
			sinon.assert.notCalled(Model.prototype.update);
		});

		it('shouldn\'t save if apis says so and set 204 code when is an API Post', async () => {

			class MyApiPost extends ApiSaveData {

				shouldSave() {
					return false;
				}
			}

			const apiSave = new MyApiPost();

			apiSave.endpoint = '/api/some-entity';
			apiSave.data = { name: 'The name' };

			const validation = await apiSave.validate();

			assert.strictEqual(validation, undefined);

			await apiSave.process();

			sinon.assert.notCalled(Model.prototype.insert);

			assert.deepStrictEqual(apiSave.response.body, {});
			assert.deepStrictEqual(apiSave.response.code, 204);
		});
	});
});
