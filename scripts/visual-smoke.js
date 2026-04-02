const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const groups = [
  { name: 'Handy Portrait', width: 390, height: 844 },
  { name: 'Handy Landscape', width: 844, height: 390 },
  { name: 'Tablet Portrait', width: 768, height: 1024 },
  { name: 'Tablet/Laptop klein', width: 1024, height: 768 },
  { name: 'Desktop', width: 1440, height: 900 },
  { name: 'Sehr gross/Ultrawide', width: 3440, height: 1440 }
];

const outDir = path.resolve('test-output', 'visual-smoke');
fs.mkdirSync(outDir, { recursive: true });

function safeName(name) {
  return name.toLowerCase()
    .replace(/\//g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const pageUrl = `file:///${path.resolve('index.html').replace(/\\/g, '/')}`;

  for (const group of groups) {
    const consoleErrors = [];
    const consoleWarnings = [];

    const context = await browser.newContext({
      viewport: { width: group.width, height: group.height }
    });

    const page = await context.newPage();

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') consoleErrors.push(text);
      if (type === 'warning') consoleWarnings.push(text);
    });

    await page.goto(pageUrl, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const topMetrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        bodyScrollWidth: body ? body.scrollWidth : 0,
        overflowX: getComputedStyle(document.documentElement).overflowX,
        hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth
      };
    });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);

    const bottomMetrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        bodyScrollWidth: body ? body.scrollWidth : 0,
        hasHorizontalOverflow: doc.scrollWidth > doc.clientWidth,
        scrollTop: doc.scrollTop || document.body.scrollTop,
        scrollHeight: doc.scrollHeight
      };
    });

    const screenshotPath = path.join(outDir, `${safeName(group.name)}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    results.push({
      group: group.name,
      viewport: { width: group.width, height: group.height },
      screenshot: screenshotPath,
      consoleErrors,
      consoleWarnings,
      topMetrics,
      bottomMetrics
    });

    await context.close();
  }

  await browser.close();

  const resultPath = path.join(outDir, 'results.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved results to ${resultPath}`);
})();
