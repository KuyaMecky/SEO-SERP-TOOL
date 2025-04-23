const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');
const { randomInt } = require('crypto');
const fs = require('fs');
puppeteer.use(StealthPlugin());

// === CONFIGURATION === //
const TARGET_DOMAIN = 'sambadlotteryresult.xyz';
const TARGET_URLS = [
  `http://${TARGET_DOMAIN}?utm_source=direct&utm_medium=organic&utm_campaign=india_traffic`,
  `https://${TARGET_DOMAIN}/nagaland-state-lottery-sambad-today-result-200-pm/?utm_source=direct&utm_medium=referral`,
  `https://${TARGET_DOMAIN}/old-results/?utm_source=direct&utm_medium=social`
];

const VISIT_COUNT = 50; // Start with fewer visits for testing
const HEADLESS = true;
const MIN_DELAY = 15000; // 15 seconds
const MAX_DELAY = 45000; // 45 seconds
const LOG_FILE = 'traffic_log.csv';
const PROTOCOL_TIMEOUT = 180000; // 3 minutes timeout
const SERVER_IP = '86.38.243.123'; // Your Indian IP
// ===================== //

// Initialize log file
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, 'Timestamp,VisitID,URL,Status,DwellTime,ScrollDepth,UserAgent\n');
}

// Utility functions
function getRandomInt(min, max) {
  return randomInt(min, max);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateTraffic(visitId) {
  const visitStart = Date.now();
  const targetUrl = TARGET_URLS[getRandomInt(0, TARGET_URLS.length - 1)];
  const userAgent = new UserAgent({ deviceCategory: 'desktop' }).toString();

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--lang=en-IN',
      '--geolocation=latitude=19.0760;longitude=72.8777',
      `--proxy-server=direct://`,
      '--proxy-bypass-list=*'
    ],
    protocolTimeout: PROTOCOL_TIMEOUT
  });

  const page = await browser.newPage();
  let visitSuccess = false;
  let dwellTime = 0;
  let scrollDepth = 0;

  try {
    // Set Indian location signals
    await page.setUserAgent(userAgent);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
      'X-Forwarded-For': SERVER_IP
    });

    // Override geolocation API
    await page.evaluateOnNewDocument(() => {
      navigator.geolocation.getCurrentPosition = (success) => {
        success({
          coords: {
            latitude: 19.0760,  // Mumbai coordinates
            longitude: 72.8777,
            accuracy: 50
          },
          timestamp: Date.now()
        });
      };
    });

    // Set timezone and location
    await page.emulateTimezone('Asia/Kolkata');
    await page.emulateGeolocation({
      latitude: 19.0760,
      longitude: 72.8777,
      accuracy: 50
    });

    // Main visit with retry logic
    try {
      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
        referer: 'https://www.google.com/'
      });
      visitSuccess = true;
    } catch (err) {
      console.warn(`⚠️ Visit ${visitId} retrying: ${err.message}`);
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      visitSuccess = true;
    }

    // Simulate Indian user behavior
    if (visitSuccess) {
      // Scroll through 60-80% of page
      scrollDepth = await page.evaluate(async () => {
        return new Promise(resolve => {
          const targetDepth = 60 + Math.random() * 20;
          let scrolled = 0;
          const scrollHeight = document.body.scrollHeight;
          const scrollInterval = setInterval(() => {
            window.scrollBy(0, 100);
            scrolled += 100;
            if (scrolled >= (scrollHeight * targetDepth / 100)) {
              clearInterval(scrollInterval);
              resolve(targetDepth);
            }
          }, 300 + Math.random() * 700);
        });
      });

      // Random interactions
      await wait(2000 + getRandomInt(1000, 5000));
      await page.mouse.move(getRandomInt(0, 800), getRandomInt(0, 600));
      await wait(500 + getRandomInt(500, 1500));
      
      // 30% chance to click a link
      if (Math.random() < 0.3) {
        await page.$$eval('a', links => {
          if (links.length > 0) {
            links[Math.floor(Math.random() * links.length)].click();
          }
        });
        await wait(3000 + getRandomInt(2000, 5000));
      }
    }

  } catch (err) {
    console.error(`❌ Visit ${visitId} failed: ${err.message}`);
  } finally {
    dwellTime = Math.floor((Date.now() - visitStart) / 1000);
    await browser.close();
    
    // Enhanced logging
    const logEntry = [
      new Date().toISOString(),
      visitId,
      targetUrl,
      visitSuccess ? 'success' : 'failed',
      dwellTime,
      scrollDepth,
      userAgent.split(' ')[0] // Browser identifier only
    ].join(',');
    
    fs.appendFileSync(LOG_FILE, logEntry + '\n');
    console.log(`📊 Visit ${visitId} completed (${dwellTime}s, ${scrollDepth}% scrolled)`);

    // Schedule next visit
    if (visitId < VISIT_COUNT - 1) {
      const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
      setTimeout(() => generateTraffic(visitId + 1), delay);
    } else {
      console.log('🎉 Traffic generation completed');
    }
  }
}

// Main execution
(async () => {
  console.log(`🚀 Starting Indian traffic generation from ${SERVER_IP}`);
  console.log('⏳ Initializing...');
  
  // Start with 3 concurrent visitors
  for (let i = 0; i < Math.min(3, VISIT_COUNT); i++) {
    generateTraffic(i);
    await wait(3000 * (i + 1)); // Stagger starts
  }
})();