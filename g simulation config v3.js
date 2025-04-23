// Configuration
const config = {
    domain: 'chinchincasinoapp.com',
    googleAnalyticsId: 'G-TMTRXWFJF8',
    apiSecret: 'E7LV5YGmSMC-7tRmhKnqQA', // Get from GA4 Admin > Data Streams > Measurement Protocol
    simulationDuration: 300, // Duration in seconds (5 minutes)
    visitsPerMinute: 30, // Visits per minute (0.5 visits/second)
    sendToGA: true, // Set to true to actually send to Google Analytics
    debugMode: true, // Shows detailed logs of what would be sent
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
const pagePaths = [
    '/', '/home', '/chin-chin-casino-promotions-find-out-which-rewards-suit-you-best', '/responsible-gaming', '/pgsoft-rtp', 
    '/chin-chin-casino-download-app-features-benefits', '/online-casino-table-games-top-games-and-providers', '/online-live-casino-games-top-providers-and-popular-picks', '/play-blueprint-gaming-at-chinchin-casino-high-rtp-big-wins', 
    '/play-blueprint-gaming-at-chinchin-casino-high-rtp-big-winss'
];
const citiesByCountry = {
    US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
    UK: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Glasgow'],
    CA: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa'],
    AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    DE: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt'],
    FR: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'],
    IN: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'],
    JP: ['Tokyo', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka'],
    BR: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza']
};

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
    
    if (Math.random() > 0.6) {
        newRank = Math.max(1, currentRank - getRandomInt(1, 3));
    } else if (Math.random() > 0.8) {
        newRank = Math.min(100, currentRank + getRandomInt(1, 3));
    }
    
    keywordRankings[keyword] = newRank;
    return newRank;
}

// Generate a realistic client ID (mimics actual GA client IDs)
function generateClientId() {
    const randomPart1 = Math.floor(Math.random() * 2147483647).toString();
    const randomPart2 = Math.floor(Date.now() / 1000).toString();
    return `${randomPart1}.${randomPart2}`;
}

// Send event to Google Analytics
async function sendGAEvent(eventData) {
    const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${config.googleAnalyticsId}&api_secret=${config.apiSecret}`;
    
    try {
        if (config.debugMode) {
            console.log('[DEBUG] Would send to GA:', JSON.stringify(eventData, null, 2));
            return { status: 'simulated' };
        }

        if (!config.sendToGA) {
            return { status: 'disabled' };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
            console.error('GA Error:', response.status, await response.text());
            return { status: 'error' };
        }
        
        return { status: 'success' };
    } catch (error) {
        console.error('GA Network Error:', error);
        return { status: 'error' };
    }
}

// Simulate a complete visitor session
async function simulateVisitor() {
    const isOrganic = Math.random() > 0.3;
    const referrer = isOrganic 
        ? getRandomElement(referrers.filter(r => ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com'].includes(r)))
        : getRandomElement(referrers);
    
    const keyword = isOrganic ? generateKeyword() : null;
    const rank = keyword ? updateRanking(keyword) : null;
    const country = getRandomElement(Object.keys(citiesByCountry));
    const city = getRandomElement(citiesByCountry[country]);
    const device = getRandomElement(['desktop', 'mobile', 'tablet']);
    const pagePath = getRandomElement(pagePaths);
    const sessionDuration = getRandomInt(10, 600);
    const clientId = generateClientId();
    const userId = Math.random() > 0.7 ? `user_${getRandomInt(1000, 9999)}` : undefined;
    const timestamp = new Date();

    // Update realtime stats
    realtimeStats.totalVisits++;
    realtimeStats.activeVisitors++;
    realtimeStats.visitsByCountry[country] = (realtimeStats.visitsByCountry[country] || 0) + 1;
    realtimeStats.visitsByDevice[device] = (realtimeStats.visitsByDevice[device] || 0) + 1;
    
    if (keyword) {
        realtimeStats.topKeywords[keyword] = (realtimeStats.topKeywords[keyword] || 0) + 1;
        realtimeStats.currentRankings[keyword] = rank;
    }

    // Create page_view event
    const pageViewEvent = {
        client_id: clientId,
        user_id: userId,
        timestamp_micros: Math.floor(timestamp.getTime() * 1000),
        events: [{
            name: 'page_view',
            params: {
                page_title: pagePath,
                page_location: `https://${config.domain}${pagePath}`,
                page_referrer: `https://${referrer}/`,
                engagement_time_msec: sessionDuration * 1000,
                source: referrer,
                medium: isOrganic ? 'organic' : 'referral',
                term: keyword,
                country: country,
                city: city,
                device: device,
                keyword_rank: rank
            }
        }]
    };

    // Send initial page view
    const result = await sendGAEvent(pageViewEvent);
    
    if (result.status === 'success' || config.debugMode) {
        console.log(`[${timestamp.toLocaleTimeString()}] New visitor from ${country} (${city}) - ${device} - ${pagePath}${keyword ? ` via "${keyword}"` : ''}`);
    }

    // Simulate additional interactions during session
    if (Math.random() > 0.5) {
        const additionalPages = getRandomInt(1, 3);
        for (let i = 0; i < additionalPages; i++) {
            const additionalPagePath = getRandomElement(pagePaths.filter(p => p !== pagePath));
            const additionalTime = getRandomInt(5, 30);
            
            await new Promise(resolve => setTimeout(resolve, additionalTime * 1000));
            
            const additionalEvent = {
                client_id: clientId,
                user_id: userId,
                timestamp_micros: Math.floor((Date.now() + additionalTime * 1000) * 1000),
                events: [{
                    name: 'page_view',
                    params: {
                        page_title: additionalPagePath,
                        page_location: `https://${config.domain}${additionalPagePath}`,
                        engagement_time_msec: additionalTime * 1000,
                        source: referrer,
                        medium: isOrganic ? 'organic' : 'referral',
                        country: country,
                        city: city,
                        device: device
                    }
                }]
            };
            
            await sendGAEvent(additionalEvent);
            
            if (result.status === 'success' || config.debugMode) {
                console.log(`[${new Date().toLocaleTimeString()}] Visitor navigated to ${additionalPagePath}`);
            }
        }
    }

    // End session
    setTimeout(() => {
        realtimeStats.activeVisitors--;
    }, sessionDuration * 1000);
}

