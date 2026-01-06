const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Capture console logs
  page.on('console', msg => console.log('[BROWSER]', msg.text()));

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));

  console.log('--- Loading map ---');
  await page.click('#load-btn');
  await new Promise(r => setTimeout(r, 3000));

  console.log('--- Expanding Root ---');
  await page.click('.tree-toggle');
  await new Promise(r => setTimeout(r, 500));

  // Now click on Earth's toggle to expand it
  console.log('--- Finding Earth toggle ---');
  const earthToggle = await page.$('.tree-children .tree-toggle');
  if (earthToggle) {
    console.log('--- Clicking Earth toggle ---');
    await earthToggle.click();
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log('--- No Earth toggle found ---');
  }

  // Get final state
  const result = await page.evaluate(() => {
    if (!window.app || !window.app.hierarchy) return 'No app.hierarchy';
    const h = window.app.hierarchy;

    const nodeNames = [];
    h.nodeData.forEach((data, key) => {
      nodeNames.push({
        key,
        name: data.name,
        type: data.type,
        hasChildren: data.hasChildren,
        childCount: data.children?.length || 0
      });
    });

    return { nodeNames };
  });

  console.log('Result:', JSON.stringify(result, null, 2));

  await page.screenshot({ path: 'logs/debug-earth-expand.png' });
  console.log('Screenshot saved to logs/debug-earth-expand.png');

  await browser.close();
})();
