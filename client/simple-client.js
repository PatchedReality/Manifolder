import WebSocketAnalyzer from '../tools/ws-analyzer.js';
import chalk from 'chalk';

class RP1Client {
  constructor(options = {}) {
    this.analyzer = new WebSocketAnalyzer({
      configUrl: options.configUrl || 'https://hello.rp1.com/hello.msf',
      wsUrl: options.wsUrl,
      enableHAR: options.enableHAR || false
    });

    this.connected = false;
    this.authenticated = false;
    this.persona = null;
    this.zone = null;

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.analyzer.on('connect', () => {
      this.connected = true;
      console.log(chalk.green.bold('\n✓ Client Connected'));
    });

    this.analyzer.on('disconnect', () => {
      this.connected = false;
      this.authenticated = false;
      console.log(chalk.yellow.bold('\n⚠ Client Disconnected'));
    });

    this.analyzer.on('refresh', (data) => {
      this.handleRefresh(data);
    });

    this.analyzer.on('NEAREST_OPEN', (data) => {
      console.log(chalk.cyan(`\n→ Avatar entered proximity:`), data);
    });

    this.analyzer.on('NEAREST_CLOSE', (data) => {
      console.log(chalk.cyan(`\n→ Avatar left proximity:`), data);
    });
  }

  handleRefresh(data) {
    if (!data) return;

    console.log(chalk.magenta(`\n→ Refresh event received:`));
    console.log(chalk.gray(`  Type: ${data.updateType || 'unknown'}`));
    console.log(chalk.gray(`  Object: ${data.objectId || 'unknown'}`));

    if (data.updateType === 'UPDATE' && data.data) {
      if (data.data.vPosition) {
        console.log(chalk.gray(`  Position: (${data.data.vPosition.dX}, ${data.data.vPosition.dY}, ${data.data.vPosition.dZ})`));
      }
    }
  }

  async connect() {
    console.log(chalk.cyan.bold('=== RP1 Simple Client ===\n'));

    await this.analyzer.fetchConfig();

    this.analyzer.connect();

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.analyzer.socket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.analyzer.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    console.log(chalk.green('✓ WebSocket connection established\n'));
  }

