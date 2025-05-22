/**
 * Creates an observable object or adds event emitter functionality to an existing object
 * @param {Object} [target={}] - The target object to add event emitter functionality to
 * @returns {Object} - The target object with event emitter functionality
 */
function makeObservable (target = {}) {
  const handlers = {};
  
  /**
   * Registers a callback for an event
   * @param {string} eventName - The name of the event
   * @param {Function} callback - The callback function to execute when the event is emitted
   * @returns {Object} - Returns this for chaining
   * 
   * Note: For asynchronous operations, consider using async/await in your callback:
   * eventEmitter.on('event', async (event) => {
   *   await someAsyncOperation();
   *   // Modify event.args if needed
   * });
   * 
   * Note: If you need to maintain a specific 'this' context in your callback,
   * bind the function before passing it to on():
   * const boundHandler = myHandler.bind(this);
   * eventEmitter.on('event', boundHandler);
   */
  target.on = function(eventName, callback) {
    if (!handlers[eventName]) {
      handlers[eventName] = [];
    }
    handlers[eventName].push({ fn: callback, once: false });
    return this;
  };
  
  /**
   * Registers a callback for an event that will be called only once
   * @param {string} eventName - The name of the event
   * @param {Function} callback - The callback function to execute when the event is emitted
   * @returns {Object} - Returns this for chaining
   */
  target.once = function(eventName, callback) {
    if (!handlers[eventName]) {
      handlers[eventName] = [];
    }
    handlers[eventName].push({ fn: callback, once: true });
    return this;
  };
  
  /**
   * Unregisters a callback for an event
   * @param {string} eventName - The name of the event
   * @param {Function} callback - The callback function to remove
   * @returns {Object} - Returns this for chaining
   */
  target.off = function(eventName, callback) {
    if (!handlers[eventName]) return this;
    
    if (callback) {
      // Find and remove the specific handler
      const callbacks = handlers[eventName];
      const index = callbacks.findIndex(h => h.fn === callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    } else {
      // If no callback is provided, remove all handlers for this event
      delete handlers[eventName];
    }
    return this;
  };
  
  /**
   * Removes all event listeners
   * @param {string} [eventName] - Optional event name to remove all listeners for
   * @returns {Object} - Returns this for chaining
   */
  target.removeAllListeners = function(eventName) {
    if (eventName) {
      delete handlers[eventName];
    } else {
      // Clear all handlers
      Object.keys(handlers).forEach(key => {
        delete handlers[key];
      });
    }
    return this;
  };
  
  /**
   * Emits an event with the given name and arguments
   * @param {string} eventName - The name of the event
   * @param {...any} args - Arguments to pass to the event handlers
   * @returns {Object} - The event object
   * 
   * Note: Always use await when emitting events with async handlers:
   * await eventEmitter.emit('event', data);
   */
  target.emit = async function(eventName, ...args) {
	  try {
		  // For no handlers
      if (!handlers[eventName]) {
        return { 
          name: eventName,
          preventDefault: false, 
          args: args.length === 1 ? args[0] : args.length > 1 ? args : undefined
        };
      }

      let stopPropagation = false;
      let preventDefault = false;
      
      const event = {
        name: eventName,
        args: args.length === 1 ? args[0] : args.length > 1 ? args : undefined,
        preventDefault: () => { 
          preventDefault = true;
          event.stopPropagation();
        },
        stopPropagation: () => { stopPropagation = true; }
      };
      
      // Create a copy of the handlers array to avoid issues if handlers are removed during execution
      const callbacks = [...handlers[eventName]];
      
      for (const handler of callbacks) {
        try {
          if (stopPropagation) break;
          
          await handler.fn(event);
          
          // Remove once handlers after execution
          if (handler.once) {
            const index = handlers[eventName].indexOf(handler);
            if (index !== -1) {
              handlers[eventName].splice(index, 1);
            }
          }
        } catch (e) {
          console.error(`Error in event handler ${handlers[eventName]} for ${eventName}:`, e);
          throw e
        }
      }
      
      // Clean up empty handler arrays
      if (handlers[eventName] && handlers[eventName].length === 0) {
        delete handlers[eventName];
      }
			
      //Update event for propegation/preventDefault
      delete event.stopPropagation;
      event.preventDefault = preventDefault;
      
      return event;

		} catch (error) {
			console.error(`Error in event emission for ${eventName}:`, error);
			throw error
		}
  };
  
  return target;
}

export default makeObservable;