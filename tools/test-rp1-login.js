/**
 * Test RP1 login using their actual login page
 */

import puppeteer from 'puppeteer';
import { writeFile } from 'fs/promises';

const RP1_EMAIL = process.env.RP1_EMAIL;
const RP1_PASSWORD = process.env.RP1_PASSWORD;

if (!RP1_EMAIL || !RP1_PASSWORD) {
  console.error('❌ Missing credentials!');
  console.error('Set: export RP1_EMAIL="..." RP1_PASSWORD="..."');
  process.exit(1);
}

async function runTest() {
    console.log('🚀 Testing RP1 login via their actual page...\n');
    console.log(`📧 Email: ${RP1_EMAIL}\n`);

    const browser = await puppeteer.launch({
        headless: false,  // Show browser
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Capture console logs
    page.on('console', async (msg) => {
        const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => arg.toString())));
        const text = args.join(' ');
        if (!text.includes('Autofill') && !text.includes('downloadable font')) {
            const prefix = msg.type() === 'error' ? '❌' : msg.type() === 'warning' ? '⚠️' : '📝';
            console.log(`${prefix} [Browser] ${text}`);
        }
    });

    // Monitor WebSocket connections
    page.on('request', request => {
        if (request.url().includes('ws') || request.url().includes('socket')) {
            console.log(`🔌 [WS Request] ${request.url()}`);
        }
    });

    page.on('response', response => {
        if (response.url().includes('ws') || response.url().includes('socket')) {
            console.log(`📥 [WS Response] ${response.status()} ${response.url()}`);
        }
    });

    console.log('📄 Loading rp1.com login page...');
    await page.goto('https://rp1.com/login', { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded\n');

    // Wait for the login form to appear
    console.log('⏳ Waiting for login form...');
    await page.waitForSelector('input[type="email"], input[name="email"], input.email', { timeout: 15000 })
        .catch(() => console.log('No email input found with standard selectors'));

    // Take a screenshot to see what we're working with
    await page.screenshot({ path: 'logs/rp1-login-page.png', fullPage: true });
    console.log('📸 Screenshot saved to logs/rp1-login-page.png');

    // Get all input fields
    const inputs = await page.evaluate(() => {
        const allInputs = document.querySelectorAll('input');
        return Array.from(allInputs).map(i => ({
            type: i.type,
            name: i.name,
            id: i.id,
            className: i.className,
            placeholder: i.placeholder
        }));
    });
    console.log('\nFound inputs:', JSON.stringify(inputs, null, 2));

    // Try to find and fill the email/password fields
    try {
        // Try different possible selectors for email
        const emailSelectors = [
            'input[type="email"]',
            'input[name="email"]',
            'input[name="contact"]',
            'input.email',
            'input[placeholder*="email" i]',
            'input[placeholder*="Email" i]'
        ];

        let emailFilled = false;
        for (const selector of emailSelectors) {
            const element = await page.$(selector);
            if (element) {
                console.log(`📝 Found email field: ${selector}`);
                await element.type(RP1_EMAIL);
                emailFilled = true;
                break;
            }
        }

        if (!emailFilled) {
            console.log('⚠️ Could not find email input. Check screenshot.');
        }

        // Try different possible selectors for password
        const passwordSelectors = [
            'input[type="password"]',
            'input[name="password"]',
            'input.password'
        ];

        let passwordFilled = false;
        for (const selector of passwordSelectors) {
            const element = await page.$(selector);
            if (element) {
                console.log(`🔒 Found password field: ${selector}`);
                await element.type(RP1_PASSWORD);
                passwordFilled = true;
                break;
            }
        }

        if (!passwordFilled) {
            console.log('⚠️ Could not find password input. Check screenshot.');
        }

        // Take another screenshot after filling
        await page.screenshot({ path: 'logs/rp1-login-filled.png', fullPage: true });
        console.log('📸 Screenshot saved to logs/rp1-login-filled.png');

        // Click the login button
        console.log('\n🔘 Clicking login button...');
        await page.click('button[type="submit"]');

        // Wait for navigation or login to complete
        console.log('⏳ Waiting for login to complete...');

        // Wait for either navigation or network idle
        await Promise.race([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
            new Promise(resolve => setTimeout(resolve, 10000))
        ]);

        // Take screenshot after login attempt
        await page.screenshot({ path: 'logs/rp1-after-login.png', fullPage: true });
        console.log('📸 Screenshot saved to logs/rp1-after-login.png');

        // Check current URL
        const currentUrl = page.url();
        console.log(`\n📍 Current URL: ${currentUrl}`);

        // Check if we're logged in by looking for user-specific elements
        const pageContent = await page.content();
        const isLoggedIn = pageContent.includes('Log Out') || pageContent.includes('logout') ||
                          currentUrl.includes('/home') || currentUrl.includes('/dashboard');

        if (isLoggedIn) {
            console.log('\n✅ LOGIN SUCCESSFUL!');

            // Extract session token from the page
            console.log('\n🔑 Extracting session token...');
            const tokenData = await page.evaluate(() => {
                // Look for session token in various places
                const result = {
                    cookies: document.cookie,
                    localStorage: {},
                    sessionStorage: {}
                };

                // Get localStorage
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    result.localStorage[key] = localStorage.getItem(key);
                }

                // Get sessionStorage
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    result.sessionStorage[key] = sessionStorage.getItem(key);
                }

                // Try to get MV session data
                if (window.MV && window.g_pRP1Conn) {
                    result.mvSession = {
                        isLoggedIn: g_pRP1Conn.IsLoggedIn(),
                        pLnG: g_pRP1Conn.pLnG ? {
                            sNamespace: g_pRP1Conn.pLnG.sNamespace,
                            sConnect: g_pRP1Conn.pLnG.sConnect
                        } : null
                    };

                    // Try to get login token
                    if (g_pRP1Conn.pLnG && g_pRP1Conn.pLnG.pSession && g_pRP1Conn.pLnG.pSession.pLogin) {
                        result.loginData = {
                            twUserIx: g_pRP1Conn.pLnG.pSession.pLogin.twUserIx,
                            acToken64U_Session: g_pRP1Conn.pLnG.pSession.pLogin.acToken64U_Session
                        };
                    }
                }

                return result;
            });

            console.log('\n📋 Session Data:');
            console.log('Cookies:', tokenData.cookies.substring(0, 100) + '...');
            console.log('LocalStorage keys:', Object.keys(tokenData.localStorage));
            console.log('SessionStorage keys:', Object.keys(tokenData.sessionStorage));

            if (tokenData.mvSession) {
                console.log('\n📋 MV Session:');
                console.log('  IsLoggedIn:', tokenData.mvSession.isLoggedIn);
                console.log('  Namespace:', tokenData.mvSession.pLnG?.sNamespace);
            }

            if (tokenData.loginData) {
                console.log('\n🔐 Login Token Data:');
                console.log('  User ID:', tokenData.loginData.twUserIx);
                console.log('  Session Token:', tokenData.loginData.acToken64U_Session?.substring(0, 50) + '...');

                // Save token to file
                const tokenFile = {
                    timestamp: new Date().toISOString(),
                    userIx: tokenData.loginData.twUserIx,
                    sessionToken: tokenData.loginData.acToken64U_Session,
                    localStorage: tokenData.localStorage,
                    cookies: tokenData.cookies
                };
                await writeFile('logs/rp1-session-token.json', JSON.stringify(tokenFile, null, 2));
                console.log('\n💾 Token saved to logs/rp1-session-token.json');
            }

            // Navigate to fabric viewer (existing map viewer functionality)
            console.log('\n🌍 Navigating to fabric viewer...');
            await page.goto('https://dev.rp1.com/company/5/fabric/viewer', { waitUntil: 'networkidle2' });

            await page.screenshot({ path: 'logs/rp1-earth-map.png', fullPage: true });
            console.log('📸 Screenshot saved to logs/rp1-earth-map.png');

            // Wait for page to fully load
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Find and interact with the fabric viewer
            console.log('\n📊 Interacting with fabric viewer...');

            // Find the URL input field
            const urlInputSelector = 'input[type="text"], input[placeholder*="url" i], input[placeholder*="URL" i]';
            await page.waitForSelector(urlInputSelector, { timeout: 10000 }).catch(() => {});

            // Get all inputs to find the right one
            const inputs = await page.evaluate(() => {
                const allInputs = document.querySelectorAll('input');
                return Array.from(allInputs).map((inp, idx) => ({
                    idx,
                    type: inp.type,
                    placeholder: inp.placeholder,
                    value: inp.value,
                    className: inp.className
                }));
            });
            console.log('Found inputs:', JSON.stringify(inputs, null, 2));

            // Find buttons
            const buttons = await page.evaluate(() => {
                const allButtons = document.querySelectorAll('button');
                return Array.from(allButtons).map((btn, idx) => ({
                    idx,
                    text: btn.textContent.trim(),
                    className: btn.className
                }));
            });
            console.log('Found buttons:', JSON.stringify(buttons, null, 2));

            // Enter the Earth map URL into the Fabric File URL field
            const fabricUrl = 'https://cdn2.rp1.com/config/earth.msf';
            console.log(`\n📝 Entering fabric URL: ${fabricUrl}`);

            // Find the specific Fabric URL input field (idx 6 with MYURL placeholder)
            const urlInput = await page.$('input[placeholder*="MYURL"]');
            if (urlInput) {
                await urlInput.click({ clickCount: 3 }); // Select all existing text
                await urlInput.type(fabricUrl);
                console.log('✅ URL entered into Fabric File URL field');

                await page.screenshot({ path: 'logs/rp1-fabric-url-entered.png', fullPage: true });

                // Find and click the "Load Url" button (it's a specific button)
                const loadButtons = await page.$$('button');
                let loadButtonClicked = false;
                for (const btn of loadButtons) {
                    const text = await page.evaluate(el => el.textContent.trim(), btn);
                    if (text === 'Load Url') {
                        console.log('🔘 Clicking "Load Url" button...');
                        await btn.click();
                        loadButtonClicked = true;
                        break;
                    }
                }

                if (loadButtonClicked) {
                    // Wait for data to load
                    console.log('⏳ Waiting for fabric to load (20 seconds)...');
                    await new Promise(resolve => setTimeout(resolve, 20000));

                    await page.screenshot({ path: 'logs/rp1-fabric-loaded.png', fullPage: true });
                    console.log('📸 Screenshot saved to logs/rp1-fabric-loaded.png');
                } else {
                    console.log('⚠️ Could not find "Load Url" button');
                }
            } else {
                console.log('⚠️ Could not find Fabric URL input field');
            }

            // Extract the tree structure from the DOM
            console.log('\n📊 Extracting map tree from DOM...');

            // Get the tree nodes from the fabric viewer
            const treeData = await page.evaluate(() => {
                const result = { nodes: [], rawHtml: '' };

                // Find tree nodes - looking for the Root/Earth structure
                const treeContainer = document.querySelector('[class*="tree"]') ||
                                     document.querySelector('[class*="fabric"]') ||
                                     document.querySelector('.MuiList-root');

                if (treeContainer) {
                    result.rawHtml = treeContainer.outerHTML.substring(0, 2000);
                }

                // Find all clickable tree items
                const treeItems = document.querySelectorAll('[role="treeitem"], [class*="TreeItem"], .MuiTreeItem-root, [class*="node"]');
                treeItems.forEach((item, idx) => {
                    result.nodes.push({
                        idx,
                        text: item.textContent?.trim().substring(0, 100),
                        className: item.className,
                        hasExpand: item.querySelector('[class*="expand"]') !== null
                    });
                });

                // Also look for list items that might be tree nodes
                const listItems = document.querySelectorAll('.MuiListItem-root, [class*="ListItem"]');
                listItems.forEach((item, idx) => {
                    const text = item.textContent?.trim();
                    if (text && (text.includes('Root') || text.includes('Earth') || text.includes('+'))) {
                        result.nodes.push({
                            idx: 'list-' + idx,
                            text: text.substring(0, 100),
                            className: item.className
                        });
                    }
                });

                return result;
            });

            console.log('Tree nodes found:', treeData.nodes.length);
            console.log('Nodes:', JSON.stringify(treeData.nodes, null, 2));

            // Try to click on "Earth" to expand it
            console.log('\n🌍 Attempting to expand Earth node...');
            const earthClicked = await page.evaluate(() => {
                // Find elements containing "Earth" text
                const allElements = document.querySelectorAll('*');
                for (const el of allElements) {
                    if (el.childNodes.length === 1 &&
                        el.textContent?.trim() === 'Earth' &&
                        el.tagName !== 'SCRIPT') {
                        // Found the Earth text element, look for parent clickable
                        let parent = el.parentElement;
                        for (let i = 0; i < 5 && parent; i++) {
                            if (parent.onclick || parent.getAttribute('role') === 'button' ||
                                parent.classList.contains('MuiButtonBase-root')) {
                                parent.click();
                                return { clicked: true, element: parent.className };
                            }
                            parent = parent.parentElement;
                        }
                        // Just click the element itself
                        el.click();
                        return { clicked: true, element: el.tagName };
                    }
                }

                // Try clicking the + icon next to Earth
                const plusIcons = document.querySelectorAll('[class*="expand"], [class*="icon"]');
                for (const icon of plusIcons) {
                    const parent = icon.closest('[class*="item"]') || icon.parentElement;
                    if (parent?.textContent?.includes('Earth')) {
                        icon.click();
                        return { clicked: true, element: 'expand-icon' };
                    }
                }

                return { clicked: false };
            });

            console.log('Earth click result:', earthClicked);

            // Wait for expansion
            await new Promise(resolve => setTimeout(resolve, 3000));

            await page.screenshot({ path: 'logs/rp1-earth-expanded.png', fullPage: true });
            console.log('📸 Screenshot saved to logs/rp1-earth-expanded.png');

            // Extract expanded tree data
            const expandedTree = await page.evaluate(() => {
                const result = { nodes: [] };

                // Get all text content that looks like tree nodes
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );

                const seenTexts = new Set();
                while (walker.nextNode()) {
                    const text = walker.currentNode.textContent.trim();
                    if (text && text.length > 1 && text.length < 100 && !seenTexts.has(text)) {
                        const parent = walker.currentNode.parentElement;
                        if (parent && !['SCRIPT', 'STYLE'].includes(parent.tagName)) {
                            // Check if this might be a tree node
                            const classList = parent.className || '';
                            if (classList.includes('item') || classList.includes('node') ||
                                classList.includes('Tree') || classList.includes('List') ||
                                text.match(/^[+\-]\s*\w/) || // starts with +/-
                                parent.closest('[class*="tree"]') ||
                                parent.closest('[class*="fabric"]')) {
                                seenTexts.add(text);
                                result.nodes.push({
                                    text,
                                    depth: getDepth(parent),
                                    className: classList.substring(0, 100)
                                });
                            }
                        }
                    }
                }

                function getDepth(el) {
                    let depth = 0;
                    while (el && el !== document.body) {
                        if (el.classList?.contains('MuiCollapse-entered') ||
                            el.classList?.contains('children') ||
                            el.getAttribute('role') === 'group') {
                            depth++;
                        }
                        el = el.parentElement;
                    }
                    return depth;
                }

                return result;
            });

            console.log('\nExpanded tree structure:');
            expandedTree.nodes.forEach(n => {
                console.log(`${'  '.repeat(n.depth)}${n.text}`);
            });

            // Save tree data to file
            await writeFile('logs/rp1-map-tree.json', JSON.stringify(expandedTree, null, 2));
            console.log('\n💾 Tree data saved to logs/rp1-map-tree.json');

            // Keep browser open
            console.log('\n✅ Complete! Browser staying open for inspection.');
            await new Promise(() => {});
        } else {
            console.log('\n⚠️ Login may have failed. Check screenshots.');
            console.log('Keeping browser open for inspection...');
            await new Promise(() => {});
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        await page.screenshot({ path: 'logs/rp1-login-error.png', fullPage: true });
        await browser.close();
        process.exit(1);
    }
}

// Create logs directory
import fs from 'fs';
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

runTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
