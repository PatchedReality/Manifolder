/**
 * Puppeteer Test Harness for RP1 Native API with Authentication
 *
 * This test demonstrates logging in with email/password credentials
 * and retrieving map data from the RP1 API.
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIB_DIR = path.join(__dirname, '..', 'lib', 'rp1');
// Use hello.rp1.com connection string from hello.msf
const CONNECTION_STRING = 'secure=true;server=hello.rp1.com:443;session=RP1';

// Get credentials from environment variables
const RP1_EMAIL = process.env.RP1_EMAIL;
const RP1_PASSWORD = process.env.RP1_PASSWORD;

if (!RP1_EMAIL || !RP1_PASSWORD) {
  console.error('❌ Missing credentials!');
  console.error('Set environment variables:');
  console.error('  export RP1_EMAIL="your-email@example.com"');
  console.error('  export RP1_PASSWORD="your-password"');
  console.error('\nThen run: npm run test-puppeteer-auth');
  process.exit(1);
}

async function runTest() {
    console.log('🚀 Launching authenticated Puppeteer test...\n');
    console.log(`📧 Email: ${RP1_EMAIL}`);
    console.log(`🔒 Password: ${'*'.repeat(RP1_PASSWORD.length)}\n`);

    const browser = await puppeteer.launch({
        headless: false, // Show browser for debugging
        devtools: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    page.on('console', async (msg) => {
        const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => arg.toString())));
        const text = args.join(' ');
        if (!text.includes('Autofill') && !text.includes('Network.enable')) {
            const prefix = msg.type() === 'error' ? '❌' : msg.type() === 'warning' ? '⚠️' : '📝';
            console.log(`${prefix} [Browser] ${text}`);
        }
    });

    await page.setContent('<html><body><h1>RP1 Auth Test</h1><div id="status">Loading...</div></body></html>');

    // Load all scripts
    const scripts = [
        'jquery-3.3.1.js',
        'socket.io.min.js',
        'MVMF.js',
        'MVSB.js',
        'MVRest.js',
        'MVXP.js',
        'MVIO.js',
        'MVRP.js',
        'MVRP_Map.js'
    ];

    console.log('📦 Loading RP1 libraries...');
    for (const scriptName of scripts) {
        const scriptPath = path.join(LIB_DIR, scriptName);
        const scriptContent = await fs.readFile(scriptPath, 'utf8');
        await page.evaluate((content) => {
            const script = document.createElement('script');
            script.textContent = content;
            document.head.appendChild(script);
            if (typeof MV !== 'undefined' && !window.MV) window.MV = MV;
        }, scriptContent);
    }

    console.log('✅ Libraries loaded\n');

    // Run authenticated test
    const testResult = await page.evaluate(async (connectionString, email, password) => {
        console.log('🔧 Initializing framework...');

        try {
            if (!window.MV) throw new Error('MV namespace not available');

            // Open plugins
            MV.MVMF.Core.Plugin_Open('MVSB');
            MV.MVMF.Core.Plugin_Open('MVIO');
            MV.MVMF.Core.Plugin_Open('MVXP');
            MV.MVMF.Core.Plugin_Open('MVRP');
            console.log('✅ Plugins opened');

            // Require MVIO
            const pRequire = MV.MVMF.Core.Require('MVIO', null, 'MVIO');
            if (!pRequire) throw new Error('Failed to require MVIO');

            // Create service
            console.log('🌐 Creating service...');
            const serviceFactory = MV.MVIO.SERVICE.factory();
            const serviceRef = serviceFactory.Reference('MVIO');
            const pService = serviceRef.Create(connectionString);
            if (!pService) throw new Error('Service creation failed');
            console.log('✅ Service created');

            // Create client
            const clientRef = new MV.MVIO.SERVICE.CLIENT.IREFERENCE(0);
            const pClient = pService.Client_Open(clientRef);

            // Create session (IO_SESSION_NULL supports authentication via Login)
            console.log('🔐 Creating session...');
            const sessionFactory = MV.MVIO.IO_SESSION_NULL.factory();
            const pSession = sessionFactory.Create(pClient);
            console.log('✅ Session created');

            // Connect to WebSocket
            console.log('🔌 Connecting to server...');
            pSession.Connect();

            // Wait for socket connection
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (pClient.pSocket && pClient.pSocket.connected) {
                        clearInterval(checkInterval);
                        console.log('✅ Socket connected');
                        resolve();
                    } else if (attempts > 150) { // 15 seconds
                        clearInterval(checkInterval);
                        reject(new Error('Socket connection timeout'));
                    }
                }, 100);
            });

            // Now login with credentials
            console.log('🔑 Logging in with credentials...');

            // The pClient.Login() method expects (pSource, pParams)
            // pSource is the session, pParams contains credentials
            const loginParams = {
                twUserIx: 0,
                sContact: email,
                sPassword: password,
                bRemember: 0,
                acToken64U_Login: '',
                acToken64U_Session: '',
                twSecureDoorIx: 0x0000FFFFFFFFFFFF
            };

            // Call Login on the client
            const loginStarted = pClient.Login(pSession, loginParams);
            if (!loginStarted) {
                throw new Error('Login call failed to start');
            }

            console.log('⏳ Waiting for login to complete...');

            // Wait for login to complete by monitoring pClient.bLoggedIn
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;

                    if (pClient.bLoggedIn) {
                        clearInterval(checkInterval);
                        console.log('✅ Login successful!');
                        console.log('Session token:', pClient.pLogin ? 'Present' : 'N/A');
                        resolve();
                    } else if (attempts > 100) { // 10 seconds
                        clearInterval(checkInterval);
                        reject(new Error('Login timeout - credentials may be incorrect'));
                    }
                }, 100);
            });

            // Now create RMROOT object
            console.log('📦 Creating RMROOT object...');
            const rmrootRef = new MV.MVRP.Map.RMROOT.IREFERENCE('RMRoot', 1);
            const pIORoot = rmrootRef.Create(pClient);
            const pModel = new MV.MVRP.Map.RMROOT(rmrootRef, pIORoot);
            pIORoot.initialize(pModel);
            console.log('✅ RMROOT created');

            // Request data
            console.log('📡 Requesting RMROOT data...');
            pIORoot.Attach(false); // false = UPDATE (one-time read)

            // Wait for data
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;

                    if (pIORoot.pData || pModel.pName) {
                        clearInterval(checkInterval);
                        console.log('✅ Data received!');
                        resolve();
                    } else if (attempts > 100) { // 10 seconds
                        clearInterval(checkInterval);
                        reject(new Error('Data receive timeout'));
                    } else if (attempts % 10 === 0) {
                        console.log(`Still waiting for data... (${attempts/10}s)`);
                    }
                }, 100);
            });

            // Extract data
            const data = {
                name: pModel.pName ? JSON.stringify(pModel.pName) : 'N/A',
                owner: pModel.pOwner ? JSON.stringify(pModel.pOwner) : 'N/A',
                rawData: pIORoot.pData ? JSON.stringify(pIORoot.pData) : 'N/A',
                children: pModel.pChildren ? pModel.pChildren.length : 0
            };

            console.log('\n📊 SUCCESS! RMROOT Data Retrieved:');
            console.log('===================================');
            console.log('Name:', data.name);
            console.log('Owner:', data.owner);
            console.log('Children:', data.children);
            console.log('Raw Data:', data.rawData);

            return {
                status: 'success',
                data: data
            };

        } catch (error) {
            console.error('❌ Error:', error.message);
            console.error('Stack:', error.stack);

            return {
                status: 'error',
                error: error.message,
                stack: error.stack
            };
        }
    }, CONNECTION_STRING, RP1_EMAIL, RP1_PASSWORD);

    console.log('\n' + '='.repeat(60));
    console.log('RESULT:', testResult.status.toUpperCase());
    console.log('='.repeat(60));

    if (testResult.status === 'success') {
        console.log('\n✅ SUCCESS! Retrieved Earth map data!\n');
        console.log('Data Summary:');
        console.log('-------------');
        console.log(JSON.stringify(testResult.data, null, 2));

        await browser.close();
        process.exit(0);
    } else {
        console.error('\n❌ Test failed:', testResult.error);
        if (testResult.stack) {
            console.error('\nStack:', testResult.stack);
        }

        await browser.close();
        process.exit(1);
    }
}

runTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
