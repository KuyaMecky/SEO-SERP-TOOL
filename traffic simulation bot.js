const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');
const { randomInt } = require('crypto');
const HttpsProxyAgent = require('https-proxy-agent');
const fs = require('fs');
const axios = require('axios');
const ipinfo = require('ipinfo');
const pLimit = require('p-limit');
console.log(pLimit);
const limit = pLimit(10); // Use this to limit concurrent proxy tests



const PROXY_TEST_URL = 'https://ipinfo.io/json';
const PROXY_API_HEADERS = { 'User-Agent': new UserAgent().toString() };

// === CONFIGURATION === //
const TARGET_URLS = [
  'http://sambadlotteryresult.xyz',
  'https://sambadlotteryresult.xyz/nagaland-state-lottery-sambad-today-result-200-pm/',
  'https://sambadlotteryresult.xyz/old-results/'
];

const PROXY_SOURCES = [
  'https://www.sslproxies.org/',
  'https://free-proxy-list.net/',
  'https://hidemy.name/en/proxy-list/'
];

const VISIT_COUNT = 10000000;
const HEADLESS = true;
const MIN_DELAY = 20000;
const MAX_DELAY = 40000;
const PROXY_TEST_TIMEOUT = 5000;
const LOG_FILE = 'traffic_log.csv';
// ===================== //

function getRandomInt(min, max) {
  return randomInt(Math.ceil(min), Math.floor(max + 1));
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.floor(ms)));
}

if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, 'Timestamp,Visit Number,Country,Proxy,URL,Status,Method\n');
}

function getSafeUserAgent(filter = {}) {
  try {
    return new UserAgent(filter);
  } catch {
    return new UserAgent();
  }
}

async function scrapeProxies() {
  const proxies = new Set();
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    for (const source of PROXY_SOURCES) {
      try {
        await page.goto(source, { timeout: 15000 });
        const pageProxies = await page.evaluate(() => {
          const list = [];
          document.querySelectorAll('table tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              const ip = cells[0].textContent.trim();
              const port = cells[1].textContent.trim();
              if (ip && port && /^\d+$/.test(port)) {
                list.push(`${ip}:${port}`);
              }
            }
          });
          return list;
        });
        pageProxies.forEach(p => proxies.add(p));
      } catch (err) {
        console.warn(`Failed to scrape ${source}: ${err.message}`);
      }
    }

    await browser.close();
  } catch (err) {
    console.error('Proxy scraping failed:', err.message);
  }

  return Array.from(proxies);
}

async function testProxy(proxy) {
  try {
    const agent = new HttpsProxyAgent(`http://${proxy}`);
    const response = await axios.get(PROXY_TEST_URL, {
      httpsAgent: agent,
      timeout: PROXY_TEST_TIMEOUT,
      headers: PROXY_API_HEADERS
    });

    if (response.data && response.data.ip && response.data.country) {
      console.log(`✓ Proxy ${proxy} working: IP=${response.data.ip}, Country=${response.data.country}`);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function getWorkingProxies() {
  console.log('🔍 Scraping fresh proxies...');
  const proxies = await scrapeProxies();
  console.log(`Found ${proxies.length} potential proxies, testing...`);

  const workingProxies = [];

  const testPromises = proxies.map(proxy =>
    limit(async () => {
      if (await testProxy(proxy)) {
        workingProxies.push(proxy);
      }
    })
  );
  

  await Promise.all(testPromises);
  return workingProxies;
}

async function getGeoFromProxy(proxy) {
  try {
    const ip = proxy.split(':')[0];
    const info = await ipinfo(ip);
    return {
      timezone: info.timezone || 'UTC',
      language: `en-${info.country || 'US'}`,
      userAgent: getSafeUserAgent({ deviceCategory: 'mobile' }),
      country: info.country || 'Unknown'
    };
  } catch {
    return {
      timezone: 'UTC',
      language: 'en-US',
      userAgent: getSafeUserAgent({ deviceCategory: 'mobile' }),
      country: 'Unknown'
    };
  }
}

async function visitWithProxy(index, proxy, targetUrl) {
  const config = await getGeoFromProxy(proxy);
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: [
      `--proxy-server=${proxy}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(config.userAgent.toString());
    await page.setViewport({ width: 375, height: 667, isMobile: true });
    await page.setExtraHTTPHeaders({
      'Accept-Language': config.language,
      'Referer': 'https://www.google.com/search?q=lottery+results'
    });
    await page.emulateTimezone(config.timezone);

    console.log(`[${index + 1}/${VISIT_COUNT}] 📱 Visiting ${targetUrl} via ${proxy} (${config.country})`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    await simulateHumanBehavior(page);
    await wait(getRandomInt(8000, 15000));

    console.log(`✅ Success [${proxy}]`);
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()},${index + 1},${config.country},${proxy},${targetUrl},Success,mobile-proxy\n`);
  } catch (err) {
    console.error(`❌ Failed [${proxy}]: ${err.message}`);
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()},${index + 1},${config.country},${proxy},${targetUrl},Failed: ${err.message},mobile-proxy\n`);
  } finally {
    await browser.close();
  }
}

async function simulateHumanBehavior(page) {
  try {
    for (let i = 0; i < getRandomInt(2, 5); i++) {
      await page.mouse.move(getRandomInt(0, 375), getRandomInt(0, 667), { steps: getRandomInt(5, 15) });
      await wait(getRandomInt(200, 800));
    }
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const scrollPos = getRandomInt(0, Math.floor(scrollHeight * 0.8));
    await page.evaluate(pos => window.scrollTo({ top: pos, behavior: 'smooth' }), scrollPos);
    await wait(getRandomInt(3000, 8000));
  } catch (err) {
    console.warn('⚠️ Human behavior simulation failed:', err.message);
  }
}

(async () => {
  console.log('🚦 Starting proxy-based mobile traffic simulation');

  let workingProxies = await getWorkingProxies();
  let attempts = 1;

  while (workingProxies.length === 0 && attempts < 3) {
    console.warn(`🔁 Retrying proxy fetch... Attempt ${++attempts}`);
    await wait(5000);
    workingProxies = await getWorkingProxies();
  }

  if (workingProxies.length === 0) {
    console.error('❌ No working proxies found. Exiting...');
    process.exit(1);
  }

  console.log(`🧰 Using ${workingProxies.length} working proxies`);

  for (let i = 0; i < VISIT_COUNT; i++) {
    const proxy = workingProxies[getRandomInt(0, workingProxies.length - 1)];
    const targetUrl = TARGET_URLS[getRandomInt(0, TARGET_URLS.length - 1)];

    await visitWithProxy(i, proxy, targetUrl);

    const delay = getRandomInt(MIN_DELAY, MAX_DELAY);
    console.log(`⏳ Next visit in ${Math.floor(delay / 1000)}s...`);
    await wait(delay);
  }

  console.log('✅ All visits completed');
  console.log(pLimit);

})();