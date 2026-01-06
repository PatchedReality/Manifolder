import WebSocketAnalyzer from './ws-analyzer.js';
import chalk from 'chalk';

async function testProtocol() {
  const analyzer = new WebSocketAnalyzer({ enableHAR: false });

  await analyzer.fetchConfig();
  analyzer.connect();

  await new Promise(resolve => {
    analyzer.socket.on('connect', resolve);
  });

  console.log(chalk.cyan('\n=== Testing Protocol Messages ===\n'));

  // Test 1: Try to subscribe to something
  console.log(chalk.yellow('Test 1: Sending subscribe event...'));
  analyzer.emit('subscribe', { objectId: 'test', modelType: 'RPersona' }, (response) => {
    console.log(chalk.green('Subscribe response:'), response);
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Try TOKEN action (authentication)
  console.log(chalk.yellow('\nTest 2: Sending TOKEN action...'));
  analyzer.emit('TOKEN', { sRDCompanyId: '', sRDServiceId: '' }, (response) => {
    console.log(chalk.green('TOKEN response:'), response);
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Try to open RUser model
  console.log(chalk.yellow('\nTest 3: Sending RUser:rpersona_open...'));
  analyzer.emit('RUser:rpersona_open', { twUserIx: 0, twRPersonaIx: 0 }, (response) => {
    console.log(chalk.green('RUser response:'), response);
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Try rmroot/update (HTTP endpoint as WebSocket event?)
  console.log(chalk.yellow('\nTest 4: Sending rmroot/update...'));
  analyzer.emit('rmroot/update', {}, (response) => {
    console.log(chalk.green('rmroot response:'), response);
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log(chalk.cyan('\n=== Test Complete ===\n'));
  analyzer.printEventStatistics();
  analyzer.close();
}

testProtocol().catch(console.error);
