// Configuration - customize these values
const config = {
    domain: 'chinchincasinoapp.com', // Removed https:// and trailing slash for consistency
    googleAnalyticsId: 'G-TMTRXWFJF8', // Your GA4 Measurement ID
    totalVisits: 150500, // Total visits to simulate (reduce for testing)
    timeRangeDays: 7, // Time period to distribute visits over
    outputFrequency: 50, // How often to log progress
    sendToGA: true, // Set to true to actually send to Google Analytics
    initialRankings: {
        'casino app': 12,
        'online casino': 22,
        'mobile gambling': 18,
        'real money casino': 25,
        'chin chin casino app': 1,
        'chinchin casino': 1
    }
};

// Common keyword sets with different intents
const keywordSets = {
    commercial: [
        'buy {product}', '{product} price', '{product} for sale', 
        'best {product} 2025', 'real money {product}'
    ],
    informational: [
        'what is {product}', 'how to use {product}', 
        '{product} guide', '{product} tutorial'
    ],
    navigational: [
        '{brand} {product}', '{brand} official site', 
        '{domain} login', '{domain} contact'
    ]
};

// Products/brands to use in keyword templates
const products = ['casino', 'gambling', 'poker', 'slots', 'betting', 'blackjack', 'roulette'];
const brands = ['ChinChin', 'Lucky', 'Golden', 'Royal', 'Diamond', 'Platinum', 'Jackpot'];

// Referrer domains to simulate
const referrers = [
    'google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com',
    'facebook.com', 'twitter.com', 'reddit.com', 'linkedin.com'
];

// Page paths to simulate
const pagePaths = [
    '/', '/chin-chin-casino-promotions-find-out-which-rewards-suit-you-best', '/pgsoft-rtp', 
    '/chin-chin-casino-download-app-features-benefits', '/online-casino-table-games-top-games-and-providers', '/online-live-casino-games-top-providers-and-popular-picks', '/play-blueprint-gaming-at-chinchin-casino-high-rtp-big-wins', 
    '/play-blueprint-gaming-at-chinchin-casino-high-rtp-big-winss'
];

// UTILITY FUNCTIONS

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(startDate, endDate) {
    return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

function generateKeyword() {
    const intent = getRandomElement(Object.keys(keywordSets));
    const template = getRandomElement(keywordSets[intent]);
    
    return template
        .replace('{product}', getRandomElement(products))
        .replace('{brand}', getRandomElement(brands))
        .replace('{domain}', config.domain.split('.')[0]); // Use just the name part
}

// Track keyword rankings over time
const keywordRankings = {...config.initialRankings};

function updateRankings(keyword) {
    if (!keyword) return;
    
    // Initialize ranking if not exists
    if (!keywordRankings[keyword]) {
        keywordRankings[keyword] = getRandomInt(30, 50); // Start with poor ranking
    }
    
    // Simulate ranking improvement based on traffic
    const currentRank = keywordRankings[keyword];
    const rankChange = getRandomInt(-3, 3); // Small random fluctuation
    
    // Apply change with some constraints
    let newRank = currentRank + rankChange;
    newRank = Math.max(1, Math.min(100, newRank)); // Keep between 1-100
    
    // More likely to improve if getting traffic
    if (Math.random() > 0.7) {
        newRank = Math.max(1, currentRank - getRandomInt(1, 3));
    }
    
    keywordRankings[keyword] = newRank;
    return newRank;
}

function generateTrafficData() {
    const now = new Date();
    const startDate = new Date(now.getTime() - (config.timeRangeDays * 24 * 60 * 60 * 1000));
    
    const trafficData = [];
    
    for (let i = 0; i < config.totalVisits; i++) {
        if (i % config.outputFrequency === 0) {
            console.log(`Generating visit ${i + 1} of ${config.totalVisits}`);
        }
        
        const isOrganic = Math.random() > 0.3; // 70% chance of organic traffic
        const referrer = isOrganic 
            ? getRandomElement(referrers.filter(r => ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com'].includes(r)))
            : getRandomElement(referrers);
        
        const keyword = isOrganic ? generateKeyword() : null;
        const visitDate = getRandomDate(startDate, now);
        
        // Update rankings for this keyword
        const currentRank = keyword ? updateRankings(keyword) : null;
        
        trafficData.push({
            timestamp: Math.floor(visitDate.getTime() / 1000), // Unix timestamp
            date: visitDate.toISOString().split('T')[0], // YYYY-MM-DD
            referrer: referrer,
            keyword: keyword,
            keywordRank: currentRank,
            pagePath: getRandomElement(pagePaths),
            isNewVisitor: Math.random() > 0.7, // 30% new visitors
            sessionDuration: getRandomInt(10, 600), // seconds
            device: getRandomElement(['desktop', 'mobile', 'tablet']),
            country: getRandomElement(['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'IN', 'JP', 'BR']),
        });
    }
    
    return trafficData;
}

// SEND TO GOOGLE ANALYTICS 4
async function sendToGoogleAnalytics(data) {
    if (!config.sendToGA) {
        console.log(`[GA Simulation] Would send: ${data.pagePath} from ${data.referrer}${data.keyword ? ` with keyword "${data.keyword}" (Rank: ${data.keywordRank})` : ''}`);
        return;
    }

    const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${config.googleAnalyticsId}&api_secret=E7LV5YGmSMC-7tRmhKnqQA`;
    
    const eventData = {
        client_id: `simulated_${Math.floor(Math.random() * 1000000)}`,
        user_id: data.isNewVisitor ? undefined : `user_${Math.floor(Math.random() * 10000)}`,
        timestamp_micros: data.timestamp * 1000000,
        events: [{
            name: 'page_view',
            params: {
                page_title: data.pagePath,
                page_location: `https://${config.domain}${data.pagePath}`,
                page_referrer: `https://${data.referrer}/`,
                engagement_time_msec: data.sessionDuration * 1000,
                source: data.referrer,
                medium: data.keyword ? 'organic' : 'referral',
                term: data.keyword,
                country: data.country,
                device: data.device,
                keyword_rank: data.keywordRank // Custom dimension for ranking
            }
        }]
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
            console.error('GA Error:', response.status, await response.text());
        } else {
            console.log('GA Success:', data.pagePath);
        }
    } catch (error) {
        console.error('GA Network Error:', error);
    }
}

