const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  await page.click('#load-btn');
  await new Promise(r => setTimeout(r, 3000));

  // Get initial state
  const beforeExpand = await page.evaluate(() => {
    if (!window.app || !window.app.hierarchy) return 'No app.hierarchy';
    const h = window.app.hierarchy;
    return {
      nodeKeys: Array.from(h.nodes.keys()),
      nodeCount: h.nodes.size
    };
  });
  console.log('Before expand:', JSON.stringify(beforeExpand, null, 2));

  // Click the toggle to expand Root
  await page.click('.tree-toggle');
  await new Promise(r => setTimeout(r, 500));

  // Get state after expand
  const afterExpand = await page.evaluate(() => {
    if (!window.app || !window.app.hierarchy) return 'No app.hierarchy';
    const h = window.app.hierarchy;

    const rootNode = h.nodes.get('node-1');
    const children = rootNode?.querySelector(':scope > .tree-children');
    const toggle = rootNode?.querySelector(':scope > .tree-node-content > .tree-toggle');

    // Get names of all nodes
    const nodeNames = [];
    h.nodeData.forEach((data, key) => {
      nodeNames.push({ key, name: data.name, type: data.type });
    });

    return {
      nodeKeys: Array.from(h.nodes.keys()),
      nodeNames,
      childrenDisplay: children?.style.display,
      toggleText: toggle?.textContent,
      childCount: children?.children.length
    };
  });
  console.log('After expand:', JSON.stringify(afterExpand, null, 2));

  await page.screenshot({ path: 'logs/debug-expand.png' });
  console.log('Screenshot saved to logs/debug-expand.png');

  await browser.close();
})();
