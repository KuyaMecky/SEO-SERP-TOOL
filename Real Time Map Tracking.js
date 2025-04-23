// Enhanced Configuration with Location Tracking
const config = {
    domain: 'chinchincasinoapp.com',
    googleAnalyticsId: 'G-TMTRXWFJF8',
    apiSecret: 'E7LV5YGmSMC-7tRmhKnqQA', // Replace with your actual secret
    totalVisits: 500000, // Reduced for testing
    timeRangeDays: 1,
    visitsPerMinute: 9850, // Optimal rate for testing
    outputFrequency: 10,
    sendToGA: true,
    debugMode: true, // Set to true to see payloads without sending

    // Enhanced location data with coordinates
    locations: [
        {
            country: 'United States',
            region: 'California',
            city: 'San Francisco',
            latitude: 37.7749,
            longitude: -122.4194,
            ipPrefix: '104.132.'
        },
        {
            country: 'United Kingdom',
            region: 'England',
            city: 'London',
            latitude: 51.5074,
            longitude: -0.1278,
            ipPrefix: '31.52.'
        },
        {
            country: 'Germany',
            region: 'Berlin',
            city: 'Berlin',
            latitude: 52.5200,
            longitude: 13.4050,
            ipPrefix: '178.15.'
        },
        {
            country: 'Japan',
            region: 'Tokyo',
            city: 'Tokyo',
            latitude: 35.6762,
            longitude: 139.6503,
            ipPrefix: '126.85.'
        }
    ],

    initialRankings: {
        'casino app': 12,
        'online casino': 22,
        'mobile gambling': 18,
        'real money casino': 25,
        'chin chin casino app': 1,
        'chinchin casino': 1
    }
};