// Display dashboard
function displayDashboard() {
    console.clear();
    console.log(`=== REAL-TIME GA TRAFFIC SIMULATION ===`);
    console.log(`Domain: ${config.domain} | GA ID: ${config.googleAnalyticsId}`);
    console.log(`Running for: ${Math.floor(realtimeStats.totalVisits / (config.visitsPerMinute/60))}s`);
    console.log(`\n[LIVE STATS]`);
    console.log(`Total Visits: ${realtimeStats.totalVisits}`);
    console.log(`Active Visitors: ${realtimeStats.activeVisitors}`);
    
    console.log(`\n[TOP COUNTRIES]`);
    Object.entries(realtimeStats.visitsByCountry)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([country, count]) => console.log(`${country}: ${count} visits`));
    
    console.log(`\n[DEVICE DISTRIBUTION]`);
    Object.entries(realtimeStats.visitsByDevice)
        .forEach(([device, count]) => {
            const percentage = (count / realtimeStats.totalVisits * 100).toFixed(1);
            console.log(`${device}: ${percentage}%`);
        });
    
    console.log(`\n[TOP KEYWORDS]`);
    Object.entries(realtimeStats.topKeywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([keyword, count]) => {
            const rank = realtimeStats.currentRankings[keyword] || 'N/A';
            console.log(`"${keyword}" - ${count} visits (Rank: ${rank})`);
        });
}

// Main simulation loop
async function runSimulation() {
    console.log(`Starting real-time GA simulation for ${config.domain}`);
    console.log(`Sending ${config.visitsPerMinute} visits per minute to GA4 property ${config.googleAnalyticsId}`);
    console.log(`Simulation will run for ${config.simulationDuration} seconds`);
    console.log(config.sendToGA ? 'Actually sending to Google Analytics' : 'Running in debug mode (not sending)');
    
    const visitsPerSecond = config.visitsPerMinute / 60;
    const visitInterval = 1000 / visitsPerSecond;
    
    let lastDashboardUpdate = 0;
    const dashboardUpdateInterval = 5000; // Update dashboard every 5 seconds
    
    const simulationStart = Date.now();
    const simulationEnd = simulationStart + (config.simulationDuration * 1000);
    
    while (Date.now() < simulationEnd) {
        await simulateVisitor();
        
        if (Date.now() - lastDashboardUpdate > dashboardUpdateInterval) {
            displayDashboard();
            lastDashboardUpdate = Date.now();
        }
        
        // Adjust timing to maintain visit rate
        const nextVisitDelay = Math.max(0, visitInterval - (Math.random() * visitInterval / 2));
        await new Promise(resolve => setTimeout(resolve, nextVisitDelay));
    }
    
    console.log('\nSimulation complete! Final stats:');
    displayDashboard();
}

// Start the simulation
runSimulation().catch(console.error);