import { io } from 'socket.io-client';

const endpoint = 'wss://hello.rp1.com';

console.log(`Connecting to ${endpoint}...`);

const socket = io(endpoint, {
  transports: ['websocket'],
  autoConnect: false,
  reconnection: false
});

// Log ALL events
socket.onAny((eventName, ...args) => {
  console.log(`\n[EVENT] ${eventName}:`);
  console.log(JSON.stringify(args, null, 2).substring(0, 1000));
});

socket.on('connect', () => {
  console.log('\n[CONNECTED]');

  // Try various actions to see what works
  setTimeout(() => {
    console.log('\n--- Testing RMRoot:update (correct case) ---');
    socket.emit('RMRoot:update', { twRMRootIx: 1 }, (response) => {
      console.log('RMRoot:update response:', JSON.stringify(response));
    });
  }, 1000);

  setTimeout(() => {
    console.log('\n--- Testing IO:init ---');
    socket.emit('IO:init', { sNamespace: 'metaversal/map_hello' }, (response) => {
      console.log('IO:init response:', JSON.stringify(response));
    });
  }, 1500);

  setTimeout(() => {
    console.log('\n--- Testing MVRP:init ---');
    socket.emit('MVRP:init', {}, (response) => {
      console.log('MVRP:init response:', JSON.stringify(response));
    });
  }, 2000);

  setTimeout(() => {
    console.log('\n--- Testing MVIO:init ---');
    socket.emit('MVIO:init', {}, (response) => {
      console.log('MVIO:init response:', JSON.stringify(response));
    });
  }, 3000);

  setTimeout(() => {
    console.log('\n--- Testing list actions ---');
    socket.emit('list', {}, (response) => {
      console.log('list response:', JSON.stringify(response));
    });
  }, 4000);

  // Disconnect after tests
  setTimeout(() => {
    console.log('\n--- Disconnecting ---');
    socket.disconnect();
    process.exit(0);
  }, 8000);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});

socket.connect();
