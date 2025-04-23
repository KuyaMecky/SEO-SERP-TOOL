const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const pLimit = require('p-limit').default;
const { HttpsProxyAgent } = require('https-proxy-agent');
const { v4: uuidv4 } = require('uuid');

puppeteer.use(StealthPlugin());

// === CONFIGURATION === //
const KEYWORDS = [
  'chinchin casino',
  'chinchin casino app',
  'chin chin casino app',
  'chin chin casino'
];

const TARGET_DOMAIN = 'chinchincasinoapp.com';
const SEARCH_ENGINE = 'https://www.google.com/search?q=';
const MAX_PAGES_TO_CHECK = 3;
const RESULTS_PER_PAGE = 10;

const VISIT_COUNT = 50;
const MAX_CONCURRENT = 3;
const DELAY_BETWEEN_LAUNCHES = 5000; // Increased delay
const HEADLESS = true;
const PROXY_TEST_LIMIT = 50;
const PROXY_TEST_CONCURRENCY = 5; // Reduced concurrency for stability
const PROXY_CACHE_FILE = 'working_proxies.txt';
const RANKINGS_FILE = 'keyword_rankings.json';
const MAX_RETRIES = 3;
const REQUEST_DELAY = 5000;
const PROXY_TEST_TIMEOUT = 15000;
// ===================== //

const stats = {
  completed: 0,
  failed: 0,
  foundAndClicked: 0,
  startTime: Date.now(),
  rankings: {},
  proxyStats: {}
};

