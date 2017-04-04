# ember-web-workers [![Build Status](https://circleci.com/gh/BBVAEngineering/ember-web-workers.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/BBVAEngineering/ember-web-workers) [![GitHub version](https://badge.fury.io/gh/BBVAEngineering%2Fember-web-workers.svg)](https://badge.fury.io/gh/BBVAEngineering%2Fember-web-workers) [![Dependency Status](https://david-dm.org/BBVAEngineering/ember-web-workers.svg)](https://david-dm.org/BBVAEngineering/ember-wait-for-render)

Service to communicate your application with browser web workers.

This addon can be installed with `ember-cli`:

* `ember install ember-web-workers`

![ember-web-workers](http://i.imgur.com/VVOmiQE.gif)

## Usage

* Create the web worker file in `public` (follow this blueprint):

```javascript
// public/assets/web-workers/test.js

// Wait for the initial message event.
self.addEventListener('message', function(e) {
  var data = e.data;

  // Ping the Ember service to say that everything is ok.
  postMessage(true);

  // Do your stuff here.
  setTimeout(function() {
    	postMessage({ foo: 'foo', bar: 'bar' });
  }, 100);
}, false);
```

* Import the service in your application:

```javascript
// Some Ember context.
{
  worker: Ember.inject.service()
}
```

* Use the methods to communicate with the web worker:

#### `send`

Method used to make a request and wait for some response. This method
returns a promise that will be resolved after the worker responses.

When promise resolves the worker will be terminated.

**Arguments**:
    * `worker`: the name of the worker to create (used to create the file path `dist/assets/web-workers/${name}.js`).
    * `data`: transferable object (`true` will be ignored, def. for ping).

```javascript
// Some Ember context.
{
  foo() {
    return this.get('worker').send('test', { foo: 'bar' }).then((response) => {
        // response => { foo: 'foo', bar: 'bar' }
      }, (error) => {
        // error contains the message thrown by the worker.
      });
  }
}
```

#### `cancel`

With this method a pending promise can be cancelled, this will kill the worker and the promise will be rejected.
When promise resolves the worker will be terminated.

If promise is not provided, it will kill all the workers.

**Arguments**:
    * `promise`: the promise returned by the `send` function (optional).

```javascript
// Some Ember context.
{
  foo() {
    const worker = this.get('worker');
    const promise = worker.send('test', { foo: 'bar' });
    
    worker.cancel(promise);
  }
}
```

#### `on`/`off`

Methods used to subscribe to a worker.
The worker will be alive until the event is detached.

**Arguments**:
    * `worker`: the name of the worker to create (used to create the file path `dist/assets/web-workers/${name}.js`).
    * `data`: transferable object (`true` will be ignored, def. for ping).
    * `callback`: callback to be executed each time worker sends a message (`postMessage`).

```javascript
// Some Ember context.

function callback(data) {
  console.log(data.foo, data.bar); // 'foo bar'
}

{
  foo() {
    const worker = this.get('worker');

    return worker.send('test', {}, callback).then(() => {
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

## Installation

* `git clone https://github.com/BBVAEngineering/ember-web-workers.git`
* `cd ember-web-workers`
* `npm install`
* `bower install`

## Running

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

## Running Tests

Use Chrome for testing (not sure if PhantomJS has web workers).

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).