// Enhanced Device Modeling
const devices = {
    desktop: [
        {
            model: 'Windows PC',
            platform: 'Windows',
            ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    ],
    mobile: [
        {
            model: 'iPhone',
            platform: 'iOS',
            ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
        }
    ]
};

// Common keyword sets
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

const products = ['casino', 'gambling', 'poker', 'slots', 'betting', 'blackjack', 'roulette'];
const brands = ['ChinChin', 'Lucky', 'Golden', 'Royal', 'Diamond', 'Platinum', 'Jackpot'];
const referrers = ['google.com', 'bing.com', 'facebook.com', 'twitter.com'];
const pagePaths = [
    '/', '/chin-chin-casino-promotions-find-out-which-rewards-suit-you-best', 
    '/pgsoft-rtp', '/chin-chin-casino-download-app-features-benefits'
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
        .replace('{domain}', config.domain.split('.')[0]);
}

// Generate realistic IP address for location
function generateIP(location) {
    return location.ipPrefix + 
           Math.floor(Math.random() * 255) + '.' + 
           Math.floor(Math.random() * 255);
}

// Track keyword rankings
const keywordRankings = {...config.initialRankings};

function updateRankings(keyword) {
    if (!keyword) return;
    
    if (!keywordRankings[keyword]) {
        keywordRankings[keyword] = getRandomInt(30, 50);
    }
    
    const currentRank = keywordRankings[keyword];
    let newRank = currentRank + getRandomInt(-3, 3);
    newRank = Math.max(1, Math.min(100, newRank));
    
    if (Math.random() > 0.7) {
        newRank = Math.max(1, currentRank - getRandomInt(1, 3));
    }
    
    keywordRankings[keyword] = newRank;
    return newRank;
}

// Generate traffic data with enhanced location info
function generateTrafficData() {
    const now = new Date();
    const startDate = new Date(now.getTime() - (config.timeRangeDays * 24 * 60 * 60 * 1000));
    const trafficData = [];
    
    for (let i = 0; i < config.totalVisits; i++) {
        if (i % config.outputFrequency === 0) {
            console.log(`Generating visit ${i + 1} of ${config.totalVisits}`);
        }
        
        const location = config.locations[i % config.locations.length];
        const isOrganic = Math.random() > 0.3;
        const referrer = isOrganic 
            ? getRandomElement(referrers.filter(r => ['google.com', 'bing.com'].includes(r)))
            : getRandomElement(referrers);
        const deviceType = getRandomElement(Object.keys(devices));
        const deviceInfo = getRandomElement(devices[deviceType]);
        
        trafficData.push({
            timestamp: Math.floor(Date.now() / 1000),
            date: new Date().toISOString().split('T')[0],
            referrer: referrer,
            keyword: isOrganic ? generateKeyword() : null,
            keywordRank: isOrganic ? updateRankings(generateKeyword()) : null,
            pagePath: getRandomElement(pagePaths),
            isNewVisitor: Math.random() > 0.7,
            sessionDuration: getRandomInt(10, 300),
            device: deviceType,
            deviceInfo: deviceInfo,
            location: location,
            ipAddress: generateIP(location)
        });
    }
    
    return trafficData;
}

// Enhanced GA4 sender with location tracking
async function sendToGoogleAnalytics(data) {
    if (!config.sendToGA && !config.debugMode) return;

    const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${config.googleAnalyticsId}&api_secret=${config.apiSecret}`;
    
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
                // Enhanced location parameters
                geo_id: data.location.country,
                country: data.location.country,
                region: data.location.region,
                city: data.location.city,
                // IP override is CRUCIAL for map dots
                ip_override: data.ipAddress,
                // Enhanced device parameters
                device_model: data.deviceInfo.model,
                platform: data.deviceInfo.platform,
                device_category: data.device,
                user_agent: data.deviceInfo.ua,
                // Keyword ranking
                keyword_rank: data.keywordRank
            }
        }]
    };

    if (config.debugMode) {
        console.log('[DEBUG] Event payload:', JSON.stringify(eventData, null, 2));
        return;
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': data.deviceInfo.ua
            },
            body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
            console.error('GA Error:', response.status, await response.text());
        } else {
            console.log(`📍 Sent visitor from ${data.location.city}, ${data.location.country}`);
        }
    } catch (error) {
        console.error('GA Network Error:', error);
    }
}

// SIMULATE AHREFS DATA
function simulateAhrefsData(trafficData) {
    const keywordData = {};
    
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
            
            if (visit.keywordRank) {
                keywordData[visit.keyword].rankingHistory.push({
                    date: visit.date,
                    rank: visit.keywordRank
                });
            }
        }
    });
    
    console.log('\nAhrefs-like Keyword Data (Top 10):');
    console.log('---------------------------------');
    Object.entries(keywordData)
        .sort((a, b) => b[1].trafficPotential - a[1].trafficPotential)
        .slice(0, 10)
        .forEach(([keyword, data]) => {
            const latestRank = data.rankingHistory.length > 0 
                ? data.rankingHistory[data.rankingHistory.length - 1].rank 
                : 'N/A';
                
            console.log(`Keyword: "${keyword}"`);
            console.log(`  Current Rank: ${latestRank}`);
            console.log(`  Visits: ${data.count}`);
            console.log(`  Traffic Potential: ${data.trafficPotential}`);
            console.log('---');
        });
}

// MAIN EXECUTION
(async function main() {
    console.log(`Starting enhanced traffic simulation for ${config.domain}`);
    console.log(`This version will show dots on your GA4 real-time map`);
    
    const trafficData = generateTrafficData();

    console.log('\nSending traffic to Google Analytics...');
    
    const batchSize = 5; // Smaller batches for better real-time tracking
    for (let i = 0; i < trafficData.length; i += batchSize) {
        const batch = trafficData.slice(i, i + batchSize);
        await Promise.all(batch.map(visit => sendToGoogleAnalytics(visit)));
        
        // Throttle requests to avoid rate limiting
        // await new Promise(resolve => setTimeout(resolve, 1000));
        await new Promise(resolve => setTimeout(resolve, getRandomInt(800, 1500)));
        
        if (i % (batchSize * 10) === 0) {
            console.log(`Sent ${Math.min(i + batchSize, trafficData.length)} of ${trafficData.length} visits`);
        }
    }

    simulateAhrefsData(trafficData);

    console.log('\nSimulation complete!');
    console.log('Check your GA4 Real-Time report now:');
    console.log('1. Open Reports → Realtime → Locations');
    console.log('2. Wait 1-2 minutes for dots to appear on the map');
    console.log('3. Verify cities appear in the location table');
})();