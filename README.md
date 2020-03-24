# ember-web-workers

[![Build Status](https://travis-ci.org/BBVAEngineering/ember-web-workers.svg?branch=master)](https://travis-ci.org/BBVAEngineering/ember-web-workers)
[![GitHub version](https://badge.fury.io/gh/BBVAEngineering%2Fember-web-workers.svg)](https://badge.fury.io/gh/BBVAEngineering%2Fember-web-workers)
[![NPM version](https://badge.fury.io/js/ember-web-workers.svg)](https://badge.fury.io/js/ember-web-workers)
[![Dependency Status](https://david-dm.org/BBVAEngineering/ember-web-workers.svg)](https://david-dm.org/BBVAEngineering/ember-web-workers)
[![codecov](https://codecov.io/gh/BBVAEngineering/ember-web-workers/branch/master/graph/badge.svg)](https://codecov.io/gh/BBVAEngineering/ember-web-workers)
[![Greenkeeper badge](https://badges.greenkeeper.io/BBVAEngineering/ember-web-workers.svg)](https://greenkeeper.io/)
[![Ember Observer Score](https://emberobserver.com/badges/ember-web-workers.svg)](https://emberobserver.com/addons/ember-web-workers)

## Information

[![NPM](https://nodei.co/npm/ember-web-workers.png?downloads=true&downloadRank=true)](https://nodei.co/npm/ember-web-workers/)

Service to communicate your application with browser web workers.

* Ember.js v3.12 or above
* Ember CLI v2.13 or above
* Node.js v10 or above

This addon can be installed with `ember-cli`:

* `ember install ember-web-workers`

![ember-web-workers](http://i.imgur.com/93lfb8t.gif)

## Usage

* Create the web worker file in `public` (follow this blueprint):

```javascript
// public/assets/web-workers/test.js

// Wait for the initial message event.
self.addEventListener('message', function(e) {
  var data = e.data;
  var port = e.ports[0];

  // Do your stuff here.
  if (port) {
    // Message sended throught a worker created with 'open' method.
    port.postMessage({ foo: 'foo' });
  } else {
    // Message sended throught a worker created with 'send' or 'on' method.
    postMessage({ bar: 'bar' });
  }
}, false);

// Ping the Ember service to say that everything is ok.
postMessage(true);
```

* Import the service in your application:

```javascript
// Some Ember context.
{
  worker: Ember.inject.service()
}
```

* Use the methods to communicate with the web worker:

#### `postMessage`

Method used to make a request and wait for a response. This method
returns a promise that will be resolved after the worker responses.

When promise resolves the worker will be terminated.

**Arguments**:

  * `worker`: the name of the worker to create (used to create the file path `dist/assets/web-workers/${name}.js`).
  * `data`: transferable object (`true` will be ignored, def. for ping).

```javascript
// Some Ember context.
{
  foo() {
    return this.get('worker').postMessage('test', { foo: 'bar' }).then((response) => {
        // response => { bar: 'bar' }
      }, (error) => {
        // error contains the message thrown by the worker.
      });
  }
}
```

#### `terminate`

Using this method a pending promise can be cancelled, this will terminate the worker
associated and the promise will be rejected.

If promise is not provided, it will kill all the active workers.

**Arguments**:

  * `promise`: the promise returned by the `send` function (optional).

```javascript
// Some Ember context.
{
  foo() {
    const worker = this.get('worker');
    const promise = worker.postMessage('test', { foo: 'bar' });

    worker.terminate(promise);
  }
}
```

#### `on`/`off`

Methods used to subscribe to a worker events.
The worker will be alive until the event is detached.

**Arguments**:

  * `worker`: the name of the worker to create (used to create the file path `dist/assets/web-workers/${name}.js`).
  * `callback`: callback to be executed each time worker sends a message (`postMessage`). `callback` is optional for `off` method.
  	- If `callback` is not	passed for `off` method, then all the instantiated worker with the passed name will be terminated
  	- If `callback` is passed, then the corresponding worker associated with the callback will only be terminated.

```javascript
// Some Ember context.

function callback(data) {
  console.log(data.foo, data.bar); // 'foo bar'
}

{
  foo() {
    const worker = this.get('worker');

    return worker.on('test', callback).then(() => {
        // Worker has been created.
        // Terminate it after 5 seconds.
        setTimeout(() => {
          worker.off('test', callback);
        }, 5000);
      }, (error) => {
        // Worker error, it has been terminated.
      });
  }
}
```

#### `open`

This method creates a new worker and stablish a communication allowing to keep it alive
to send `1..n` messages until terminates.

**Arguments**:

  * `worker`: the name of the worker to create (used to create the file path `dist/assets/web-workers/${name}.js`).

**Promise argument** (object):

  * `postMessage`: Alias to send a message to the worker.
  * `terminate`: Close the connection and terminate the worker

```javascript
// Some Ember context.

{
  foo() {
    const worker = this.get('worker');

    return worker.open('test').then((stream) => {
        const data1 = stream.send({ foo: 'foo' });
        const data2 = stream.send({ bar: 'bar' });

        // Wait responses.
        return Ember.RSVP.all([data1, data2]).then(() => {
          // Kill the worker.
          stream.terminate();

          // Do something with the worker responses.
          return data1.foo + data2.bar;
        });
      }, (error) => {
        // Worker error, it has been terminated.
      });
  }
}
```

#### Handling errors

To reject the promise an error must be thrown inside the worker:

```javascript
// Worker context.

throw new Error('foo');

```

```javascript

// Some Ember context.

{
  foo() {
    return this.get('worker').postMessage('test').catch((error) => {
        console.error(error); // Unhandled error: foo
      });
  }
}
```

## Contribute

If you want to contribute to this addon, please read the [CONTRIBUTING.md](CONTRIBUTING.md).

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/BBVAEngineering/ember-wait-for-render/tags).


## Authors

See the list of [contributors](https://github.com/BBVAEngineering/ember-wait-for-render/graphs/contributors) who participated in this project.

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
