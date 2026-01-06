import chalk from 'chalk';

console.log(chalk.cyan.bold('\n=== RP1 Protocol Reverse Engineering Toolkit ===\n'));

console.log(chalk.white('Available commands:\n'));

console.log(chalk.green('  npm run ws-analyzer'));
console.log(chalk.gray('    Analyze WebSocket traffic and capture protocol messages\n'));

console.log(chalk.green('  npm run api-explorer'));
console.log(chalk.gray('    Discover and analyze HTTP API endpoints\n'));

console.log(chalk.green('  npm run simple-client'));
console.log(chalk.gray('    Run reference client implementation\n'));

console.log(chalk.green('  npm run serve-viewer'));
console.log(chalk.gray('    Start HTTP server for 3D Earth map viewer\n'));

console.log(chalk.white('Documentation:\n'));

console.log(chalk.cyan('  README.md'));
console.log(chalk.gray('    Getting started and usage guide\n'));

console.log(chalk.cyan('  docs/protocol-spec.md'));
console.log(chalk.gray('    Complete protocol specification\n'));

console.log(chalk.cyan('  docs/api-reference.md'));
console.log(chalk.gray('    API endpoint reference\n'));

console.log(chalk.cyan('  docs/findings.md'));
console.log(chalk.gray('    Detailed reverse engineering findings\n'));

console.log(chalk.yellow('Quick start:'));
console.log(chalk.white('  npm run ws-analyzer\n'));
