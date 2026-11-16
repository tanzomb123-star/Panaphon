const { chromium } = require('playwright');
const path = require('path');
const ENGINE = path.resolve(__dirname, '../engine');
/** Opens a blank page with the shared engine modules loaded. Caller closes `browser`. */
async function enginePage(viewport = { width: 600, height: 600 }) {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport });
  await page.goto('file://' + path.join(ENGINE, 'stage.html'));
  return { browser, page };
}
module.exports = { enginePage, ENGINE };
