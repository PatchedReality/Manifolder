import WebSocketAnalyzer from './ws-analyzer.js';
import chalk from 'chalk';

async function testEarthMap() {
  // Connect to prod-map-earth instead of hello
  const analyzer = new WebSocketAnalyzer({
    wsUrl: 'wss://prod-map-earth.rp1.com:443',
    enableHAR: false
  });

  analyzer.connect();

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
    analyzer.socket.on('connect', () => {
      clearTimeout(timeout);
      resolve();
    });
    analyzer.socket.on('connect_error', reject);
  });

  console.log(chalk.cyan('\n=== Testing prod-map-earth WebSocket ===\n'));

  // Test: Request rmroot data
  console.log(chalk.yellow('Requesting rmroot data...'));
  analyzer.emit('rmroot:read', {}, (response) => {
    console.log(chalk.green('rmroot response:'), JSON.stringify(response, null, 2));
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  analyzer.printEventStatistics();
  analyzer.close();
}

testEarthMap().catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
