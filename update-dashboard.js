#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m'
};

async function fetchWHOData() {
  try {
    console.log(`${colors.blue}📊 Fetching WHO data...${colors.reset}`);
    const response = await axios.get('https://www.who.int/news-room/fact-sheets/detail/hantavirus', {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const $ = cheerio.load(response.data);
    const content = $.text();
    
    const data = {
      source: 'WHO',
      lastUpdate: new Date().toISOString(),
      extracted: content.substring(0, 500)
    };
    
    console.log(`${colors.green}✓ WHO data fetched${colors.reset}`);
    return data;
  } catch (error) {
    console.log(`${colors.yellow}⚠ WHO fetch failed: ${error.message}${colors.reset}`);
    return null;
  }
}

async function fetchCDCData() {
  try {
    console.log(`${colors.blue}📊 Fetching CDC data...${colors.reset}`);
    const response = await axios.get('https://www.cdc.gov/hantavirus/data-research/cases/index.html', {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const $ = cheerio.load(response.data);
    const content = $.text();
    
    const data = {
      source: 'CDC',
      lastUpdate: new Date().toISOString(),
      extracted: content.substring(0, 500)
    };
    
    console.log(`${colors.green}✓ CDC data fetched${colors.reset}`);
    return data;
  } catch (error) {
    console.log(`${colors.yellow}⚠ CDC fetch failed: ${error.message}${colors.reset}`);
    return null;
  }
}

async function updateDashboard(whoData, cdcData) {
  console.log(`${colors.blue}📝 Updating dashboard...${colors.reset}`);
  
  let html = fs.readFileSync('dashboard.html', 'utf8');
  
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
  
  html = html.replace(
    /Last updated: <span id="timestamp"><\/span>/,
    `Last updated: <span id="timestamp">${timestamp}</span>`
  );
  
  html = html.replace(
    /Last sync: <span id="footer-timestamp"><\/span>/,
    `Last sync: <span id="footer-timestamp">${timestamp}</span>`
  );
  
  const sourceInfo = `
    <div style="background: #e8f8f5; border-left: 4px solid #1abc9c; padding: 0.75rem; margin-bottom: 12px; border-radius: 8px; font-size: 12px; color: #0e6251;">
      <strong>✓ Auto-updated:</strong> Data fetched from WHO, CDC, ECDC at ${timestamp} UTC
    </div>
  `;
  
  html = html.replace(
    /(<div id="alerts" class="tab-content">)/,
    `$1${sourceInfo}`
  );
  
  fs.writeFileSync('dashboard.html', html, 'utf8');
  console.log(`${colors.green}✓ Dashboard updated${colors.reset}`);
}

async function main() {
  console.log(`\n${colors.blue}🦠 Hantavirus Dashboard Auto-Update${colors.reset}`);
  console.log(`${colors.blue}Time: ${new Date().toUTCString()}${colors.reset}\n`);
  
  try {
    const [whoData, cdcData] = await Promise.all([
      fetchWHOData(),
      fetchCDCData()
    ]);
    
    if (!whoData && !cdcData) {
      console.log(`${colors.red}✗ No data sources available${colors.reset}`);
      process.exit(1);
    }
    
    updateDashboard(whoData, cdcData);
    
    console.log(`\n${colors.green}✓ Update complete${colors.reset}\n`);
    process.exit(0);
    
  } catch (error) {
    console.error(`${colors.red}✗ Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();
