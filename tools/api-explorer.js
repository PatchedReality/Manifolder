import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

class APIExplorer {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://hello.rp1.com';
    this.outputDir = options.outputDir || 'docs/api-discovery';
    this.timeout = options.timeout || 10000;
    this.verbose = options.verbose !== false;

    this.endpoints = new Map();
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async probe(endpoint, method = 'GET', data = null) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    if (this.verbose) {
      console.log(chalk.gray(`Probing: ${method} ${url}`));
    }

    try {
      const config = {
        method,
        url,
        timeout: this.timeout,
        validateStatus: () => true,
        maxRedirects: 0
      };

      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        config.data = data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);

      const result = {
        endpoint,
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        dataType: typeof response.data,
        size: JSON.stringify(response.data).length,
        timestamp: new Date().toISOString()
      };

      this.endpoints.set(`${method} ${endpoint}`, result);

      if (this.verbose) {
        const statusColor = response.status < 300 ? chalk.green :
                           response.status < 400 ? chalk.yellow : chalk.red;
        console.log(statusColor(`  ${response.status} ${response.statusText}`));
      }

      return result;
    } catch (error) {
      const result = {
        endpoint,
        method,
        url,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      };

      this.endpoints.set(`${method} ${endpoint}`, result);

      if (this.verbose) {
        console.log(chalk.red(`  Error: ${error.message}`));
      }

      return result;
    }
  }

  async probeEndpoint(endpoint) {
    console.log(chalk.cyan(`\n=== Testing ${endpoint} ===`));

    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'];
    const results = {};

    for (const method of methods) {
      const result = await this.probe(endpoint, method);
      results[method] = result;

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  async discoverCommonEndpoints() {
    console.log(chalk.cyan.bold('\n=== Discovering Common API Endpoints ===\n'));

    const patterns = [
      '/hello.msf',
      '/config/site.msf',
      '/api/hello.msf',
      '/v1/hello.msf',

      '/rmroot/update',
      '/rmcobject/update',
      '/rmtobject/update',
      '/rmpobject/update',
      '/rmcobject/search',
      '/rmtobject/search',

      '/api/rmroot/update',
      '/api/rmcobject/update',
      '/api/rmtobject/update',

      '/v1/rmroot/update',
      '/v1/rmcobject/update',

      '/api/v1/map',
      '/api/v1/scene',
      '/api/v1/world',

      '/auth/token',
      '/auth/login',
      '/api/auth/token',

      '/user/persona',
      '/api/user/persona',
      '/v1/user/persona',

      '/zone/list',
      '/api/zone/list',

      '/status',
      '/health',
      '/version',
      '/api/status',
      '/api/health'
    ];

    const results = [];

    for (const pattern of patterns) {
      const result = await this.probe(pattern, 'GET');
      results.push(result);

      if (result.status && result.status < 500) {
        console.log(chalk.green(`✓ Found: ${pattern} (${result.status})`));
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }

  async analyzeEndpoint(endpoint) {
    console.log(chalk.cyan.bold(`\n=== Analyzing ${endpoint} ===\n`));

    const getResult = await this.probe(endpoint, 'GET');

    if (!getResult.error && getResult.data) {
      console.log(chalk.white('Response structure:'));
      this.printObjectStructure(getResult.data);

      if (getResult.headers) {
        console.log(chalk.white('\nResponse headers:'));
        Object.entries(getResult.headers).forEach(([key, value]) => {
          console.log(chalk.gray(`  ${key}: ${value}`));
        });
      }
    }

    const optionsResult = await this.probe(endpoint, 'OPTIONS');
    if (optionsResult.headers?.allow) {
      console.log(chalk.white(`\nAllowed methods: ${optionsResult.headers.allow}`));
    }

    return {
      get: getResult,
      options: optionsResult
    };
  }

  printObjectStructure(obj, indent = 2, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
      console.log(' '.repeat(indent) + chalk.gray('...'));
      return;
    }

    if (typeof obj !== 'object' || obj === null) {
      console.log(' '.repeat(indent) + chalk.yellow(typeof obj) + chalk.gray(`: ${JSON.stringify(obj)}`));
      return;
    }

    if (Array.isArray(obj)) {
      console.log(' '.repeat(indent) + chalk.yellow(`Array[${obj.length}]`));
      if (obj.length > 0) {
        console.log(' '.repeat(indent + 2) + chalk.gray('[0]:'));
        this.printObjectStructure(obj[0], indent + 4, maxDepth, currentDepth + 1);
      }
      return;
    }

    Object.entries(obj).forEach(([key, value]) => {
      const typeStr = Array.isArray(value) ? `Array[${value.length}]` : typeof value;
      console.log(' '.repeat(indent) + chalk.cyan(key) + ': ' + chalk.yellow(typeStr));

      if (typeof value === 'object' && value !== null) {
        this.printObjectStructure(value, indent + 2, maxDepth, currentDepth + 1);
      } else if (typeof value === 'string' && value.length < 50) {
        console.log(' '.repeat(indent + 2) + chalk.gray(`"${value}"`));
      } else if (typeof value !== 'object') {
        console.log(' '.repeat(indent + 2) + chalk.gray(JSON.stringify(value)));
      }
    });
  }

  generateReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl: this.baseUrl,
      totalEndpointsTested: this.endpoints.size,
      endpoints: Array.from(this.endpoints.entries()).map(([key, value]) => ({
        key,
        ...value
      })),
      summary: {
        successful: 0,
        clientErrors: 0,
        serverErrors: 0,
        networkErrors: 0
      }
    };

    this.endpoints.forEach(result => {
      if (result.error) {
        report.summary.networkErrors++;
      } else if (result.status >= 200 && result.status < 300) {
        report.summary.successful++;
      } else if (result.status >= 400 && result.status < 500) {
        report.summary.clientErrors++;
      } else if (result.status >= 500) {
        report.summary.serverErrors++;
      }
    });

    return report;
  }

  saveReport(filename = 'api-discovery.json') {
    const report = this.generateReport();
    const filepath = path.join(this.outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    console.log(chalk.green(`\n✓ Report saved to ${filepath}`));

    return filepath;
  }

  printSummary() {
    const report = this.generateReport();

    console.log(chalk.cyan.bold('\n=== API Discovery Summary ===\n'));
    console.log(chalk.white(`Base URL: ${this.baseUrl}`));
    console.log(chalk.white(`Endpoints tested: ${report.totalEndpointsTested}`));
    console.log(chalk.green(`  Successful (2xx): ${report.summary.successful}`));
    console.log(chalk.yellow(`  Client errors (4xx): ${report.summary.clientErrors}`));
    console.log(chalk.red(`  Server errors (5xx): ${report.summary.serverErrors}`));
    console.log(chalk.gray(`  Network errors: ${report.summary.networkErrors}`));

    console.log(chalk.cyan.bold('\n=== Interesting Endpoints ===\n'));

    this.endpoints.forEach((result, key) => {
      if (result.status >= 200 && result.status < 400) {
        const statusColor = result.status < 300 ? chalk.green : chalk.yellow;
        console.log(statusColor(`${key.padEnd(40)} ${result.status}`));

        if (result.data && typeof result.data === 'object') {
          const keys = Object.keys(result.data);
          if (keys.length > 0) {
            console.log(chalk.gray(`  → Contains: ${keys.slice(0, 5).join(', ')}`));
          }
        }
      }
    });

    console.log(chalk.cyan('\n===========================\n'));
  }

  async run() {
    await this.discoverCommonEndpoints();

    console.log(chalk.cyan.bold('\n=== Analyzing Known Endpoints in Detail ===\n'));

    await this.analyzeEndpoint('/hello.msf');

    const configSite = this.endpoints.get('GET /config/site.msf');
    if (configSite && configSite.status === 200) {
      await this.analyzeEndpoint('/config/site.msf');
    }

    this.printSummary();
    this.saveReport();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl = process.argv[2] || 'https://hello.rp1.com';

  const explorer = new APIExplorer({ baseUrl });

  explorer.run().catch(error => {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  });
}

export default APIExplorer;
