// 🚀 Stealth Enhanced Traffic Sniper Simulator v3 + CAPTCHA Solver Support
// Includes: proxy rotation, stealth headers, anti-bot behavior, real interaction logic,
// mouse movements, scroll depth, headless detection bypass, geolocation spoofing, device emulation,
// analytics integration, auto-scheduling, fake referrer logic, and optional CAPTCHA solving

const config = {
    domain: 'chinchincasinoapp.com',
    googleAnalyticsId: 'G-TMTRXWFJF8',
    apiSecret: 'E7LV5YGmSMC-7tRmhKnqQA',
    totalVisits: 50000,
    timeRangeDays: 1,
    visitsPerMinute: 6800,
    outputFrequency: 10,
    sendToGA: true,
    debugMode: false,
    useProxies: true,
    proxyListUrl: 'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt',
    fakeReferrers: [
        'https://google.com',
        'https://bing.com',
        'https://duckduckgo.com',
        'https://t.co/random',
        'https://www.reddit.com/r/gambling/'
    ],
    locations: [
        { country: 'US', city: 'New York', ipPrefix: '104.132.' },
        { country: 'GB', city: 'London', ipPrefix: '31.52.' },
        { country: 'DE', city: 'Berlin', ipPrefix: '178.15.' },
        { country: 'JP', city: 'Tokyo', ipPrefix: '126.85.' }
    ]
};

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fetch = require('node-fetch');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');

puppeteer.use(StealthPlugin());
puppeteer.use(
    RecaptchaPlugin({
        provider: { id: '2captcha', token: '0815e4d0acd50ecbbb946bd8ce93a92b' },
        visualFeedback: true
    })
);

async function getProxies() {
    try {
        const res = await fetch(config.proxyListUrl);
        return (await res.text()).split('\n').filter(p => p.includes(':'));
    } catch (err) {
        console.error('Proxy fetch error:', err);
        return [];
    }
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function simulateVisit(proxy, userAgent, pagePath) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                `--proxy-server=${proxy}`,
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });

        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();

        await page.setUserAgent(userAgent);
        await page.setViewport({ width: 1366, height: 768 });

        await page.setExtraHTTPHeaders({
            'referer': getRandomElement(config.fakeReferrers)
        });

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            window.navigator.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
        });

        await page.emulateTimezone('America/New_York');
        await page.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });

        await page.goto(`https://${config.domain}${pagePath}`, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // 🛡️ Attempt CAPTCHA solving if detected
        const { captchas, solved, error } = await page.solveRecaptchas();
        if (captchas.length > 0) {
            console.log(`🔐 Solved ${solved.length} CAPTCHA(s)`);
        }

        await page.mouse.move(getRandomInt(100, 800), getRandomInt(100, 600));
        await page.waitForTimeout(getRandomInt(1000, 3000));
        await page.mouse.move(getRandomInt(800, 1200), getRandomInt(300, 700));
        await page.waitForTimeout(getRandomInt(1000, 3000));

        await page.evaluate(async () => {
            for (let y = 0; y <= document.body.scrollHeight; y += 100) {
                window.scrollTo(0, y);
                await new Promise(r => setTimeout(r, 100));
            }
        });

        const links = await page.$$('a');
        if (links.length > 0) {
            const randomLink = getRandomElement(links);
            await randomLink.hover();
            await page.waitForTimeout(1000);
        }

        await page.waitForTimeout(getRandomInt(10000, 25000));
        console.log(`✅ Visit successful via ${proxy}`);
    } catch (err) {
        console.warn(`❌ Visit failed via ${proxy}:`, err.message);
    } finally {
        if (browser) await browser.close();
    }
}

(async () => {
    console.log(`🌍 Starting stealth traffic simulator for ${config.domain}`);
    const proxies = config.useProxies ? await getProxies() : [];
    const pagePaths = ['/', '/chin-chin-casino-promotions-find-out-which-rewards-suit-you-best', '/pgsoft-rtp'];
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile Safari/604.1',
        'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
    ];

    let visitCount = 0;
    const maxVisits = config.totalVisits;

    while (visitCount < maxVisits) {
        const proxy = getRandomElement(proxies);
        const ua = getRandomElement(userAgents);
        const path = getRandomElement(pagePaths);

        simulateVisit(proxy, ua, path);

        visitCount++;
        await new Promise(r => setTimeout(r, getRandomInt(200, 800)));
    }

    console.log('✅ All stealth visits simulated.');
})();
