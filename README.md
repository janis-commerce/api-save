# API Save

![Build Status](https://github.com/janis-commerce/api-save/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/api-save/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/api-save?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fapi-save.svg)](https://www.npmjs.com/package/@janiscommerce/api-save)

A package to handle Janis Save APIs

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
const someAsyncTask = require('./async-task');

class MyApiSaveData extends ApiSaveData {

	static get relationshipsParameters() {
		return {
			children: {
				modelClass: MyRelatedModel,
				mainIdentifierField: 'dbFieldForMainEntity',
				secondaryIdentifierField: 'dbFieldForRelatedEntity',
				shouldClean: false
			}
		};
	}

	static get idStruct() {
		return struct.optional('string|number');
	}

	static get mainStruct() {
		return struct.partial({
			name: 'string',
			description: 'string?',
			status: 'number'
		});
	}

	static get relationshipsStruct() {
		return struct.partial({
			children: ['string']
		});
	}

	postStructValidate() {
		return someAsyncTask(this.dataToSave.main);
	}

	format({ someField, ...restoOfTheRecord }) {
		return {
			...restoOfTheRecord,
			someField: `prefix-${someField}`
		};
	}

	postSaveHook(id, savedData) {
		return someAsyncTask(id, savedData);
	}

}

module.exports = MyApiSaveData;
```

## API

The following getters and methods can be used to customize and validate your Save API.
All of them are optional, however you're encouraged to implement `static get mainStruct()` so you don't save trash data in your DB.

### static get relationshipsParameters()
You need to use this in case you're saving relationships with other models (mostly for relational databases)
If you don't have any relationship, there's no need to implement it.

This getter must return an object mapping the name of the field that contains the relationship (must be a key in the struct's `relationships` property) to the parameters of that relationship.
The parameters contain the following properties:
- modelClass: The class of the model that should save this relationship
- mainIdentifierField: The field name where the main ID should be saved
- secondaryIdentifierField: The field name where the related ID should be saved
- shouldClean: Indicates if previuos relationships should be removed. Optional, defaults to `false`

### static get idStruct()
This is used to validate the ID received as path parameter.
Defaults to an optional string or number.

### static get mainStruct()
This is used to validate the data received in the request, checking the data to be saved in the main entity.
Defaults to an object with any property.

### static get relationshipsStruct()
This is used to validate the data received in the request, checking the data to be passed to the relationships.
Defaults to an object partial with no properties.

### postStructValidate()
This is used to validate the data received in the request, making additional validation even injecting data to the received data.
If it returns a Promise, it will be awaited.

### format(record)
You can use this to format your main record before it's saved. For example, mapping user friendly values to DB friendly values, add default values, etc.
If it returns a Promise, it will be awaited.

### postSaveHook(id, record)
You can use this to perform a task after saving your main record. For example, emitting an event, logging something, etc.
If it returns a Promise, it will be awaited.
