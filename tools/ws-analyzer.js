import { io } from 'socket.io-client';
import PacketLogger from './packet-logger.js';
import chalk from 'chalk';
import axios from 'axios';

class WebSocketAnalyzer {
  constructor(options = {}) {
    this.configUrl = options.configUrl || 'https://hello.rp1.com/hello.msf';
    this.wsUrl = options.wsUrl;
    this.logger = options.logger || new PacketLogger({
      sessionId: `ws-${Date.now()}`,
      enableHAR: options.enableHAR || false
    });

    this.socket = null;
    this.config = null;
    this.connectionState = 'disconnected';
    this.eventCounts = {};
    this.eventHandlers = new Map();

    this.onStateChange = options.onStateChange || (() => {});
  }

  async fetchConfig() {
    console.log(chalk.cyan(`Fetching configuration from ${this.configUrl}...`));

    try {
      const response = await axios.get(this.configUrl);
      this.config = response.data;

      this.logger.logConnection('config-loaded', {
        config: this.config
      });

      console.log(chalk.green('Configuration loaded:'));
      console.log(JSON.stringify(this.config, null, 2));

      return this.config;
    } catch (error) {
      this.logger.logError('config-fetch-failed', error);
      console.error(chalk.red('Failed to fetch configuration:'), error.message);
      throw error;
    }
  }

