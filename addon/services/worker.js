/**
 * @module buzz-core
 * @module buzz-core-services
 */

import Ember from 'ember';

const { get, assert, A, RSVP, Evented, computed, Service, on, isPresent } = Ember;

function messageListener(meta, event) {
  const ping = event.data === true;
  // Check if the worker has been instantiated via event listener:
  // worker.on('name', data, callback);
  if (get(meta, 'keepAlive')) {
    if (ping) {
      // A 'true' message tell us that the worker has been created correctly,
      // then resolve the promise returned by the event listener.
      this.trigger('resolve', meta);
    } else {
      // The worker is sending data, call the callback this the event data.
      get(meta, 'callback')(event.data);
    }
  // If the response is equals to 'true' we should ignore it because
  // the worker is pinging us to tell that everything is correct.
  } else if (!ping) {
    // Resolve the promise returned by the method 'send' with the event data.
    this.trigger('resolve', meta, event.data);
  }
}

function errorListener(meta, error) {
  // An error has ocurrect, reject the promise and kill the worker.
  this.trigger('reject', meta, error.message);
}

export default Service.extend(Evented, {

	/**
	 * Check if workers are enabled.
	 *
	 * @property isEnabled
	 * @type Boolean
	 */
	isEnabled: computed(() => Boolean(window.Worker)),

  /**
	 * Static workers file path.
	 *
	 * @property webWorkersPath
	 * @type String
	 */
	webWorkersPath: 'assets/web-workers/',

  /**
	 * Initialize metadata array.
	 *
	 * @method init
	 */
	init() {
	  this._super(...arguments);
    // Initialize metadata array, it will store all running workers with their own promises/callbacks.
    this.set('_cache', A([]));
  },

  /**
	 * Start a worker and attach the events given a name.
	 *
	 * @method _wakeup
   * @param String name
   * @param Function callback
   * @return Object
	 */
	_wakeUp(name, callback) {
    assert('You must provide the worker name', isPresent(name));

    // 'keepAlive' will store if the worker should still alive after sending a message.
    const keepAlive = typeof callback === 'function';
    const worker = new window.Worker(`${this.get('webWorkersPath')}${name}.js`);
		const deferred = RSVP.defer('Worker: sending message');
    const meta = {
      keepAlive,
      worker,
      name,
      deferred,
      callback
    };

    // Attach the worker events.
    worker.addEventListener('message', messageListener.bind(this, meta));
    worker.addEventListener('error', errorListener.bind(this, meta));

    return meta;
	},

  /**
	 * Resolve pending promise.
	 *
	 * @method _onResolve
   * @param Object data
	 */
	_onResolve: on('resolve', function(meta, data) {
    const deferred = get(meta, 'deferred');

    if (!get(meta, 'keepAlive')) {
			this._cleanMeta(meta);
    }
    deferred.resolve(data);
	}),

  /**
	 * Reject pending promise.
	 *
	 * @method _onReject
   * @param Object meta
	 */
  _onReject: on('reject', function(meta, error) {
    this._cleanMeta(meta);
    get(meta, 'deferred').reject(error);
	}),

  /**
	 * Clean request metadata & kill worker if neccessary.
	 *
	 * @method _cleanMeta
   * @param Object meta
	 */
  _cleanMeta(meta) {
    this._sleep(get(meta, 'worker'));
    this.get('_cache').removeObject(meta);
	},

  /**
	 * Kill worker.
	 *
	 * @method _sleep
   * @param Worker worker
	 */
  _sleep(worker) {
		worker.terminate();
	},

  /**
	 * Cancel pending promise.
	 *
	 * @method cancel
   * @param Ember.RSVP promise
   */
  cancel(promise) {
		const _cache = this.get('_cache');
    let index = _cache.length;

    // Reverse loop to prevent errors (this loop iterates a collection while deletes its items)
		while(index--){
      const meta = _cache[index];
			const deferred = get(meta, `deferred`);

      // If promise exists reject it, if not reject all.
      if ((deferred.promise === promise) || !promise) {
        this.trigger('reject', meta);
      }
		}
	},

	/**
	 * Send event to the worker.
	 *
	 * @method send
   * @param String name
   * @param Object data
	 * @return Mixed
	 */
	send(name, data) {
		assert('Workers are disabled', this.get('isEnabled'));

		const meta = this._wakeUp(name);

    this.get('_cache').pushObject(meta);
		get(meta, 'worker').postMessage(data);

		return get(meta, 'deferred.promise');
	},

	/**
	 * Suscribe to a worker.
	 *
	 * @method on
   * @param String name
   * @param Object data
   * @param Function callback
	 */
  on(name, data, callback) {
    assert('Cannot register an event with no callback', typeof callback === 'function');

    const meta = this._wakeUp(name, callback);

    this.get('_cache').pushObject(meta, callback);
		get(meta, 'worker').postMessage(data);

		return get(meta, 'deferred.promise');
  },

	/**
	 * Suscribe to a worker.
	 *
	 * @method off
   * @param String name
   * @param Function callback
	 */
  off(name, callback) {
    assert('Cannot unregister an event with no callback', typeof callback === 'function');

    const meta = this.get('_cache').find((meta) => ( name === meta.name && callback === meta.callback ));

    if (meta) {
      const deferred = get(meta, 'deferred');

      this._cleanMeta(meta);
      deferred.resolve();

      return deferred.promise;
    }

    return Ember.RSVP.reject('Worker: event does not exist');
  }
});
