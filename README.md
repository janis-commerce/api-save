# API Save

[![Build Status](https://travis-ci.org/janis-commerce/api-save.svg?branch=master)](https://travis-ci.org/janis-commerce/api-save)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/api-save/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/api-save?branch=master)

A package to handle JANIS Views Save APIs

## Installation
```sh
npm install @janiscommerce/api-save
```

## Usage
```js
'use strict';

const { ApiSaveData } = require('@janiscommerce/api-save');
const { struct } = require('superstruct');

const MyRelatedModel = require('../../models/my-related-model');

class MyApiSaveData extends ApiSaveData {

	static get relationshipsParameters() {
		return {
			children: {
				ModelClass: MyRelatedModel,
				mainIdentifierField: 'dbFieldForMainEntity',
				secondaryIdentifierField: 'dbFieldForRelatedEntity',
				shouldClean: false
			}
		};
	}

	getStruct() {

		const baseStruct = super.getStruct();

		return {
			...baseStruct,
			main: struct.partial({
				name: 'string',
				description: 'string?',
				status: 'number'
			})
		};
	}

	format({ someField, ...restoOfTheRecord }) {
		return {
			...restoOfTheRecord,
			someField: `prefix-${someField}`
		};
	}

}

module.exports = MyApiSaveData;
```

## API

The following getters and methods can be used to customize and validate your Save API.
All of them are optional, however you're encouraged to implement `getStruct()` so you don't save trash data in your DB.

### static get relationshipsParameters()
You need to use this in case you're saving relationships with other models (mostly for relational databases)
If you don't have any relationship, there's no need to implement it.

This getter must return an object mapping the name of the field that contains the relationship (must be a key in the struct's `relationships` property) to the parameters of that relationship.
The parameters contain the following properties:
- ModelClass: The class of the model that should save this relationship
- mainIdentifierField: The field name where the main ID should be saved
- secondaryIdentifierField: The field name where the related ID should be saved
- shouldClean: Indicates if previuos relationships should be removed. Optional, defaults to `false`

### getStruct()
This is used to validate the data received in the request. It **must** validate three properties:
- `id`: The ID of the record to save. This should be validated as optional to allow new records to be created.
- `main`: The data to save in the main entity.
- `relationships`: The data to pass to the relationships.

Default struct validates numeric or string optional ID, and any data received in the request is saved to the main entity. No relationships are saved.

### format(record)
You can use this to format your main record before it's saved. For example, mapping user friendly values to DB friendly values, add default values, etc.
