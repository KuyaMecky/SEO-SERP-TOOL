const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');
const { randomInt } = require('crypto');
const fs = require('fs');
puppeteer.use(StealthPlugin());

// === CONFIGURATION === //
const TARGET_DOMAIN = 'chinchincasinoapp.com';
const TARGET_URLS = [
  `http://${TARGET_DOMAIN}`,
  `https://${TARGET_DOMAIN}/category/updates-and-events/`
];

const KEYWORDS = [
  "chinchin casino",
  "chinchin casino app",
  "chin chin casino app",
  "chin chin casino",
];

const SOCIAL_SOURCES = [
  { url: 'https://www.facebook.com/', param: 'fbclid' },
  { url: 'https://twitter.com/', param: 'tweet_id' },
  { url: 'https://www.reddit.com/', param: 'ref_source' }
];

const REFERRAL_SOURCES = [
  'https://www.lotterysambad.com/',
  'https://www.lotteryresult.in/',
  'https://www.lotterydrawresults.com/'
];

const VISIT_COUNT = 100;
const HEADLESS = true;
const MIN_DELAY = 15000;
const MAX_DELAY = 30000;
const LOG_FILE = 'traffic_log.csv';
// ===================== //

// Initialize log file
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, 'Timestamp,VisitID,TrafficSource,URL,Status,DwellTime,ScrollDepth,Keywords\n');
}