  getWebSocketUrl() {
    if (this.wsUrl) {
      return this.wsUrl;
    }

    if (!this.config) {
      throw new Error('Configuration not loaded. Call fetchConfig() first.');
    }

    const connectStr = this.config.map?.connect || 'server=hello.rp1.com:443';

    // Parse "secure=true;server=hello.rp1.com:443;session=RP1"
    const params = {};
    connectStr.split(';').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        params[key.trim()] = value.trim();
      }
    });

    // Extract server without port for wss://
    const serverWithPort = params.server || 'hello.rp1.com:443';
    const [host, port] = serverWithPort.split(':');

    return `wss://${host}:${port || 443}`;
  }

  connect() {
    const url = this.getWebSocketUrl();

    console.log(chalk.cyan(`\nConnecting to ${url}...`));

    this.socket = io(url, {
      autoConnect: false,
      reconnection: false,
      transports: ['websocket'],
      query: {
        EIO: '4',
        transport: 'websocket'
      }
    });

    this.setupEventHandlers();

    this.socket.connect();

    this.setState('connecting');

    return this.socket;
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      this.logger.logConnection('connected', {
        socketId: this.socket.id,
        transport: this.socket.io.engine.transport.name
      });

      console.log(chalk.green.bold(`\n✓ Connected!`));
      console.log(chalk.gray(`  Socket ID: ${this.socket.id}`));
      console.log(chalk.gray(`  Transport: ${this.socket.io.engine.transport.name}\n`));

      this.setState('connected');

      // Setup engine event handlers after connection
      if (this.socket.io && this.socket.io.engine) {
        this.socket.io.engine.on('packet', ({ type, data }) => {
          if (['ping', 'pong'].includes(type)) {
            this.logger.logReceive(`engine:${type}`, { enginePacketType: type });
          }
        });

        this.socket.io.engine.on('packetCreate', ({ type, data }) => {
          if (['ping', 'pong'].includes(type)) {
            this.logger.logSend(`engine:${type}`, { enginePacketType: type });
          }
        });
      }
    });

    this.socket.on('connect_error', (error) => {
      this.logger.logError('connect_error', error);

      console.log(chalk.red.bold(`\n✗ Connection Error`));
      console.log(chalk.red(`  ${error.message}\n`));

      this.setState('error');
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.logConnection('disconnected', { reason });

      console.log(chalk.yellow.bold(`\n⚠ Disconnected`));
      console.log(chalk.yellow(`  Reason: ${reason}\n`));

      this.setState('disconnected');
    });

    this.socket.on('error', (error) => {
      this.logger.logError('socket-error', error);
      console.log(chalk.red(`Socket Error: ${error.message}`));
    });

    this.socket.onAny((event, ...args) => {
      this.eventCounts[event] = (this.eventCounts[event] || 0) + 1;

      let data = null;
      let binary = null;

      if (args.length > 0) {
        if (args[0] instanceof ArrayBuffer || Buffer.isBuffer(args[0])) {
          binary = args[0];
        } else {
          data = args[0];
        }
      }

      this.logger.logReceive(event, data, binary);

      const handlers = this.eventHandlers.get(event) || [];
      handlers.forEach(handler => {
        try {
          handler(data || binary, event);
        } catch (e) {
          console.error(chalk.red(`Error in handler for ${event}:`), e);
        }
      });
    });

    // Engine events only available after connection
    this.socket.on('connect', () => {
      if (this.socket.io && this.socket.io.engine) {
        this.socket.io.engine.on('packet', ({ type, data }) => {
          if (['ping', 'pong'].includes(type)) {
            this.logger.logReceive(`engine:${type}`, { enginePacketType: type });
          }
        });

        this.socket.io.engine.on('packetCreate', ({ type, data }) => {
          if (['ping', 'pong'].includes(type)) {
            this.logger.logSend(`engine:${type}`, { enginePacketType: type });
          }
        });
      }
    });
  }

  setState(newState) {
    const oldState = this.connectionState;
    this.connectionState = newState;

    this.logger.logConnection('state-change', {
      from: oldState,
      to: newState
    });

    this.onStateChange(newState, oldState);
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);

    return this;
  }

  emit(event, data, callback) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    const args = [event];

    if (data !== undefined) {
      args.push(data);
    }

    if (callback) {
      const wrappedCallback = (...cbArgs) => {
        this.logger.logReceive(`${event}:response`, cbArgs[0]);
        callback(...cbArgs);
      };
      args.push(wrappedCallback);
    }

    this.logger.logSend(event, data);

    this.socket.emit(...args);

    return this;
  }

  emitBinary(event, buffer, callback) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }

    this.logger.logSend(event, null, buffer);

    if (callback) {
      this.socket.emit(event, buffer, (...cbArgs) => {
        this.logger.logReceive(`${event}:response`, cbArgs[0]);
        callback(...cbArgs);
      });
    } else {
      this.socket.emit(event, buffer);
    }

    return this;
  }

  subscribe(objectId, modelType, callback) {
    console.log(chalk.cyan(`Subscribing to ${modelType}:${objectId}...`));

    this.emit('subscribe', { objectId, modelType }, (response) => {
      if (response.nResult === 0) {
        console.log(chalk.green(`✓ Subscribed to ${modelType}:${objectId}`));
      } else {
        console.log(chalk.red(`✗ Subscribe failed: nResult=${response.nResult}`));
      }

      if (callback) {
        callback(response);
      }
    });

    return this;
  }

  unsubscribe(objectId, callback) {
    console.log(chalk.cyan(`Unsubscribing from ${objectId}...`));

    this.emit('unsubscribe', { objectId }, (response) => {
      if (response.nResult === 0) {
        console.log(chalk.green(`✓ Unsubscribed from ${objectId}`));
      } else {
        console.log(chalk.red(`✗ Unsubscribe failed: nResult=${response.nResult}`));
      }

      if (callback) {
        callback(response);
      }
    });

    return this;
  }

  sendAction(actionName, requestData, callback) {
    console.log(chalk.cyan(`Sending action: ${actionName}`));

    this.emit(actionName, requestData, (response) => {
      console.log(chalk.gray(`Response for ${actionName}:`), response);

      if (callback) {
        callback(response);
      }
    });

    return this;
  }

  printEventStatistics() {
    console.log(chalk.cyan('\n=== Event Statistics ==='));

    const events = Object.entries(this.eventCounts)
      .sort((a, b) => b[1] - a[1]);

    if (events.length === 0) {
      console.log(chalk.gray('No events received yet'));
    } else {
      events.forEach(([event, count]) => {
        console.log(chalk.white(`  ${event.padEnd(30)} ${count} times`));
      });
    }

    console.log(chalk.cyan('======================\n'));
  }

  disconnect() {
    if (this.socket) {
      console.log(chalk.yellow('Disconnecting...'));
      this.socket.disconnect();
    }
  }

  async run(duration = 30000) {
    await this.fetchConfig();

    this.connect();

    await new Promise(resolve => {
      this.socket.on('connect', resolve);
    });

    console.log(chalk.cyan(`\nObserving traffic for ${duration/1000}s...`));
    console.log(chalk.gray('Press Ctrl+C to stop early\n'));

    await new Promise(resolve => setTimeout(resolve, duration));

    this.printEventStatistics();
    this.disconnect();

    await new Promise(resolve => setTimeout(resolve, 1000));

    this.logger.close();
  }

  close() {
    this.disconnect();
    this.logger.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const duration = parseInt(process.argv[2]) || 30000;

  const analyzer = new WebSocketAnalyzer({
    enableHAR: true
  });

  const shutdown = async () => {
    console.log(chalk.yellow('\n\nShutting down...'));
    analyzer.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  analyzer.run(duration).catch(error => {
    console.error(chalk.red('Error:'), error);
    analyzer.close();
    process.exit(1);
  });
}

export default WebSocketAnalyzer;
