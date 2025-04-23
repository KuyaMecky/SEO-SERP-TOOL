// Enhanced Configuration
const config = {
    domain: 'chinchincasinoapp.com',
    googleAnalyticsId: 'G-TMTRXWFJF8',
    apiSecret: 'E7LV5YGmSMC-7tRmhKnqQA',
    totalVisits: 555500, // Reduced for testing
    timeRangeDays: 7,
    outputFrequency: 50,
    sendToGA: true,
    debugMode: false,
    initialRankings: {
        'casino app': 12,
        'online casino': 22,
        'mobile gambling': 18,
        'real money casino': 25,
        'chin chin casino app': 1,
        'chinchin casino': 1
    }
};

// Enhanced Geographic Data
const geoData = {
    US: { 
        regions: ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania'],
        cities: ['Los Angeles', 'Houston', 'Miami', 'New York', 'Philadelphia']
    },
    UK: {
        regions: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
        cities: ['London', 'Manchester', 'Birmingham', 'Glasgow']
    },
    CA: {
        regions: ['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
        cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary']
    },
    AU: {
        regions: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia'],
        cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth']
    },
    DE: {
        regions: ['Berlin', 'Bavaria', 'Hamburg', 'North Rhine-Westphalia'],
        cities: ['Berlin', 'Munich', 'Hamburg', 'Cologne']
    }
};

// Enhanced Device Modeling
const devices = {
    desktop: [
        {model: 'Windows', platform: 'Win32', ua: 'Mozilla/5.0 (Windows NT 10.0)'},
        {model: 'Macintosh', platform: 'MacIntel', ua: 'Mozilla/5.0 (Macintosh)'}
    ],
    mobile: [
        {model: 'iPhone', platform: 'iPhone', ua: 'Mozilla/5.0 (iPhone)'},
        {model: 'Samsung Galaxy', platform: 'Android', ua: 'Mozilla/5.0 (Linux; Android 10)'}
    ],
    tablet: [
        {model: 'iPad', platform: 'iPad', ua: 'Mozilla/5.0 (iPad; CPU OS 13_2)'},
        {model: 'Android Tablet', platform: 'Android', ua: 'Mozilla/5.0 (Linux; Android 9; Tablet)'}
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
const referrers = [
    'google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com',
    'facebook.com', 'twitter.com', 'reddit.com', 'instagram.com'
];
const pagePaths = [
    '/', '/home', '/chin-chin-casino-promotions', '/responsible-gaming', 
    '/pgsoft-rtp', '/casino-download', '/table-games', '/live-casino'
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

// Generate realistic traffic data
function generateTrafficData() {
    const now = new Date();
    const startDate = new Date(now.getTime() - (config.timeRangeDays * 24 * 60 * 60 * 1000));
    const trafficData = [];
    
    for (let i = 0; i < config.totalVisits; i++) {
        if (i % config.outputFrequency === 0) {
            console.log(`Generating visit ${i + 1} of ${config.totalVisits}`);
        }
        
        const isOrganic = Math.random() > 0.3;
        const referrer = isOrganic 
            ? getRandomElement(referrers.filter(r => ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com'].includes(r)))
            : getRandomElement(referrers);
        
        const keyword = isOrganic ? generateKeyword() : null;
        const visitDate = getRandomDate(startDate, now);
        const country = getRandomElement(Object.keys(geoData));
        const region = getRandomElement(geoData[country].regions);
        const city = getRandomElement(geoData[country].cities);
        const deviceType = getRandomElement(['desktop', 'mobile', 'tablet']);
        const deviceInfo = getRandomElement(devices[deviceType]);
        
        trafficData.push({
            timestamp: Math.floor(visitDate.getTime() / 1000),
            date: visitDate.toISOString().split('T')[0],
            referrer: referrer,
            keyword: keyword,
            keywordRank: keyword ? updateRankings(keyword) : null,
            pagePath: getRandomElement(pagePaths),
            isNewVisitor: Math.random() > 0.7,
            sessionDuration: getRandomInt(10, 600),
            device: deviceType,
            deviceInfo: deviceInfo,
            country: country,
            region: region,
            city: city
        });
    }
    
    return trafficData;
}

// Enhanced GA4 sender with proper location tracking
async function sendToGoogleAnalytics(data) {
    if (!config.sendToGA && !config.debugMode) return;

    const endpoint = `https://www.google-analytics.com/mp/collect?measurement_id=${config.googleAnalyticsId}&api_secret=${config.apiSecret}`;
    
    const eventData = {
        client_id: `simulated_${Math.floor(Math.random() * 1000000)}`,
        user_id: data.isNewVisitor ? undefined : `user_${Math.floor(Math.random() * 10000)}`,
        timestamp_micros: data.timestamp * 1000000,
        user_properties: {
            country: { value: data.country },
            device_type: { value: data.device }
        },
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
                geo_id: data.country,
                country: data.country,
                region: data.region,
                city: data.city,
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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
            console.error('GA Error:', response.status, await response.text());
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
    console.log(`Starting traffic simulation for ${config.domain}`);
    console.log(`Time range: Last ${config.timeRangeDays} days`);
    console.log(`Total visits to simulate: ${config.totalVisits}`);
    
    const trafficData = generateTrafficData();

    console.log('\nProcessing traffic data...');
    
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
    console.log('Check your GA4 Real-Time report for location data');
    console.log('Note: It may take 1-2 minutes for locations to appear on the map');
})();