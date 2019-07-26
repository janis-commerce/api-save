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
		return struct({
			id: 'number',
			data: struct.partial({
				name: 'string',
				description: 'string?',
				status: 'number'
			}),
			relationships: struct.partial({
				children: ['number']
			})
		});
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
