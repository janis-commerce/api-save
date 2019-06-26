'use strict';

const assert = require('assert');
const { struct } = require('superstruct');

const { RelationshipGenerator } = require('../..');

describe('Relationship Generator', () => {

	describe('Default struct', () => {

		const DefaultStruct = RelationshipGenerator();

		it('Should throw if relationship is empty', () => {
			assert.throws(() => DefaultStruct({}));
		});

		it('Should throw if relationship has no id', () => {
			assert.throws(() => DefaultStruct({ foo: 'bar' }));
		});

		it('Should throw if relationship has an invalid id', () => {
			assert.throws(() => DefaultStruct({ id: 'invalidId' }));
			assert.throws(() => DefaultStruct('invalidId'));
		});

		it('Should pass if relationship has a valid id', () => {

			const relationship = { id: 10 };
			const validation1 = DefaultStruct(relationship);
			assert.deepStrictEqual(validation1, relationship);

			const simpleRelationship = 10;
			const validation2 = DefaultStruct(simpleRelationship);
			assert.deepStrictEqual(validation2, simpleRelationship);
		});
	});

	describe('Custom id struct', () => {

		const CustomIdStruct = RelationshipGenerator('string');

		it('Should throw if relationship is empty', () => {
			assert.throws(() => CustomIdStruct({}));
		});

		it('Should throw if relationship has no id', () => {
			assert.throws(() => CustomIdStruct({ foo: 'bar' }));
		});

		it('Should throw if relationship has an invalid id', () => {
			assert.throws(() => CustomIdStruct({ id: 10 }));
			assert.throws(() => CustomIdStruct(10));
		});

		it('Should pass if relationship has a valid id', () => {

			const relationship = { id: 'foo' };
			const validation1 = CustomIdStruct(relationship);
			assert.deepStrictEqual(validation1, relationship);

			const simpleRelationship = 'foo';
			const validation2 = CustomIdStruct(simpleRelationship);
			assert.deepStrictEqual(validation2, simpleRelationship);
		});
	});

	describe('Custom id struct and simple custom struct', () => {

		const SimpleCustomStruct = RelationshipGenerator('string', {
			name: 'string'
		});

		it('Should throw if relationship is empty', () => {
			assert.throws(() => SimpleCustomStruct({}));
		});

		it('Should throw if relationship has no id', () => {
			assert.throws(() => SimpleCustomStruct({ foo: 'bar' }));
		});

		it('Should throw if relationship has an invalid id', () => {
			assert.throws(() => SimpleCustomStruct({ id: 10 }));
			assert.throws(() => SimpleCustomStruct(10));
		});

		it('Should throw if relationship does not match custom struct', () => {
			assert.throws(() => SimpleCustomStruct({ id: 10, name: 10 }));
			assert.throws(() => SimpleCustomStruct(10));
		});

		it('Should pass if relationship has a valid id', () => {

			const relationship = { id: 'foo', name: 'bar' };
			const validation = SimpleCustomStruct(relationship);
			assert.deepStrictEqual(validation, relationship);
		});
	});

	describe('Custom id struct and complex custom struct', () => {

		const SimpleCustomStruct = RelationshipGenerator('string', {
			name: 'string',
			comments: struct.list(['string'])
		});

		it('Should throw if relationship is empty', () => {
			assert.throws(() => SimpleCustomStruct({}));
		});

		it('Should throw if relationship has no id', () => {
			assert.throws(() => SimpleCustomStruct({ foo: 'bar' }));
		});

		it('Should throw if relationship has an invalid id', () => {
			assert.throws(() => SimpleCustomStruct({ id: 10 }));
			assert.throws(() => SimpleCustomStruct(10));
		});

		it('Should throw if relationship does not match custom struct', () => {
			assert.throws(() => SimpleCustomStruct({ id: 'foo', name: 'foo', comments: 'invalid' }));
			assert.throws(() => SimpleCustomStruct('foo'));
		});

		it('Should pass if relationship has a valid id', () => {

			const relationship = {
				id: 'foo',
				name: 'foo',
				comments: [
					'i\'m a comment',
					'mee too'
				]
			};
			const validation = SimpleCustomStruct(relationship);
			assert.deepStrictEqual(validation, relationship);
		});
	});

});
