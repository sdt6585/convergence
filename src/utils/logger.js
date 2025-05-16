import debug from 'debug';

class Logger {
  constructor() {
    this.loggers = {
      app: debug('convergence:app'),
      store: debug('convergence:store'),
      error: debug('convergence:error')
    };

    // Set initial log level from environment
    const logLevel = import.meta.env.PUBLIC_LOG_LEVEL || 'debug';
    this.setLogLevel(logLevel);
  }

  setLogLevel(level) {
    if (level === 'debug') {
      debug.enable('convergence:*');
    } else if (level === 'info') {
      debug.enable('convergence:*,-convergence:*:debug');
    } else if (level === 'warn') {
      debug.enable('convergence:*,-convergence:*:debug,-convergence:*:info');
    } else if (level === 'error') {
      debug.enable('convergence:*,-convergence:*:debug,-convergence:*:info,-convergence:*:warn');
    } else {
      debug.disable();
    }
  }

  // Helper methods for different log levels
  debug(namespace, ...args) {
    this.loggers[namespace]?.(...args);
  }

  error(namespace, ...args) {
    this.loggers.error(...args);
  }
}

// Create singleton instance
const logger = new Logger();
export default logger;