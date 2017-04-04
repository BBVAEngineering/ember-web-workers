/* eslint-disable func-style, no-magic-numbers, prefer-const */
import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
// import sinon from 'sinon';" Start interactive EasyAlign in visual mode (e.g. vip
// )
//

const { RSVP: { hash } } = Ember;
// const DELAY = 50;
let service;
const Worker = window.Worker;

moduleFor('service:worker', 'Unit | Service | worker', {
	beforeEach() {
		service = this.subject({
      webWorkersPath: '../assets/web-workers/'
    });
	},
  afterEach() {
    service.cancel();
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
  return service.send('fail').catch(() => {
    assert.ok(1);
    assert.equal(service.get('_cache.length'), 0);
  });
});

test('it resolves promise if worker exist', (assert) => {
  return service.send('no-delay').then((data) => {
    assert.equal(data.name, 'no-delay');
    assert.equal(data.bar, 'bar');
    assert.equal(service.get('_cache.length'), 0);
  });
});

test('it resolves delayed response', (assert) => {
  return service.send('delayed').then((data) => {
    assert.equal(data.name, 'delayed');
    assert.equal(data.bar, 'bar');
    assert.equal(service.get('_cache.length'), 0);
  });
});

test('it rejects promise if worker throws an error', (assert) => {
  return service.send('error').catch((error) => {
    assert.equal(error, 'Uncaught Error: foo');
    assert.equal(service.get('_cache.length'), 0);
  });
});

test('it resolves simultaneous requests', (assert) => {
  assert.expect(6);

  const delayedPromise = service.send('delayed');
  const promise = service.send('no-delay').then((data) => {
    // Check pending delayed promise
    assert.equal(service.get('_cache.length'), 1);

    return data;
  });

  return hash({ promise, delayedPromise }).then(({ promise, delayedPromise }) => {
    assert.equal(promise.name, 'no-delay');
    assert.equal(promise.bar, 'bar');
    assert.equal(delayedPromise.name, 'delayed');
    assert.equal(delayedPromise.bar, 'bar');
    assert.equal(service.get('_cache.length'), 0);
  });
});

test('it can cancel a pending promise', (assert) => {
  const done = assert.async();
  const promise = service.send('delayed');

  promise.then(() => {
    assert.ok(0);
  }, () => {
    assert.equal(service.get('_cache.length'), 0);
  }).finally(done);

  service.cancel(promise);
});

test('it can cancel all promises', (assert) => {
  service.send('no-response');
  service.send('no-response');
  service.send('no-response');

  assert.equal(service.get('_cache.length'), 3);

  service.cancel();

  assert.equal(service.get('_cache.length'), 0);
});

test('it resolves promise when event starts', (assert) => {
  return service.on('subscription', {}, () => {}).then(() => {
    assert.equal(service.get('_cache.length'), 1);
  });
});

test('it subscribes to a worker', (assert) => {
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

  service.on('subscription', {}, callback).then(() => {
    assert.equal(service.get('_cache.length'), 1);
  });
});

test('it resolves promise when event stops', (assert) => {
  const callback = () => {};

  return service.on('subscription', {}, callback).then(() => {
    assert.equal(service.get('_cache.length'), 1);

    return service.off('subscription', callback).then(() => {
      assert.equal(service.get('_cache.length'), 0);
    });
  });
});

test('it unsubscribes to a worker', (assert) => {
  assert.expect(2);

  const callback = () => {};

  service.on('subscription', {}, callback);

  assert.equal(service.get('_cache.length'), 1);

  const promise = service.off('subscription', callback);

  return promise.then(() => {
    assert.equal(service.get('_cache.length'), 0);
  });
});
