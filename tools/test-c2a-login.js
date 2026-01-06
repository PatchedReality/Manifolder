/**
 * Test C2A (Client to Application) authentication with MVXP
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIB_DIR = path.join(__dirname, '..', 'lib', 'rp1');

const RP1_EMAIL = process.env.RP1_EMAIL;
const RP1_PASSWORD = process.env.RP1_PASSWORD;

if (!RP1_EMAIL || !RP1_PASSWORD) {
  console.error('❌ Missing credentials!');
  console.error('Set: export RP1_EMAIL="..." RP1_PASSWORD="..."');
  process.exit(1);
}

async function runTest() {
    console.log('🚀 Testing C2A Authentication...\n');
    console.log(`📧 Email: ${RP1_EMAIL}\n`);

    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,  // Open devtools
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    page.on('console', async (msg) => {
        const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => arg.toString())));
        const text = args.join(' ');
        if (!text.includes('Autofill')) {
            const prefix = msg.type() === 'error' ? '❌' : msg.type() === 'warning' ? '⚠️' : '📝';
            console.log(`${prefix} [Browser] ${text}`);
        }
    });

    // Start a local server and navigate to the test page
    const { spawn } = await import('child_process');
    const projectRoot = path.join(__dirname, '..');

    console.log('🌐 Starting local server...');
    const server = spawn('npx', ['http-server', projectRoot, '-p', '8765', '-c-1', '--cors'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Server started on port 8765\n');

    // Navigate to the test page
    console.log('📄 Loading test page...');
    await page.goto('http://localhost:8765/viewer/c2a-test.html', { waitUntil: 'networkidle0' });
    console.log('✅ Page loaded\n');

    // Store server reference for cleanup
    page._server = server;

    // Call the testC2A function defined in the HTML page
    const testResult = await page.evaluate(async (email, password) => {
        try {
            return await window.testC2A(email, password);
        } catch (error) {
            console.error('❌ Error:', error.message);
            return {
                status: 'error',
                error: error.message,
                stack: error.stack
            };
        }
    }, RP1_EMAIL, RP1_PASSWORD);

    // Cleanup server
    server.kill();

    console.log('\n' + '='.repeat(60));
    console.log('RESULT:', testResult.status.toUpperCase());
    console.log('='.repeat(60));

    if (testResult.status === 'success') {
        console.log('\n✅ SUCCESS! Authenticated with C2A!');
        console.log('User ID:', testResult.userIx);
        console.log('Session Token:', testResult.sessionToken);

        await browser.close();
        process.exit(0);
    } else {
        console.error('\n❌ Error:', testResult.error);
        if (testResult.stack) {
            console.error('Stack:', testResult.stack);
        }
        await browser.close();
        process.exit(1);
    }
}

runTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
