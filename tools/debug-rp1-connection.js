import { io } from 'socket.io-client';

const endpoints = [
  'wss://hello.rp1.com',
  'wss://hello.rp1.com:443',
  'wss://prod-map-earth.rp1.com',
  'wss://prod-map-earth.rp1.com:443',
  'wss://prod-friends.rp1.com',
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    console.log(`\nTesting: ${url}`);
    const socket = io(url, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false,
      timeout: 5000
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      console.log(`  ✗ Timeout`);
      resolve({ url, status: 'timeout' });
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log(`  ✓ Connected!`);
      socket.disconnect();
      resolve({ url, status: 'connected' });
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      console.log(`  ✗ Error: ${err.message}`);
      resolve({ url, status: 'error', error: err.message });
    });

    socket.connect();
  });
}

async function main() {
  console.log('Testing RP1 Socket.IO endpoints...\n');

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }

  console.log('\nDone.');
  process.exit(0);
}

main();
