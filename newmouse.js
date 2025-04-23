const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');
puppeteer.use(StealthPlugin());

// === CONFIGURATION === //
const TARGET_URLS = [
'https://chinchincasinoapp.com/',
'https://chinchincasinoapp.com/category/updates-and-events/'
];

const PROXIES = []; // ['ip:port', ...]
const PROXY_AUTH = {}; // { 'ip:port': { username: 'user', password: 'pass' } }
const SITE_AUTH = { username: '', password: '' };

const VISIT_COUNT = 1000; // Start small
const MAX_CONCURRENT = 3; // Conservative concurrency
const DELAY_BETWEEN_LAUNCHES = 1000; // ms
const HEADLESS = true;
// ===================== //
// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Stats
const stats = {
  completed: 0,
  failed: 0,
  startTime: Date.now()
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateTraffic(index) {
  let browser;
  try {
    const userAgent = new UserAgent();
    const url = TARGET_URLS[Math.floor(Math.random() * TARGET_URLS.length)];
    const proxy = PROXIES.length ? PROXIES[getRandomInt(0, PROXIES.length - 1)] : null;

    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: [
        `--user-agent=${userAgent.toString()}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        ...(proxy ? [`--proxy-server=${proxy}`] : [])
      ],
      timeout: 60000
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);

    if (SITE_AUTH.username) await page.authenticate(SITE_AUTH);
    if (proxy && PROXY_AUTH[proxy]) await page.authenticate(PROXY_AUTH[proxy]);

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    console.log(`[${index + 1}/${VISIT_COUNT}] Visited: ${url}`);

    // Random browsing behavior
    const waitTime = getRandomInt(3000, 10000);
    await new Promise(resolve => setTimeout(resolve, waitTime));

    stats.completed++;
  } catch (err) {
    stats.failed++;
    console.error(`[${index + 1}] Error: ${err.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e.message);
      }
    }
  }
}

async function runBulkTest() {
  const activeTasks = new Set();
  
  for (let i = 0; i < VISIT_COUNT; i++) {
    // Wait if we have too many concurrent tasks
    while (activeTasks.size >= MAX_CONCURRENT) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const task = generateTraffic(i)
      .finally(() => activeTasks.delete(task));
    
    activeTasks.add(task);
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_LAUNCHES));
  }
  
  // Wait for all remaining tasks
  await Promise.all(activeTasks);
  
  // Print final stats
  const totalTime = (Date.now() - stats.startTime) / 1000;
  console.log(`
    ======== Results ========
    Total visits: ${VISIT_COUNT}
    Completed: ${stats.completed}
    Failed: ${stats.failed}
    Total time: ${totalTime.toFixed(2)}s
    Visits/minute: ${(stats.completed / totalTime * 60).toFixed(2)}
    =========================
  `);
}

runBulkTest().catch(console.error);