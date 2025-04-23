import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { randomInt } from 'crypto';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

// Initialize stealth plugin
puppeteer.use(StealthPlugin());

// Ethical configuration - MUST UPDATE THESE TO YOUR OWN SITES
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = {
  TARGETS: ['https://chinchincasinoapp.com'], // REPLACE WITH YOUR TESTING URLS
  MAX_VISITS: 100,
  MIN_DELAY_MS: 3000,
  MAX_DELAY_MS: 10000,
  LOG_FILE: path.join(__dirname, 'ethical_traffic_log.csv'),
  HEADLESS: true
};

// Helper functions
const getRandomDelay = () => randomInt(CONFIG.MIN_DELAY_MS, CONFIG.MAX_DELAY_MS);
const getRandomTarget = () => {
  if (CONFIG.TARGETS.length === 0) throw new Error('No targets configured');
  if (CONFIG.TARGETS.length === 1) return CONFIG.TARGETS[0];
  return CONFIG.TARGETS[randomInt(0, CONFIG.TARGETS.length - 1)];
};

async function initLogs() {
  try {
    await fs.access(CONFIG.LOG_FILE);
  } catch {
    await fs.writeFile(CONFIG.LOG_FILE, 'timestamp,url,load_time_ms,status\n');
  }
}

async function simulateHumanInteraction(page) {
  const actions = [
    { type: 'scroll', y: randomInt(300, 1000) },
    { type: 'move', x: randomInt(0, 800), y: randomInt(0, 600) }
  ];

  // Find visible links using proper selectors
  const links = await page.$$('a:not([style*="display:none"])');
  if (links.length > 0) {
    actions.push({ 
      type: 'click', 
      selector: 'a:not([style*="display:none"])' 
    });
  }

  for (const action of actions.slice(0, randomInt(1, 3))) {
    try {
      switch (action.type) {
        case 'scroll':
          await page.evaluate((y) => window.scrollBy(0, y), action.y);
          break;
        case 'move':
          await page.mouse.move(action.x, action.y);
          break;
        case 'click':
          await page.click(action.selector, { 
            delay: randomInt(100, 500),
            visible: true // Ensures only visible elements are clicked
          });
          break;
      }
      await new Promise(resolve => setTimeout(resolve, randomInt(500, 2000)));
    } catch (err) {
      console.warn(`Behavior simulation skipped: ${err.message}`);
    }
  }
}

async function runEthicalVisit(index) {
  const browser = await puppeteer.launch({ 
    headless: CONFIG.HEADLESS,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  const targetUrl = getRandomTarget();
  const startTime = Date.now();
  let status = 'Success';

  try {
    console.log(`[${index + 1}/${CONFIG.MAX_VISITS}] Testing: ${targetUrl}`);
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.google.com/'
    });

    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    if (!response.ok()) {
      throw new Error(`HTTP ${response.status()}`);
    }

    await simulateHumanInteraction(page);
  } catch (err) {
    status = `Failed: ${err.message}`;
    console.error(`Test error: ${err.message}`);
  } finally {
    const loadTime = Date.now() - startTime;
    await fs.appendFile(CONFIG.LOG_FILE, 
      `${new Date().toISOString()},${targetUrl},${loadTime},${status}\n`);
    await browser.close();
  }
}

(async () => {
  console.log('🚀 Starting ETHICAL traffic simulation');
  await initLogs();

  for (let i = 0; i < CONFIG.MAX_VISITS; i++) {
    await runEthicalVisit(i);
    if (i < CONFIG.MAX_VISITS - 1) {
      const delay = getRandomDelay();
      console.log(`⏳ Next test in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.log('✅ Ethical testing complete');
  console.log(`📊 Results logged to ${CONFIG.LOG_FILE}`);
})();