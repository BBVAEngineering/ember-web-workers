/* eslint-disable func-style, no-magic-numbers, prefer-const */
import RSVP from 'rsvp';
import { moduleFor, test } from 'ember-qunit';


const { hash } = RSVP;
// const DELAY = 50;
let service;
const Worker = window.Worker;
const testData = { foo: 'foo' };

moduleFor('service:worker', 'Unit | Service | worker', {
	beforeEach() {
		service = this.subject({
			webWorkersPath: '../assets/web-workers/'
		});
	},
	afterEach() {
		service.terminate();
	}
});

test('it exists', (assert) => {
	assert.ok(service, 'service exists');
});

test('its enabled if worker exists', (assert) => {
	assert.equal(service.get('isEnabled'), Boolean(Worker));
	assert.equal(service.get('_cache.length'), 0);
});

test('it rejects promise if worker does not exist', (assert) => {
	return service.postMessage('fail').catch(() => {
		assert.ok(1);
		assert.equal(service.get('_cache.length'), 0);
	});
});

test('it resolves promise if worker exist', (assert) => {
	return service.postMessage('response', testData).then((data) => {
		assert.deepEqual(data, testData);
		assert.equal(service.get('_cache.length'), 0);
	});
});

test('it resolves delayed response', (assert) => {
	return service.postMessage('delayed-response', testData).then((data) => {
		assert.deepEqual(data, testData);
		assert.equal(service.get('_cache.length'), 0);
	});
});

test('it rejects promise if worker throws an error', (assert) => {
	return service.postMessage('error').catch((error) => {
		assert.equal(error, 'Uncaught Error: foo');
		assert.equal(service.get('_cache.length'), 0);
	});
});

test('it resolves simultaneous requests', (assert) => {
	assert.expect(4);

	const delayedPromise = service.postMessage('delayed-response', testData);
	const promise = service.postMessage('response', testData).then((data) => {
		// Check pending delayed promise
		assert.equal(service.get('_cache.length'), 1);

		return data;
	});

	return hash({ promise, delayedPromise }).then((data) => {
		assert.deepEqual(data.promise, testData);
		assert.deepEqual(data.delayedPromise, testData);
		assert.equal(service.get('_cache.length'), 0);
	});
});

test('it can terminate a pending promise', (assert) => {
	const done = assert.async();
	const promise = service.postMessage('delayed-response');

	promise.then(() => {
		assert.ok(0);
	}, () => {
		assert.equal(service.get('_cache.length'), 0);
	}).finally(done);

	service.terminate(promise);
});

test('it can terminate all promises', (assert) => {
	service.postMessage('no-response');
	service.postMessage('no-response');
	service.postMessage('no-response');

	assert.equal(service.get('_cache.length'), 3);

	service.terminate();

	assert.equal(service.get('_cache.length'), 0);
});

test('it resolves promise when event starts', (assert) => {
	return service.on('subscription', () => { }).then(() => {
		assert.equal(service.get('_cache.length'), 1);
	});
});

test('it subscribes to a worker', (assert) => {
	const callback = () => { };

	return service.on('subscription', callback).then(() => {
		assert.equal(service.get('_cache.length'), 1);
		service.off('subscription', callback);
	});
});

test('it executes callback when receives data', (assert) => {
	assert.expect(4);

	let count = 0;
	const done = assert.async();
	const callback = (data) => {
		if (count >= 3) {
			service.off('subscription', callback);
			done();
		} else {
			assert.equal(data.index, count);
			count++;
		}
	};

	service.on('subscription', callback).then(() => {
		assert.equal(service.get('_cache.length'), 1);
	});
});

test('it resolves promise when event stops', (assert) => {
	assert.expect(2);

	const callback = () => { };

	return service.on('subscription', callback).then(() => {
		assert.equal(service.get('_cache.length'), 1);

		return service.off('subscription', callback).then(() => {
			assert.equal(service.get('_cache.length'), 0);
		});
	});
});

test('it unsubscribes from a worker (passing a callback)', (assert) => {
	assert.expect(2);

	const callback = () => { };
	const callback2 = () => { };

	const subscriptionPromise = service.on('subscription', callback);
	const subscriptionPromise2 = service.on('subscription', callback2);

	assert.equal(service.get('_cache.length'), 2);

	return Promise.all([subscriptionPromise, subscriptionPromise2]).then(() => {
		service.off('subscription', callback).then(() => {
			assert.equal(service.get('_cache.length'), 1, 'Only the worker associated with the callback has been terminated');
		});
	});
});

test('it unsubscribes from a worker (without passing a callback)', (assert) => {
	assert.expect(2);

	const callback = () => { };
	const callback2 = () => { };

	const subscriptionPromise = service.on('subscription', callback);
	const subscriptionPromise2 = service.on('subscription', callback2);

	assert.equal(service.get('_cache.length'), 2);

	return Promise.all([subscriptionPromise, subscriptionPromise2]).then(() => {
		service.off('subscription').then(() => {
			assert.equal(service.get('_cache.length'), 0, 'All the worker of the given name has been terminated');
		});
	});
});

test('it can start a worker', (assert) => {
	return service.open('increment').then((worker) => {
		assert.equal(service.get('_cache.length'), 1);
		assert.equal(typeof worker, 'object');
		assert.equal(typeof worker.postMessage, 'function');
		assert.equal(typeof worker.terminate, 'function');
		worker.terminate();
	});
});

test('it can send/receive messages from an active connection', (assert) => {
	return service.open('increment').then((worker) => {
		assert.equal(service.get('_cache.length'), 1);

		return worker.postMessage({ index: 0 }).then((data) => {
			assert.equal(data.index, 1);

			return worker.postMessage({ index: 1 }).then((result) => {
				assert.equal(result.index, 2);

				worker.terminate();
			});
		});
	});
});