// SIMULATE AHREFS DATA WITH RANKING TRENDS
function simulateAhrefsData(trafficData) {
    const keywordData = {};
    
    // Aggregate keyword data with ranking history
    trafficData.forEach(visit => {
        if (visit.keyword) {
            if (!keywordData[visit.keyword]) {
                keywordData[visit.keyword] = {
                    count: 0,
                    positions: [],
                    ctr: Math.random() * 0.1,
                    trafficPotential: getRandomInt(10, 5000),
                    rankingHistory: []
                };
            }
            keywordData[visit.keyword].count++;
            
            // Record ranking history
            if (visit.keywordRank) {
                keywordData[visit.keyword].rankingHistory.push({
                    date: visit.date,
                    rank: visit.keywordRank
                });
            }
        }
    });
    
    console.log('\nAhrefs-like Keyword Data with Ranking Trends (Top 10):');
    console.log('---------------------------------------------------');
    
    // Sort by traffic potential and show top 10
    Object.entries(keywordData)
        .sort((a, b) => b[1].trafficPotential - a[1].trafficPotential)
        .slice(0, 10)
        .forEach(([keyword, data]) => {
            const latestRank = data.rankingHistory.length > 0 
                ? data.rankingHistory[data.rankingHistory.length - 1].rank 
                : 'N/A';
                
            const bestRank = data.rankingHistory.reduce((min, entry) => 
                entry.rank < min ? entry.rank : min, 100);
                
            console.log(`Keyword: "${keyword}"`);
            console.log(`  Current Rank: ${latestRank}`);
            console.log(`  Best Rank: ${bestRank}`);
            console.log(`  Visits: ${data.count}`);
            console.log(`  Traffic Potential: ${data.trafficPotential}`);
            console.log(`  Estimated CTR: ${(data.ctr * 100).toFixed(2)}%`);
            
            // Show ranking trend if we have history
            if (data.rankingHistory.length > 1) {
                const firstRank = data.rankingHistory[0].rank;
                const trend = firstRank - latestRank;
                console.log(`  Ranking Trend: ${trend > 0 ? '↑ Improved' : trend < 0 ? '↓ Declined' : '↔ Stable'} (${Math.abs(trend)} positions)`);
            }
            
            console.log('---');
        });
    
    // Show ranking distribution
    console.log('\nDomain Ranking Distribution:');
    console.log('---------------------------');
    const rankingCounts = {};
    Object.values(keywordData).forEach(data => {
        if (data.rankingHistory.length > 0) {
            const latest = data.rankingHistory[data.rankingHistory.length - 1].rank;
            const range = Math.floor(latest / 10) * 10;
            const rangeKey = `${range + 1}-${range + 10}`;
            rankingCounts[rangeKey] = (rankingCounts[rangeKey] || 0) + 1;
        }
    });
    
    Object.entries(rankingCounts)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .forEach(([range, count]) => {
            console.log(`Rank ${range}: ${count} keywords`);
        });
}

// MAIN EXECUTION
(async function main() {
    console.log(`Starting traffic simulation for ${config.domain}`);
    console.log(`Time range: Last ${config.timeRangeDays} days`);
    console.log(`Total visits to simulate: ${config.totalVisits}`);
    console.log(config.sendToGA ? 'Will actually send to Google Analytics' : 'Running in simulation mode only');
    
    const trafficData = generateTrafficData();

    console.log('\nProcessing traffic data...');
    
    // Process traffic in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < trafficData.length; i += batchSize) {
        const batch = trafficData.slice(i, i + batchSize);
        await Promise.all(batch.map(visit => sendToGoogleAnalytics(visit)));
        
        if (i % (batchSize * 10) === 0) {
            console.log(`Processed ${Math.min(i + batchSize, trafficData.length)} of ${trafficData.length} visits`);
        }
    }

    simulateAhrefsData(trafficData);

    console.log('\nSimulation complete!');
    console.log('To actually send data to Google Analytics:');
    console.log('1. Set "sendToGA: true" in the config');
    console.log('2. Add your Measurement Protocol API secret');
})();