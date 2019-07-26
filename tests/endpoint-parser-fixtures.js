'use strict';

const fixture = [];

fixture.push({
	description: 'It should throw if endpoint is empty',
	endpoint: '',
	error: true
});

fixture.push({
	description: 'It should throw if endpoint only has the rest api prefix',
	endpoint: '/api',
	error: true
});

fixture.push({
	description: 'It pass for a simple create endpoint',
	endpoint: '/some-entity',
	result: {
		modelName: 'some-entity',
		recordId: undefined,
		parents: {}
	}
});

fixture.push({
	description: 'It pass for a simple update endpoint',
	endpoint: '/some-entity/1',
	result: {
		modelName: 'some-entity',
		recordId: '1',
		parents: {}
	}
});

fixture.push({
	description: 'It pass for a simple create endpoint with the api prefix',
	endpoint: '/api/some-entity',
	result: {
		modelName: 'some-entity',
		recordId: undefined,
		parents: {}
	}
});

fixture.push({
	description: 'It pass for a simple update endpoint with the api prefix',
	endpoint: '/api/some-entity/1',
	result: {
		modelName: 'some-entity',
		recordId: '1',
		parents: {}
	}
});

fixture.push({
	description: 'It pass for a create endpoint with one parent',
	endpoint: '/some-parent/1/other-entity',
	result: {
		modelName: 'other-entity',
		recordId: undefined,
		parents: {
			someParent: '1'
		}
	}
});

fixture.push({
	description: 'It pass for a update endpoint with one parent',
	endpoint: '/some-parent/1/other-entity/2',
	result: {
		modelName: 'other-entity',
		recordId: '2',
		parents: {
			someParent: '1'
		}
	}
});

fixture.push({
	description: 'It pass for a create endpoint with one parent',
	endpoint: '/api/some-parent/1/other-entity',
	result: {
		modelName: 'other-entity',
		recordId: undefined,
		parents: {
			someParent: '1'
		}
	}
});

fixture.push({
	description: 'It pass for a update endpoint with one parent with the api prefix',
	endpoint: '/api/some-parent/1/other-entity/2',
	result: {
		modelName: 'other-entity',
		recordId: '2',
		parents: {
			someParent: '1'
		}
	}
});

fixture.push({
	description: 'It pass for a create endpoint with two parents',
	endpoint: '/some-parent/1/other-parent/5/other-entity',
	result: {
		modelName: 'other-entity',
		recordId: undefined,
		parents: {
			someParent: '1',
			otherParent: '5'
		}
	}
});

fixture.push({
	description: 'It pass for a update endpoint with two parents',
	endpoint: '/some-parent/1/other-parent/5/other-entity/10',
	result: {
		modelName: 'other-entity',
		recordId: '10',
		parents: {
			someParent: '1',
			otherParent: '5'
		}
	}
});

fixture.push({
	description: 'It pass for non numeric IDs',
	endpoint: '/some-parent/some-non-numeric-id/other-entity/yet-another-id',
	result: {
		modelName: 'other-entity',
		recordId: 'yet-another-id',
		parents: {
			someParent: 'some-non-numeric-id'
		}
	}
});

module.exports = fixture;
