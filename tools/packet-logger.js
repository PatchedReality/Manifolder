import winston from 'winston';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

class PacketLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || 'logs';
    this.sessionId = options.sessionId || Date.now().toString();
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.enableHAR = options.enableHAR || false;

    this.packetSequence = 0;
    this.startTime = Date.now();
    this.harEntries = [];

    this.ensureLogDirectory();
    this.initializeWinstonLogger();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  initializeWinstonLogger() {
    const transports = [];

    if (this.enableFile) {
      transports.push(
        new winston.transports.File({
          filename: path.join(this.logDir, `${this.sessionId}.jsonl`),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );

      transports.push(
        new winston.transports.File({
          filename: path.join(this.logDir, `${this.sessionId}.log`),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(this.formatReadable.bind(this))
          )
        })
      );
    }

    if (this.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(this.formatColored.bind(this))
          )
        })
      );
    }

    this.logger = winston.createLogger({
      level: 'debug',
      transports
    });
  }

  formatReadable(info) {
    const elapsed = ((info.timestamp - this.startTime) / 1000).toFixed(3);
    const direction = info.direction === 'send' ? '→' : '←';

    let message = `[${elapsed}s] [#${info.sequence}] ${direction} ${info.event}`;

    if (info.data) {
      message += `\n  Data: ${JSON.stringify(info.data, null, 2).split('\n').join('\n  ')}`;
    }

    if (info.binary) {
      message += `\n  Binary: ${info.binary.length} bytes`;
      if (info.parsedHeader) {
        message += `\n  Header: ${JSON.stringify(info.parsedHeader, null, 2).split('\n').join('\n  ')}`;
      }
    }

    if (info.error) {
      message += `\n  Error: ${info.error}`;
    }

    return message;
  }

  formatColored(info) {
    const elapsed = chalk.gray(((Date.now() - this.startTime) / 1000).toFixed(3) + 's');
    const sequence = chalk.gray(`#${info.sequence}`);

    let dirSymbol, dirColor;
    if (info.direction === 'send') {
      dirSymbol = '→';
      dirColor = chalk.blue;
    } else {
      dirSymbol = '←';
      dirColor = chalk.green;
    }

    const eventName = info.event || 'unknown';
    let eventFormatted;

    switch (info.type) {
      case 'connection':
        eventFormatted = chalk.cyan.bold(eventName);
        break;
      case 'error':
        eventFormatted = chalk.red.bold(eventName);
        break;
      case 'binary':
        eventFormatted = chalk.magenta(eventName);
        break;
      default:
        eventFormatted = chalk.white(eventName);
    }

    let message = `${elapsed} ${sequence} ${dirColor(dirSymbol)} ${eventFormatted}`;

    if (info.data && Object.keys(info.data).length > 0) {
      const dataStr = JSON.stringify(info.data);
      if (dataStr.length < 100) {
        message += chalk.gray(' ' + dataStr);
      } else {
        message += chalk.gray(` (${Object.keys(info.data).length} fields)`);
      }
    }

    if (info.binary) {
      message += chalk.yellow(` [${info.binary.length}B]`);
    }

    if (info.error) {
      message += '\n' + chalk.red('  Error: ' + info.error);
    }

    return message;
  }

  logConnection(event, data = {}) {
    const logEntry = {
      sequence: ++this.packetSequence,
      timestamp: Date.now(),
      type: 'connection',
      event,
      direction: 'system',
      ...data
    };

    this.logger.info(logEntry);

    if (this.enableHAR) {
      this.addHAREntry(logEntry);
    }

    return logEntry;
  }

  logSend(event, data = null, binary = null) {
    const logEntry = {
      sequence: ++this.packetSequence,
      timestamp: Date.now(),
      type: binary ? 'binary' : 'message',
      event,
      direction: 'send',
      data,
      binary: binary ? {
        length: binary.length,
        hex: this.toHexPreview(binary)
      } : undefined
    };

    if (binary) {
      logEntry.parsedHeader = this.parseMVSBHeader(binary);
    }

    this.logger.info(logEntry);

    if (this.enableHAR) {
      this.addHAREntry(logEntry);
    }

    return logEntry;
  }

  logReceive(event, data = null, binary = null) {
    const logEntry = {
      sequence: ++this.packetSequence,
      timestamp: Date.now(),
      type: binary ? 'binary' : 'message',
      event,
      direction: 'receive',
      data,
      binary: binary ? {
        length: binary.length,
        hex: this.toHexPreview(binary)
      } : undefined
    };

    if (binary) {
      logEntry.parsedHeader = this.parseMVSBHeader(binary);
    }

    this.logger.info(logEntry);

    if (this.enableHAR) {
      this.addHAREntry(logEntry);
    }

    return logEntry;
  }

  logError(event, error, data = {}) {
    const logEntry = {
      sequence: ++this.packetSequence,
      timestamp: Date.now(),
      type: 'error',
      event,
      direction: 'system',
      error: error.message || error.toString(),
      stack: error.stack,
      ...data
    };

    this.logger.error(logEntry);

    return logEntry;
  }

  parseMVSBHeader(buffer) {
    if (!buffer || buffer.length < 16) {
      return null;
    }

    try {
      const view = new DataView(buffer.buffer || buffer);

      const packetId = [];
      for (let i = 0; i < 6; i++) {
        packetId.push(view.getUint8(i).toString(16).padStart(2, '0'));
      }

      const control = view.getUint16(6, true);
      const action = view.getUint32(8, true);
      const payloadSize = view.getUint16(12, true);
      const reserved = view.getUint16(14, true);

      const controlType =
        control === 0x0000 ? 'request' :
        control === 0x0001 ? 'request-noreply' :
        control === 0x0002 ? 'response' :
        `unknown-0x${control.toString(16)}`;

      return {
        packetId: packetId.join(''),
        control: `0x${control.toString(16).padStart(4, '0')} (${controlType})`,
        action: `0x${action.toString(16).padStart(8, '0')} (${action})`,
        payloadSize,
        reserved,
        headerValid: reserved === 0
      };
    } catch (e) {
      return { error: e.message };
    }
  }

  toHexPreview(buffer, maxBytes = 64) {
    const bytes = new Uint8Array(buffer);
    const preview = Array.from(bytes.slice(0, maxBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');

    return bytes.length > maxBytes ? preview + '...' : preview;
  }

  addHAREntry(logEntry) {
    this.harEntries.push({
      startedDateTime: new Date(logEntry.timestamp).toISOString(),
      time: 0,
      request: {
        method: logEntry.direction === 'send' ? 'SEND' : 'RECEIVE',
        url: `socket.io://${logEntry.event}`,
        httpVersion: 'Socket.IO',
        headers: [],
        queryString: [],
        postData: logEntry.data ? {
          mimeType: 'application/json',
          text: JSON.stringify(logEntry.data)
        } : undefined,
        headersSize: -1,
        bodySize: logEntry.binary ? logEntry.binary.length : (logEntry.data ? JSON.stringify(logEntry.data).length : 0)
      },
      response: {
        status: 0,
        statusText: '',
        httpVersion: 'Socket.IO',
        headers: [],
        content: {
          size: 0,
          mimeType: 'application/json'
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: -1
      },
      cache: {},
      timings: {
        send: 0,
        wait: 0,
        receive: 0
      }
    });
  }

  saveHAR(filename) {
    if (!this.enableHAR) {
      console.warn('HAR logging not enabled');
      return;
    }

    const har = {
      log: {
        version: '1.2',
        creator: {
          name: 'RP1 Protocol Analyzer',
          version: '1.0.0'
        },
        entries: this.harEntries
      }
    };

    const harPath = path.join(this.logDir, filename || `${this.sessionId}.har`);
    fs.writeFileSync(harPath, JSON.stringify(har, null, 2));

    console.log(chalk.green(`HAR file saved: ${harPath}`));
  }

  getStatistics() {
    const stats = {
      totalPackets: this.packetSequence,
      sessionDuration: (Date.now() - this.startTime) / 1000,
      packetsPerSecond: this.packetSequence / ((Date.now() - this.startTime) / 1000)
    };

    return stats;
  }

  printStatistics() {
    const stats = this.getStatistics();

    console.log(chalk.cyan('\n=== Session Statistics ==='));
    console.log(chalk.white(`Total Packets: ${stats.totalPackets}`));
    console.log(chalk.white(`Session Duration: ${stats.sessionDuration.toFixed(2)}s`));
    console.log(chalk.white(`Packets/Second: ${stats.packetsPerSecond.toFixed(2)}`));
    console.log(chalk.white(`Session ID: ${this.sessionId}`));
    console.log(chalk.white(`Log Directory: ${this.logDir}`));
    console.log(chalk.cyan('========================\n'));
  }

  close() {
    this.printStatistics();

    if (this.enableHAR) {
      this.saveHAR();
    }

    this.logger.close();
  }
}

export default PacketLogger;