  async authenticate(credentials = {}) {
    console.log(chalk.cyan('Attempting authentication...'));

    return new Promise((resolve, reject) => {
      const { companyId, serviceId } = credentials;

      this.analyzer.emit('TOKEN', {
        sRDCompanyId: companyId || '',
        sRDServiceId: serviceId || ''
      }, (response) => {
        if (response && response.dwResult === 0) {
          console.log(chalk.green('✓ Token received'));

          const token = response.sToken;
          const encodedToken = Buffer.from(token).toString('base64');

          console.log(chalk.gray(`  Token (truncated): ${encodedToken.substring(0, 20)}...`));

          this.authenticated = true;
          resolve(response);
        } else {
          const errorMsg = response ? `Error code: ${response.dwResult}` : 'No response';
          console.log(chalk.red(`✗ Authentication failed: ${errorMsg}`));
          reject(new Error(`Authentication failed: ${errorMsg}`));
        }
      });

      setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 10000);
    });
  }

  async openPersona(userIx = 0, personaIx = 0) {
    console.log(chalk.cyan(`Opening persona (User: ${userIx}, Persona: ${personaIx})...`));

    return new Promise((resolve, reject) => {
      this.analyzer.emit('RUser:rpersona_open', {
        twUserIx: userIx,
        twRPersonaIx: personaIx
      }, (response) => {
        if (response && response.nResult === 0) {
          this.persona = response.persona;
          console.log(chalk.green('✓ Persona opened'));
          console.log(chalk.gray(`  Persona data:`), response.persona);
          resolve(response);
        } else {
          const errorMsg = response ? `Error code: ${response.nResult}` : 'No response';
          console.log(chalk.red(`✗ Failed to open persona: ${errorMsg}`));
          reject(new Error(`Failed to open persona: ${errorMsg}`));
        }
      });

      setTimeout(() => {
        reject(new Error('Open persona timeout'));
      }, 10000);
    });
  }

  async joinZone(zoneId) {
    console.log(chalk.cyan(`Joining zone: ${zoneId}...`));

    return new Promise((resolve, reject) => {
      this.analyzer.emit('RZone:assign', {
        twRPersonaIx: this.persona?.twRPersonaIx || 0,
        sZoneId: zoneId
      }, (response) => {
        if (response && response.nResult === 0) {
          this.zone = zoneId;
          console.log(chalk.green(`✓ Joined zone: ${zoneId}`));
          resolve(response);
        } else {
          const errorMsg = response ? `Error code: ${response.nResult}` : 'No response';
          console.log(chalk.red(`✗ Failed to join zone: ${errorMsg}`));
          reject(new Error(`Failed to join zone: ${errorMsg}`));
        }
      });

      setTimeout(() => {
        reject(new Error('Join zone timeout'));
      }, 10000);
    });
  }

  updateAvatarState(state) {
    if (!this.connected) {
      throw new Error('Not connected');
    }

    const avatarState = this.buildAvatarState(state);

    this.analyzer.emitBinary('RPersona:update', avatarState, (response) => {
      if (response && response.nResult !== 0) {
        console.log(chalk.red(`Avatar update failed: ${response.nResult}`));
      }
    });
  }

  buildAvatarState(state) {
    const buffer = new ArrayBuffer(96);
    const view = new DataView(buffer);

    let offset = 0;

    view.setUint8(offset++, state.control || 0);
    view.setUint8(offset++, state.volume || 128);

    if (state.rotation) {
      view.setFloat64(offset, state.rotation.dX || 0, true); offset += 8;
      view.setFloat64(offset, state.rotation.dY || 0, true); offset += 8;
      view.setFloat64(offset, state.rotation.dZ || 0, true); offset += 8;
      view.setFloat64(offset, state.rotation.dW || 1, true); offset += 8;
    } else {
      offset += 32;
    }

    if (state.leftHand) {
      view.setFloat64(offset, state.leftHand.dX || 0, true); offset += 8;
      view.setFloat64(offset, state.leftHand.dY || 0, true); offset += 8;
      view.setFloat64(offset, state.leftHand.dZ || 0, true); offset += 8;
    } else {
      offset += 24;
    }

    if (state.rightHand) {
      view.setFloat64(offset, state.rightHand.dX || 0, true); offset += 8;
      view.setFloat64(offset, state.rightHand.dY || 0, true); offset += 8;
      view.setFloat64(offset, state.rightHand.dZ || 0, true); offset += 8;
    } else {
      offset += 24;
    }

    return buffer;
  }

  async observe(duration = 30000) {
    console.log(chalk.cyan(`\nObserving for ${duration/1000} seconds...`));
    console.log(chalk.gray('All events will be logged. Press Ctrl+C to stop.\n'));

    await new Promise(resolve => setTimeout(resolve, duration));
  }

  disconnect() {
    console.log(chalk.yellow('\nDisconnecting...'));
    this.analyzer.disconnect();
  }

  close() {
    this.analyzer.close();
  }
}

async function basicDemo() {
  const client = new RP1Client({ enableHAR: true });

  const shutdown = async () => {
    console.log(chalk.yellow('\n\nShutting down...'));
    client.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await client.connect();

    console.log(chalk.cyan.bold('\n=== Connection Test Complete ==='));
    console.log(chalk.white('The client is now connected to the RP1 server.'));
    console.log(chalk.white('Without valid credentials, we cannot authenticate.'));
    console.log(chalk.white('\nWaiting for server-initiated messages...\n'));

    await client.observe(30000);

    client.analyzer.printEventStatistics();
    client.close();

  } catch (error) {
    console.error(chalk.red('\nError:'), error.message);
    client.close();
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  basicDemo();
}

export default RP1Client;
