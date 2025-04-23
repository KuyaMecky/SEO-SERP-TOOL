//npm install puppeteer-extra puppeteer-extra-plugin-stealth proxy-chain axios csv-writer
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const { anonymizeProxy } = require('proxy-chain');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

puppeteer.use(StealthPlugin());

const TARGET_DOMAIN = 'chinchincasinoapp.com';
const KEYWORDS = [
  'chin chin casino app',
  'chinchin casino',
  'casino'
];
const DAILY_TRAFFIC_MIN = 500;
const DAILY_TRAFFIC_MAX = 1000;

const csvWriter = createCsvWriter({
  path: 'results.csv',
  header: [
    { id: 'proxy', title: 'Proxy' },
    { id: 'type', title: 'Traffic Type' },
    { id: 'success', title: 'Success' },
    { id: 'timestamp', title: 'Timestamp' }
  ],
  append: true
});

async function scrapeProxies() {
  try {
    const res = await axios.get('https://www.proxy-list.download/api/v1/get?type=https');
    return res.data
      .split('\r\n')
      .filter(p => p.includes(':'))
      .map(p => `http://${p}`);
  } catch (err) {
    console.error('Failed to fetch proxies:', err.message);
    return [];
  }
}

async function testProxy(proxyUrl) {
  try {
    const testProxy = await anonymizeProxy(proxyUrl);
    const browser = await puppeteer.launch({
      headless: true,
      args: [`--proxy-server=${testProxy}`]
    });
    const page = await browser.newPage();
    await page.goto('https://www.google.com', { timeout: 15000 });
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

async function getWorkingProxies(limit = 100) {
  const proxies = await scrapeProxies();
  const working = [];
  for (let i = 0; i < proxies.length && working.length < limit; i++) {
    const isWorking = await testProxy(proxies[i]);
    if (isWorking) {
      console.log(`✅ Proxy works: ${proxies[i]}`);
      working.push(proxies[i]);
    } else {
      console.log(`❌ Dead proxy: ${proxies[i]}`);
    }
  }
  return working;
}

async function simulateVisit(proxy, type = 'google') {
  const proxyUrl = await anonymizeProxy(proxy);
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--proxy-server=${proxyUrl}`]
  });

  const page = await browser.newPage();
  let success = false;

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    );

    if (type === 'google') {
      const keyword = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);
      await page.evaluate(() => window.scrollBy(0, 500));
      const links = await page.$$('a');
      for (const link of links) {
        const href = await page.evaluate(el => el.href, link);
        if (href.includes(TARGET_DOMAIN)) {
          await link.click();
          success = true;
          break;
        }
      }
    } else {
      const ref = type === 'telegram' ? 'https://t.me/' : 'https://facebook.com/';
      await page.setExtraHTTPHeaders({ referer: ref });
      await page.goto(`https://${TARGET_DOMAIN}`, { waitUntil: 'networkidle2' });
      success = true;
    }

    await page.waitForTimeout(Math.floor(Math.random() * 5000 + 7000));
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(3000);
  } catch (err) {
    console.log(`Error visiting via ${type}:`, err.message);
  } finally {
    await csvWriter.writeRecords([{
      proxy,
      type,
      success,
      timestamp: new Date().toISOString()
    }]);
    await browser.close();
  }
}

(async () => {
  const targetHits = Math.floor(Math.random() * (DAILY_TRAFFIC_MAX - DAILY_TRAFFIC_MIN + 1)) + DAILY_TRAFFIC_MIN;
  const workingProxies = await getWorkingProxies(targetHits);

  for (let i = 0; i < targetHits; i++) {
    const proxy = workingProxies[i % workingProxies.length];
    const type = Math.random() < 0.7 ? 'google' : (Math.random() < 0.5 ? 'telegram' : 'facebook');
    await simulateVisit(proxy, type);
    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 5000 + 2000))); // stagger visits
  }

  console.log(`✅ Simulation complete. Traffic sent: ${targetHits}`);
})();
