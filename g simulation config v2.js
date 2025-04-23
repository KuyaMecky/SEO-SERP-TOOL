// Configuration
const config = {
    domain: 'chinchincasinoapp.com',
    googleAnalyticsId: 'G-TMTRXWFJF8',
    simulationDuration: 60, // Duration in seconds
    visitsPerSecond: 15600, // Number of visits per second
    outputFrequency: 10, // Update console every X visits
    sendToGA: false,
    initialRankings: {
        'casino app': 12,
        'online casino': 22,
        'mobile gambling': 18,
        'real money casino': 25,
        'chin chin casino app': 1
    }
};

// Data sets
const keywordSets = {
    commercial: [
        'buy {product}', '{product} price', '{product} for sale', 
        'best {product} 2024', 'real money {product}', 'play {product} online'
    ],
    informational: [
        'what is {product}', 'how to use {product}', 
        '{product} guide', 'how to play {product}', 'is {product} legal'
    ],
    navigational: [
        '{brand} {product}', '{brand} official site', 
        '{domain} login', '{domain} contact'
    ]
};

const products = ['casino', 'chin chin casino app', 'gambling', 'poker', 'slots', 'betting', 'blackjack', 'roulette'];
const brands = ['ChinChin', 'Lucky', 'Golden', 'Royal', 'Diamond', 'Platinum', 'Jackpot'];
const referrers = [
    'google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com',
    'facebook.com', 'twitter.com', 'reddit.com', 'instagram.com'
];
// Page paths to simulate
const pagePaths = [
    '/', '/home', '/chin-chin-casino-promotions-find-out-which-rewards-suit-you-best', '/responsible-gaming', '/pgsoft-rtp', 
    '/chin-chin-casino-download-app-features-benefits', '/online-casino-table-games-top-games-and-providers', '/online-live-casino-games-top-providers-and-popular-picks', '/play-blueprint-gaming-at-chinchin-casino-high-rtp-big-wins', 
    '/play-blueprint-gaming-at-chinchin-casino-high-rtp-big-winss'
];

// State tracking
const keywordRankings = {...config.initialRankings};
const realtimeStats = {
    totalVisits: 0,
    activeVisitors: 0,
    visitsByCountry: {},
    visitsByDevice: {},
    topKeywords: {},
    currentRankings: {...config.initialRankings}
};

// Utility functions
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateKeyword() {
    const intent = getRandomElement(Object.keys(keywordSets));
    const template = getRandomElement(keywordSets[intent]);
    return template
        .replace('{product}', getRandomElement(products))
        .replace('{brand}', getRandomElement(brands))
        .replace('{domain}', config.domain.split('.')[0]);
}

function updateRanking(keyword) {
    if (!keywordRankings[keyword]) {
        keywordRankings[keyword] = getRandomInt(30, 50);
    }
    
    const currentRank = keywordRankings[keyword];
    let newRank = currentRank;
    
    // Ranking improvement algorithm
    if (Math.random() > 0.6) { // 40% chance of improvement
        newRank = Math.max(1, currentRank - getRandomInt(1, 3));
    } else if (Math.random() > 0.8) { // 20% chance of drop
        newRank = Math.min(100, currentRank + getRandomInt(1, 3));
    }
    
    keywordRankings[keyword] = newRank;
    return newRank;
}

// Simulate a single visit
function simulateVisit() {
    const isOrganic = Math.random() > 0.3;
    const referrer = isOrganic 
        ? getRandomElement(referrers.filter(r => ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com'].includes(r)))
        : getRandomElement(referrers);
    
    const keyword = isOrganic ? generateKeyword() : null;
    const rank = keyword ? updateRanking(keyword) : null;
    const country = getRandomElement(['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'IN', 'JP', 'BR']);
    const device = getRandomElement(['desktop', 'mobile', 'tablet']);
    const pagePath = getRandomElement(pagePaths);
    const sessionDuration = getRandomInt(10, 600);

    // Update realtime stats
    realtimeStats.totalVisits++;
    realtimeStats.activeVisitors++;
    
    // Track visits by country
    realtimeStats.visitsByCountry[country] = (realtimeStats.visitsByCountry[country] || 0) + 1;
    
    // Track visits by device
    realtimeStats.visitsByDevice[device] = (realtimeStats.visitsByDevice[device] || 0) + 1;
    
    // Track top keywords
    if (keyword) {
        realtimeStats.topKeywords[keyword] = (realtimeStats.topKeywords[keyword] || 0) + 1;
        realtimeStats.currentRankings[keyword] = rank;
    }

    // Simulate session duration
    setTimeout(() => {
        realtimeStats.activeVisitors--;
    }, sessionDuration * 1000);

    return {
        timestamp: new Date().toISOString(),
        referrer,
        keyword,
        rank,
        country,
        device,
        pagePath,
        sessionDuration
    };
}

// Display realtime dashboard
function displayDashboard() {
    console.clear();
    console.log(`=== REAL-TIME TRAFFIC SIMULATION ===`);
    console.log(`Domain: ${config.domain}`);
    console.log(`Running for: ${Math.floor(realtimeStats.totalVisits / config.visitsPerSecond)}s`);
    console.log(`\n[LIVE STATS]`);
    console.log(`Total Visits: ${realtimeStats.totalVisits}`);
    console.log(`Active Visitors: ${realtimeStats.activeVisitors}`);
    
    // Show top countries
    console.log(`\n[TOP COUNTRIES]`);
    Object.entries(realtimeStats.visitsByCountry)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([country, count]) => console.log(`${country}: ${count} visits`));
    
    // Show device distribution
    console.log(`\n[DEVICE DISTRIBUTION]`);
    Object.entries(realtimeStats.visitsByDevice)
        .forEach(([device, count]) => {
            const percentage = (count / realtimeStats.totalVisits * 100).toFixed(1);
            console.log(`${device}: ${percentage}%`);
        });
    
    // Show top performing keywords
    console.log(`\n[TOP KEYWORDS]`);
    Object.entries(realtimeStats.topKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([keyword, count]) => {
            const rank = realtimeStats.currentRankings[keyword] || 'N/A';
            console.log(`"${keyword}" - ${count} visits (Rank: ${rank})`);
        });
    
    // Show ranking changes
    console.log(`\n[RANKING CHANGES]`);
    Object.entries(realtimeStats.currentRankings)
        .filter(([keyword]) => config.initialRankings[keyword])
        .forEach(([keyword, currentRank]) => {
            const initialRank = config.initialRankings[keyword];
            const change = initialRank - currentRank;
            const trend = change > 0 ? '↑' : change < 0 ? '↓' : '→';
            console.log(`${keyword}: ${currentRank} (${trend} ${Math.abs(change)})`);
        });
}

// Main simulation loop
async function runSimulation() {
    console.log(`Starting real-time simulation for ${config.domain}`);
    console.log(`Simulating ${config.visitsPerSecond} visits per second for ${config.simulationDuration} seconds`);
    
    const interval = setInterval(() => {
        for (let i = 0; i < config.visitsPerSecond; i++) {
            simulateVisit();
            if (realtimeStats.totalVisits % config.outputFrequency === 0) {
                displayDashboard();
            }
        }
    }, 1000);
    
    // Stop after duration
    setTimeout(() => {
        clearInterval(interval);
        console.log('\nSimulation complete! Final stats:');
        displayDashboard();
    }, config.simulationDuration * 1000);
}

// Start the simulation
runSimulation();