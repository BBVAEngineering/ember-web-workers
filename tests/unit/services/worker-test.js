/* eslint-disable func-style, no-magic-numbers, prefer-const */
import RSVP from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

const { hash } = RSVP;
const Worker = window.Worker;
const testData = { foo: 'foo' };
let service;

module('Unit | Service | worker', (hooks) => {
	setupTest(hooks);

	hooks.beforeEach(function() {
		service = this.owner.factoryFor('service:worker').create({
			webWorkersPath: '../assets/web-workers/'
		});

		// On chrome 72, web workers propagates errors to next layer: window.
		// https://www.chromestatus.com/feature/6220798104698880
		window.onerror = () => {};
	});

	hooks.afterEach(() => {
		service.terminate();
	});

	test('it exists', (assert) => {
		assert.ok(service, 'service exists');
	});

	test('its enabled if worker exists', (assert) => {
		assert.equal(service.get('isEnabled'), Boolean(Worker));
		assert.equal(service.get('_cache.length'), 0);
	});

	test('it rejects promise if worker does not exist', async(assert) => {
		try {
			await service.postMessage('fail');
		} catch (e) {
			assert.equal(service.get('_cache.length'), 0);
		}
	});

	test('it resolves promise if worker exist', async(assert) => {
		const data = await service.postMessage('response', testData);

		assert.deepEqual(data, testData);
		assert.equal(service.get('_cache.length'), 0);
	});

	test('it resolves delayed response', async(assert) => {
		const data = await service.postMessage('delayed-response', testData);

		assert.deepEqual(data, testData);
		assert.equal(service.get('_cache.length'), 0);
	});

	test('it rejects promise if worker throws an error', async(assert) => {
		try {
			await service.postMessage('error');
		} catch (e) {
			assert.equal(e, 'Uncaught Error: foo');
			assert.equal(service.get('_cache.length'), 0);
		}
	});

	test('it resolves simultaneous requests', async(assert) => {
		assert.expect(4);

		const delayedPromise = service.postMessage('delayed-response', testData);
		const promise = service.postMessage('response', testData).then((data) => {
			// Check pending delayed promise
			assert.equal(service.get('_cache.length'), 1);

			return data;
		});

		const data = await hash({ promise, delayedPromise });

		assert.deepEqual(data.promise, testData);
		assert.deepEqual(data.delayedPromise, testData);
		assert.equal(service.get('_cache.length'), 0);
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

	test('it resolves promise when event starts', async(assert) => {
		await service.on('subscription', () => { });

		assert.equal(service.get('_cache.length'), 1);
	});

	test('it subscribes to a worker', async(assert) => {
		const callback = () => { };

		await service.on('subscription', callback);

		assert.equal(service.get('_cache.length'), 1);

		service.off('subscription', callback);
	});

	test('it executes callback when receives data', async(assert) => {
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

		await service.on('subscription', callback);

		assert.equal(service.get('_cache.length'), 1);
	});

	test('it resolves promise when event stops', async(assert) => {
		assert.expect(2);

		const callback = () => { };

		await service.on('subscription', callback);

		assert.equal(service.get('_cache.length'), 1);

		await service.off('subscription', callback);

		assert.equal(service.get('_cache.length'), 0);
	});

	test('it unsubscribes from a worker (passing a callback)', async(assert) => {
		const callback = () => { };
		const callback2 = () => { };

		const subscriptionPromise = service.on('subscription', callback);
		const subscriptionPromise2 = service.on('subscription', callback2);

		assert.equal(service.get('_cache.length'), 2);

		await Promise.all([subscriptionPromise, subscriptionPromise2]);

		await service.off('subscription', callback);

		assert.equal(service.get('_cache.length'), 1, 'Only the worker associated with the callback has been terminated');
	});

	test('it unsubscribes from a worker (without passing a callback)', async(assert) => {
		const callback = () => { };
		const callback2 = () => { };

		const subscriptionPromise = service.on('subscription', callback);
		const subscriptionPromise2 = service.on('subscription', callback2);

		assert.equal(service.get('_cache.length'), 2);

		await Promise.all([subscriptionPromise, subscriptionPromise2]);

		await service.off('subscription');

		assert.equal(service.get('_cache.length'), 0, 'All the worker of the given name has been terminated');
	});

	test('it can start a worker', async(assert) => {
		const worker = await service.open('increment');

		assert.equal(service.get('_cache.length'), 1);
		assert.equal(typeof worker, 'object');
		assert.equal(typeof worker.postMessage, 'function');
		assert.equal(typeof worker.terminate, 'function');

		worker.terminate();
	});

	test('it can send/receive messages from an active connection', async(assert) => {
		const worker = await service.open('increment');

		assert.equal(service.get('_cache.length'), 1);

		const data = await worker.postMessage({ index: 0 });

		assert.equal(data.index, 1);

		const result = await worker.postMessage({ index: 1 });

		assert.equal(result.index, 2);

		worker.terminate();
	});
});
