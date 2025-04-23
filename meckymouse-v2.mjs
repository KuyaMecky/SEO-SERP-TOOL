import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'user-agents';
import { randomInt } from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fs from 'fs';
import axios from 'axios';
import ipinfo from 'ipinfo';
import pLimit from 'p-limit';

puppeteer.use(StealthPlugin());

const PROXY_TEST_URL = 'https://ipinfo.io/json';
const PROXY_API_HEADERS = { 'User-Agent': new UserAgent().toString() };

const TARGET_URLS = [
'https://chinchincasinoapp.com/',
'https://chinchincasinoapp.com/category/updates-and-events/'
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

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return randomInt(min, max);
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
          const proxies = [];
          document.querySelectorAll('table tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              const ip = cells[0].textContent.trim();
              const port = cells[1].textContent.trim();
              if (ip && port && /^\d+$/.test(port)) {
                proxies.push(`${ip}:${port}`);
              }
            }
          });
          return proxies;
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
  const limit = pLimit(10);

  const testPromises = proxies.map(proxy =>
    limit(async () => {
      const isWorking = await testProxy(proxy);
      if (isWorking) workingProxies.push(proxy);
    })
  );

  await Promise.all(testPromises);
  return workingProxies;
}

async function getGeoFromProxy(proxy) {
  try {
    const ip = proxy.split(':')[0];
    const info = await ipinfo(ip);
    const loc = info.loc.split(',');
    return {
      timezone: info.timezone || 'UTC',
      language: `en-${info.country || 'US'}`,
      userAgent: getSafeUserAgent({ deviceCategory: 'desktop' }),
      country: info.country || 'Unknown'
    };
  } catch {
    return {
      timezone: 'UTC',
      language: 'en-US',
      userAgent: getSafeUserAgent({ deviceCategory: 'desktop' }),
      country: 'Unknown'
    };
  }
}

async function visitWithProxy(page, url, proxy, config) {
  try {
    await page.setUserAgent(config.userAgent.toString());
    await page.setExtraHTTPHeaders({
      'Accept-Language': config.language,
      'Referer': 'https://www.google.com/search?q=lottery+results'
    });
    await page.emulateTimezone(config.timezone);
    await page.authenticate({ username: '', password: '' });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    return true;
  } catch (err) {
    console.warn(`Proxy ${proxy} failed (${err.message}), switching to stealth mode`);
    return false;
  }
}

async function stealthVisit(page, url, config) {
  try {
    await page.setUserAgent(config.userAgent.toString());
    await page.setExtraHTTPHeaders({
      'Accept-Language': config.language,
      'Referer': 'https://www.google.com/search?q=lottery+results'
    });
    await page.emulateTimezone(config.timezone);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    return true;
  } catch (err) {
    console.error('Stealth visit failed:', err.message);
    return false;
  }
}

async function simulateHumanBehavior(page) {
  try {
    for (let i = 0; i < getRandomInt(2, 5); i++) {
      await page.mouse.move(getRandomInt(0, 800), getRandomInt(0, 600), { steps: getRandomInt(5, 15) });
      await wait(getRandomInt(200, 800));
    }

    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const scrollPos = getRandomInt(0, Math.floor(scrollHeight * 0.8));
    await page.evaluate((pos) => {
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }, scrollPos);

    await wait(getRandomInt(3000, 8000));
  } catch (err) {
    console.warn('Behavior simulation error:', err.message);
  }
}

async function generateTraffic(index, workingProxies) {
  const proxy = workingProxies.length > 0
    ? workingProxies[getRandomInt(0, workingProxies.length - 1)]
    : null;

  const config = proxy ? await getGeoFromProxy(proxy) : {
    timezone: 'UTC',
    language: 'en-US',
    userAgent: getSafeUserAgent({ deviceCategory: 'desktop' }),
    country: 'Organic'
  };

  const targetUrl = TARGET_URLS[getRandomInt(0, TARGET_URLS.length - 1)];

  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: [
      ...(proxy ? [`--proxy-server=${proxy}`] : []),
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  let method = proxy ? 'proxy' : 'organic';
  let success = false;

  try {
    await page.evaluateOnNewDocument(() => {
      delete navigator.__proto__.webdriver;
      window.navigator.chrome = { runtime: {} };
    });

    console.log(`[${index + 1}/${VISIT_COUNT}] 🌐 ${config.country} via ${proxy || 'stealth'} → ${targetUrl}`);

    if (proxy) {
      success = await visitWithProxy(page, targetUrl, proxy, config);
      if (!success) {
        method = 'stealth';
        success = await stealthVisit(page, targetUrl, config);
      }
    } else {
      success = await stealthVisit(page, targetUrl, config);
    }

    if (success) {
      await simulateHumanBehavior(page);
      await wait(getRandomInt(8000, 15000));
      console.log(`✅ Success (${method})`);
    }

    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()},${index + 1},${config.country},${proxy || 'N/A'},${targetUrl},${success ? 'Success' : 'Failed'},${method}\n`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()},${index + 1},${config.country},${proxy || 'N/A'},${targetUrl},Failed: ${err.message},${method}\n`);
  } finally {
    await browser.close();
  }
}

(async () => {
  console.log('🚀 Starting advanced traffic simulation');

  const workingProxies = await getWorkingProxies();
  console.log(`Using ${workingProxies.length} working proxies`);

  for (let i = 0; i < VISIT_COUNT; i++) {
    await generateTraffic(i, workingProxies);
    const delay = getRandomInt(MIN_DELAY, MAX_DELAY);
    console.log(`⏳ Next visit in ${Math.floor(delay / 1000)}s...`);
    await wait(delay);
  }

  console.log('🎉 Simulation complete');
  console.log(`📊 Results logged to ${LOG_FILE}`);
})();
