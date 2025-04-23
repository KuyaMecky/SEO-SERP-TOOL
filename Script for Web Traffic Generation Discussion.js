import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { randomInt } from 'crypto';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

// Initialize stealth plugin
puppeteer.use(StealthPlugin());

// CONFIGURATION (MUST USE YOUR OWN DOMAIN)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = {
    YOUR_DOMAIN: 'https://chinchincasinoapp.com', 
    KEYWORDS: ['Chinchin casino app', 'Chinchin casino', 'chin chin casino app', 'chin chin casino'],
  MAX_VISITS: 50,
  MIN_DELAY_MS: 8000,
  MAX_DELAY_MS: 15000,
  LOG_FILE: path.join(__dirname, 'traffic_analytics.csv'),
  HEADLESS: true,
  SCREEN_SIZES: [
    {width: 1920, height: 1080},
    {width: 1366, height: 768},
    {width: 1536, height: 864},
    {width: 1440, height: 900},
    {width: 1280, height: 720}
  ]
};

// Google Analytics simulation
const GA_PARAMS = {
  measurement_id: 'G-TMTRXWFJF8', 
  client_id: () => `GA1.2.${randomInt(1e9, 9e9)}.${Date.now()}`,
  session_id: () => randomInt(1e9, 9e9),
  referrers: [
    'https://www.google.com/',
    'https://www.bing.com/',
    'https://www.youtube.com/',
    'https://www.facebook.com/',
    'direct'
  ]
};

// Helper functions
const getRandomDelay = () => randomInt(CONFIG.MIN_DELAY_MS, CONFIG.MAX_DELAY_MS);
const getRandomKeyword = () => CONFIG.KEYWORDS[randomInt(0, CONFIG.KEYWORDS.length - 1)];
const getRandomScreenSize = () => CONFIG.SCREEN_SIZES[randomInt(0, CONFIG.SCREEN_SIZES.length - 1)];

async function sendGAHit(page, hitType, params = {}) {
  await page.evaluate(async (gaParams) => {
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    const url = new URL('https://www.google-analytics.com/g/collect');
    const payload = new URLSearchParams({
      v: '2',
      tid: gaParams.measurement_id,
      cid: gaParams.client_id,
      sid: gaParams.session_id,
      dl: document.location.href,
      dt: document.title,
      sr: screenRes,
      ua: navigator.userAgent,
      en: hitType,
      ...gaParams.customParams
    });
    
    await fetch(`${url}?${payload}`, { method: 'POST', keepalive: true });
  }, {
    measurement_id: GA_PARAMS.measurement_id,
    client_id: GA_PARAMS.client_id(),
    session_id: GA_PARAMS.session_id(),
    customParams: params
  });
}

async function simulateOrganicVisit(page) {
  const keyword = getRandomKeyword();
  const referrer = GA_PARAMS.referrers[randomInt(0, GA_PARAMS.referrers.length - 1)];
  const screenSize = getRandomScreenSize();

  // Set viewport before navigation
  await page.setViewport({
    width: screenSize.width,
    height: screenSize.height,
    deviceScaleFactor: 1
  });

  // Simulate search referral
  if (referrer.includes('google')) {
    await page.setExtraHTTPHeaders({
      'Referer': `${referrer}search?q=${encodeURIComponent(keyword)}&oq=${encodeURIComponent(keyword)}`
    });
  } else {
    await page.setExtraHTTPHeaders({ 'Referer': referrer });
  }

  // Navigate to site
  await page.goto(CONFIG.YOUR_DOMAIN, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Send initial pageview
  await sendGAHit(page, 'page_view', {
    dr: referrer,
    search_term: referrer.includes('google') ? keyword : undefined
  });

  // Simulate reading behavior
  await page.evaluate(() => {
    window.scrollBy(0, Math.floor(Math.random() * window.innerHeight * 2));
  });
  
  await new Promise(resolve => setTimeout(resolve, randomInt(3000, 8000)));

  // Random internal navigation
  const links = await page.$$eval('a[href^="/"], a[href^="http"]', as => 
    as.map(a => a.href)
    .filter(href => 
      href.startsWith(CONFIG.YOUR_DOMAIN) && 
      !href.includes('logout') &&
      !href.includes('wp-admin')
    ));
  
  if (links.length > 0) {
    const nextPage = links[Math.floor(Math.random() * links.length)];
    await page.click(`a[href="${new URL(nextPage).pathname}"]`);
    await page.waitForNavigation({waitUntil: 'networkidle2'});
    await sendGAHit(page, 'page_view');
    await new Promise(resolve => setTimeout(resolve, randomInt(2000, 5000)));
  }
}

async function runTrafficSimulation(index) {
  const browser = await puppeteer.launch({ 
    headless: CONFIG.HEADLESS,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  let status = 'Success';

  try {
    console.log(`[${index + 1}/${CONFIG.MAX_VISITS}] Simulating visit to ${CONFIG.YOUR_DOMAIN}`);
    await simulateOrganicVisit(page);
  } catch (err) {
    status = `Failed: ${err.message}`;
    console.error(`Simulation error: ${err.message}`);
  } finally {
    await browser.close();
    return status;
  }
}

(async () => {
  console.log('🚀 Starting Ethical Traffic Simulation');
  console.log(`📊 Results will be visible in Google Analytics`);
  
  // Initialize log file
  await fs.writeFile(CONFIG.LOG_FILE, 'timestamp,visit_number,status\n');

  for (let i = 0; i < CONFIG.MAX_VISITS; i++) {
    const status = await runTrafficSimulation(i);
    await fs.appendFile(CONFIG.LOG_FILE, 
      `${new Date().toISOString()},${i + 1},${status}\n`);
    
    if (i < CONFIG.MAX_VISITS - 1) {
      const delay = getRandomDelay();
      console.log(`⏳ Next visit in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.log('✅ Simulation complete');
  console.log(`🔍 Check Google Analytics in 24-48 hours for data`);
})();