// Utility functions
function getRandomInt(min, max) {
  return randomInt(min, max);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getSafeUserAgent() {
  return new UserAgent({ deviceCategory: 'desktop' });
}

// Hardcoded server info
async function getServerIPInfo() {
  // return {
  //   ip: '86.38.243.123',
  //   country: 'IN',
  //   timezone: 'India/kolkata',
  //   region:'Na'
  // }

  return {
    ip: '147.93.101.184',
    country: 'DE',
    timezone: 'Europe/Berlin',
    region: 'Hesse'
  };
}

async function simulateOrganicSearch(page, config) {
  const keyword = KEYWORDS[getRandomInt(0, KEYWORDS.length - 1)];
  
  await page.setUserAgent(config.userAgent.toString());
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US'
  });

  // Simulate Google search
  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(keyword)}`, {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Simulate scanning results
  await wait(getRandomInt(2000, 5000));
  await autoScroll(page, 30, 50);

  // Randomly click a result
  const allResults = await page.$$('div.g');
  if (allResults.length > 0) {
    await allResults[getRandomInt(0, allResults.length - 1)].click();
    await wait(getRandomInt(1000, 3000));
  }

  return keyword;
}

async function simulateSocialReferral(page) {
  const platform = SOCIAL_SOURCES[getRandomInt(0, SOCIAL_SOURCES.length - 1)];
  await page.goto(`${platform.url}?${platform.param}=${Math.random().toString(36).substring(2)}`);
  await wait(getRandomInt(3000, 8000));
}

async function simulateReferralVisit(page) {
  const referrer = REFERRAL_SOURCES[getRandomInt(0, REFERRAL_SOURCES.length - 1)];
  await page.goto(referrer);
  await wait(getRandomInt(2000, 5000));
  await page.click(`a[href*="${TARGET_DOMAIN}"]`).catch(() => {});
  await wait(getRandomInt(1000, 2000));
}

async function simulateUserBehavior(page) {
  const startTime = Date.now();
  
  // Random mouse movements
  for (let i = 0; i < getRandomInt(3, 7); i++) {
    await page.mouse.move(
      getRandomInt(0, 1200),
      getRandomInt(0, 600),
      { steps: getRandomInt(5, 15) }
    );
    await wait(getRandomInt(200, 1000));
  }

  // Scroll behavior
  const scrollDepth = await autoScroll(page);
  
  // Random clicks (30% chance)
  if (Math.random() < 0.3) {
    await randomClick(page);
  }

  // Reading time
  await wait(getRandomInt(3000, 10000));
  
  return [
    Math.floor((Date.now() - startTime) / 1000),
    scrollDepth
  ];
}

async function autoScroll(page, minPercent = 40, maxPercent = 90) {
  const scrollPercent = getRandomInt(minPercent, maxPercent);
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const targetPos = Math.floor(scrollHeight * (scrollPercent / 100));
  
  await page.evaluate(async (pos) => {
    await new Promise(resolve => {
      const distance = pos - window.scrollY;
      const steps = 10;
      const stepSize = distance / steps;
      
      const scroll = () => {
        if (Math.abs(window.scrollY - pos) < stepSize) {
          window.scrollTo(0, pos);
          resolve();
        } else {
          window.scrollBy(0, stepSize);
          requestAnimationFrame(scroll);
        }
      };
      
      scroll();
    });
  }, targetPos);

  return scrollPercent;
}

async function randomClick(page) {
  const clickable = await page.$$('a, button, input[type=submit]');
  if (clickable.length > 0) {
    await clickable[getRandomInt(0, clickable.length - 1)].click().catch(() => {});
    await wait(getRandomInt(1000, 3000));
  }
}

async function navigateInternally(page) {
  const links = await page.$$eval('a', as => 
    as.map(a => a.href).filter(href => 
      href && href.includes(TARGET_DOMAIN) && !href.includes('#')
    )
  );
  
  if (links.length > 0) {
    const randomLink = links[getRandomInt(0, links.length - 1)];
    await page.goto(randomLink, { waitUntil: 'networkidle2' });
  }
}

// Traffic generation core
async function generateTraffic(visitId) {
  const visitStart = Date.now();
  const trafficSources = ['direct', 'organic', 'social', 'referral'];
  const selectedSource = trafficSources[getRandomInt(0, trafficSources.length - 1)];
  
  const config = {
    timezone: 'Europe/Berlin',
    language: 'en-US',
    userAgent: getSafeUserAgent(),
    country: 'DE'
  };

  const targetUrl = TARGET_URLS[getRandomInt(0, TARGET_URLS.length - 1)]; // Moved up
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-features=site-per-process',
      '--disable-web-security',
      '--disable-infobars'
    ]
  });

  const page = await browser.newPage();
  let visitSuccess = false;
  let dwellTime = 0;
  let scrollDepth = 0;
  let keywordsUsed = '';

  try {
    // Set viewport and other settings
    await page.setViewport({ width: 1366, height: 768 });
    await page.setJavaScriptEnabled(true);
    await page.setDefaultNavigationTimeout(60000);

    // Simulate different traffic sources
    switch (selectedSource) {
      case 'organic':
        keywordsUsed = await simulateOrganicSearch(page, config);
        break;
      case 'social':
        await simulateSocialReferral(page);
        break;
      case 'referral':
        await simulateReferralVisit(page);
        break;
      // direct goes straight to site
    }

    // Main site visit
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 45000,
      referer: selectedSource === 'organic' ? 'https://www.google.com/' : undefined
    });
    
    // Behavioral simulation
    [dwellTime, scrollDepth] = await simulateUserBehavior(page);
    visitSuccess = true;

    // Random internal navigation (30% chance)
    if (Math.random() < 0.3) {
      await navigateInternally(page);
      dwellTime += await simulateUserBehavior(page)[0];
    }

  } catch (err) {
    console.error(`❌ Visit ${visitId} failed: ${err.message}`);
  } finally {
    dwellTime = Math.floor((Date.now() - visitStart) / 1000);
    await browser.close();
    
    // Log results
    const logEntry = [
      new Date().toISOString(),
      visitId,
      selectedSource,
      targetUrl,
      visitSuccess ? 'success' : 'failed',
      dwellTime,
      scrollDepth,
      keywordsUsed
    ].join(',');
    
    fs.appendFileSync(LOG_FILE, logEntry + '\n');
    console.log(`📊 Visit ${visitId} completed (${selectedSource}, ${dwellTime}s, IP: 147.93.101.184)`);

    // Schedule next visit
    if (visitId < VISIT_COUNT - 1) {
      const delay = getRandomInt(MIN_DELAY, MAX_DELAY);
      setTimeout(() => generateTraffic(visitId + 1), delay);
    } else {
      console.log('🎉 Traffic generation completed');
    }
  }
}

// Main execution
(async () => {
  console.log('🚀 Starting traffic generation from 147.93.101.184 (Germany)');
  console.log('🌍 Using IP: 147.93.101.184 (DE, Europe/Berlin)');

  // Start initial traffic
  generateTraffic(0);
})();