// Load previous data if exists
if (fs.existsSync(RANKINGS_FILE)) {
  const savedData = JSON.parse(fs.readFileSync(RANKINGS_FILE, 'utf-8'));
  stats.rankings = savedData.rankings || {};
  stats.proxyStats = savedData.proxyStats || {};
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomKeyword() {
  return KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
}

function saveWorkingProxies(proxies) {
  const dataToSave = {
    proxies: proxies,
    rankings: stats.rankings,
    proxyStats: stats.proxyStats
  };
  fs.writeFileSync(PROXY_CACHE_FILE, JSON.stringify(dataToSave, null, 2));
}

function loadCachedProxies() {
  if (fs.existsSync(PROXY_CACHE_FILE)) {
    const savedData = JSON.parse(fs.readFileSync(PROXY_CACHE_FILE, 'utf-8'));
    stats.rankings = savedData.rankings || stats.rankings;
    stats.proxyStats = savedData.proxyStats || stats.proxyStats;
    return savedData.proxies || [];
  }
  return [];
}

function saveRankings() {
  const dataToSave = {
    rankings: stats.rankings,
    proxyStats: stats.proxyStats
  };
  fs.writeFileSync(RANKINGS_FILE, JSON.stringify(dataToSave, null, 2));
}

async function fetchProxies() {
  const sources = [
    'https://www.sslproxies.org/',
    'https://free-proxy-list.net/',
    'https://www.us-proxy.org/',
    'https://www.socks-proxy.net/',
    'https://proxy-list.org/english/index.php'
  ];
  const proxySet = new Set();

  for (const url of sources) {
    try {
      const { data } = await axios.get(url, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const $ = cheerio.load(data);
      
      // Handle different proxy list formats
      $('table tbody tr').each((_, row) => {
        const tds = $(row).find('td');
        if (tds.length > 1) {
          const ip = $(tds[0]).text().trim();
          const port = $(tds[1]).text().trim();
          const https = tds.length > 6 ? $(tds[6]).text().trim().toLowerCase() : 'yes';
          
          if (ip && port && https === 'yes') {
            proxySet.add(`${ip}:${port}`);
          }
        }
      });
      
      // Additional parsing for proxy-list.org format
      $('.table ul').each((_, ul) => {
        const items = $(ul).find('li').map((_, li) => $(li).text().trim()).get();
        if (items.length > 0 && items[0].includes(':')) {
          proxySet.add(items[0]);
        }
      });
    } catch (err) {
      console.warn(`Failed to fetch from ${url}: ${err.message}`);
    }
  }

  return Array.from(proxySet);
}

async function testProxy(proxy) {
  try {
    const agent = new HttpsProxyAgent(`http://${proxy}`);
    const startTime = Date.now();
    const response = await axios.get('https://www.google.com', {
      httpsAgent: agent,
      timeout: PROXY_TEST_TIMEOUT,
      headers: {
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (response.status !== 200 || !response.data.includes('Google')) {
      console.log(`❌ Proxy ${proxy} returned invalid response`);
      return false;
    }
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Proxy ${proxy} working (${responseTime}ms)`);
    return true;
  } catch (err) {
    console.log(`❌ Proxy ${proxy} failed: ${err.message}`);
    return false;
  }
}

async function filterWorkingProxies(proxyList) {
  const working = [];
  const limit = pLimit(PROXY_TEST_CONCURRENCY);
  const tasks = [];

  for (const proxy of proxyList) {
    if (working.length >= PROXY_TEST_LIMIT) break;

    const task = async () => {
      if (await testProxy(proxy)) {
        working.push(proxy);
      }
    };
    tasks.push(limit(task));
  }

  await Promise.all(tasks);
  return working;
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createProxyRotator(proxies) {
  let index = 0;
  return {
    next: () => {
      const proxy = proxies[index];
      index = (index + 1) % proxies.length;
      return proxy;
    }
  };
}

async function checkRanking(page, keyword) {
  let ranking = null;
  let currentPage = 1;
  let found = false;

  while (currentPage <= MAX_PAGES_TO_CHECK && !found) {
    const searchURL = `${SEARCH_ENGINE}${encodeURIComponent(keyword)}${currentPage > 1 ? `&start=${(currentPage-1)*RESULTS_PER_PAGE}` : ''}`;
    
    try {
      await page.goto(searchURL, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for results to load
      await page.waitForSelector('#search', { timeout: 10000 });

      // Get all organic results
      const results = await page.$$eval('div.g', (divs, targetDomain) => {
        return divs.map((div, index) => {
          const link = div.querySelector('a');
          return {
            position: index + 1,
            url: link ? link.href : null,
            title: link ? link.textContent.trim() : null
          };
        }).filter(result => result.url);
      }, TARGET_DOMAIN);

      // Check if our domain is in the results
      for (const result of results) {
        if (result.url && new URL(result.url).hostname.includes(TARGET_DOMAIN)) {
          ranking = ((currentPage - 1) * RESULTS_PER_PAGE) + result.position;
          found = true;
          break;
        }
      }

      if (!found) {
        currentPage++;
        await wait(getRandomInt(2000, 5000));
      }
    } catch (err) {
      console.warn(`Error checking page ${currentPage} for "${keyword}": ${err.message}`);
      break;
    }
  }

  return ranking;
}

async function simulateSearch(index, proxy) {
  let browser;
  const keyword = getRandomKeyword();
  const sessionId = uuidv4();
  
  try {
    // Initialize proxy stats if not exists
    if (!stats.proxyStats[proxy]) {
      stats.proxyStats[proxy] = { successes: 0, failures: 0, lastUsed: 0 };
    }

    const userAgent = new UserAgent();
    browser = await puppeteer.launch({
      headless: HEADLESS,
      args: [
        `--proxy-server=${proxy}`,
        `--user-agent=${userAgent.toString()}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ],
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);
    await page.setViewport({
      width: getRandomInt(1024, 1920),
      height: getRandomInt(800, 1080),
      deviceScaleFactor: getRandomInt(1, 3)
    });

    // Set random headers
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
      'accept-encoding': 'gzip, deflate, br',
      'x-forwarded-for': `${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}`
    });

    // Random mouse movements
    await page.mouse.move(getRandomInt(0, 500), getRandomInt(0, 500));
    await wait(getRandomInt(500, 1500));

    // Check keyword ranking
    const ranking = await checkRanking(page, keyword);
    
    if (ranking !== null) {
      console.log(`[${index + 1}] 🏆 Ranking for "${keyword}": #${ranking} (Proxy: ${proxy})`);
      
      if (!stats.rankings[keyword]) {
        stats.rankings[keyword] = [];
      }
      stats.rankings[keyword].push({
        date: new Date().toISOString(),
        ranking: ranking,
        proxy: proxy,
        session: sessionId
      });
      stats.proxyStats[proxy].successes++;
      saveRankings();
    }

    // Simulate clicking on our result if found
    if (ranking && ranking <= 10) {
      const searchURL = `${SEARCH_ENGINE}${encodeURIComponent(keyword)}`;
      await page.goto(searchURL, { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      const linkSelector = `a[href*="${TARGET_DOMAIN}"]`;
      try {
        await page.waitForSelector(linkSelector, { timeout: 10000 });
        
        // Human-like interaction
        await wait(getRandomInt(1000, 3000));
        await page.hover(linkSelector);
        await wait(getRandomInt(500, 1500));
        await page.click(linkSelector, { 
          delay: getRandomInt(50, 200),
          button: getRandomInt(0, 1) === 0 ? 'left' : 'middle'
        });
        
        // Random behavior on target site
        await page.waitForNavigation({ 
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        
        await wait(getRandomInt(3000, 8000));
        await page.evaluate(() => {
          window.scrollBy(0, Math.random() * window.innerHeight * 3);
        });
        
        stats.foundAndClicked++;
        console.log(`[${index + 1}] ✅ Clicked: ${keyword} (Rank #${ranking})`);
      } catch (err) {
        console.warn(`[${index + 1}] Couldn't find link to click: ${err.message}`);
      }
    } else {
      console.log(`[${index + 1}] 🔍 Keyword "${keyword}" not found in top ${MAX_PAGES_TO_CHECK * RESULTS_PER_PAGE} results`);
    }

    stats.completed++;
    stats.proxyStats[proxy].lastUsed = Date.now();
    await wait(getRandomInt(3000, 7000));
  } catch (err) {
    stats.failed++;
    if (stats.proxyStats[proxy]) {
      stats.proxyStats[proxy].failures++;
    }
    console.error(`[${index + 1}] Error with proxy ${proxy}: ${err.message}`);
    throw err; // Rethrow for retry logic
  } finally {
    if (browser) await browser.close();
  }
}

async function simulateSearchWithRetry(index, proxy, retryCount = 0) {
  try {
    await simulateSearch(index, proxy);
  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      console.log(`[${index + 1}] Retry ${retryCount + 1}/${MAX_RETRIES} after error: ${err.message}`);
      await wait(REQUEST_DELAY * (retryCount + 1));
      return simulateSearchWithRetry(index, proxy, retryCount + 1);
    }
    throw err;
  }
}

async function runBulkSearch() {
  console.log('🚀 Starting Google ranking tracker...');
  
  let proxies = loadCachedProxies();
  console.log(`📦 Initially loaded ${proxies.length} cached proxies`);

  if (proxies.length < 10) { // Refresh if we have few proxies
    console.log("🔍 Fetching fresh proxies...");
    const freshProxies = await fetchProxies();
    console.log(`🌐 Found ${freshProxies.length} proxies, testing...`);
    const workingProxies = await filterWorkingProxies(freshProxies);
    proxies = [...new Set([...proxies, ...workingProxies])];
    saveWorkingProxies(proxies);
    console.log(`✅ Total working proxies: ${proxies.length}`);
  }

  if (!proxies.length) {
    console.error("❌ No working proxies found after refresh. Aborting.");
    return;
  }

  // Sort proxies by reliability (success rate)
  proxies.sort((a, b) => {
    const aStats = stats.proxyStats[a] || { successes: 0, failures: 1 };
    const bStats = stats.proxyStats[b] || { successes: 0, failures: 1 };
    const aScore = aStats.successes / (aStats.successes + aStats.failures);
    const bScore = bStats.successes / (bStats.successes + bStats.failures);
    return bScore - aScore;
  });

  const proxyRotator = createProxyRotator(proxies);
  const activeTasks = new Set();

  for (let i = 0; i < VISIT_COUNT; i++) {
    while (activeTasks.size >= MAX_CONCURRENT) {
      await wait(500);
    }

    const proxy = proxyRotator.next();
    const task = simulateSearchWithRetry(i, proxy)
      .catch(err => {
        console.error(`[${i + 1}] Final attempt failed: ${err.message}`);
        stats.failed++;
      })
      .finally(() => activeTasks.delete(task));
    
    activeTasks.add(task);
    await wait(DELAY_BETWEEN_LAUNCHES);
  }

  await Promise.all(activeTasks);

  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  console.log(`\n======== Final Stats ========
Total Searches:   ${VISIT_COUNT}
Found & Clicked:  ${stats.foundAndClicked}
Completed:        ${stats.completed}
Failed:           ${stats.failed}
Duration:         ${duration}s
Searches/min:     ${(stats.completed / duration * 60).toFixed(2)}
=============================
  `);

  // Print ranking summary
  console.log('\n=== Keyword Ranking Summary ===');
  Object.keys(stats.rankings).forEach(keyword => {
    const rankings = stats.rankings[keyword].map(r => r.ranking);
    const avgRank = (rankings.reduce((a, b) => a + b, 0) / rankings.length).toFixed(1);
    console.log(`"${keyword}": Avg. rank ${avgRank} (${rankings.length} samples)`);
  });

  // Print proxy performance
  console.log('\n=== Top Performing Proxies ===');
  const proxyList = Object.entries(stats.proxyStats)
    .sort(([,a], [,b]) => (b.successes || 0) - (a.successes || 0))
    .slice(0, 5);
  
  proxyList.forEach(([proxy, data]) => {
    const total = (data.successes || 0) + (data.failures || 0);
    const successRate = total > 0 ? ((data.successes || 0) / total * 100).toFixed(1) : 0;
    console.log(`${proxy}: ${successRate}% success (${data.successes || 0}/${total})`);
  });

  saveRankings();
}

runBulkSearch().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});