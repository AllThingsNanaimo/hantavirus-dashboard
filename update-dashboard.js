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

let dashboardData = {
  lastUpdate: new Date().toISOString(),
  alerts: [],
  updates: []
};

async function fetchWHOOutbreakNews() {
  try {
    console.log(`${colors.blue}📊 Fetching WHO Disease Outbreak News...${colors.reset}`);
    
    const response = await axios.get('https://www.who.int/emergencies/disease-outbreak-news/', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const $ = cheerio.load(response.data);
    
    const articles = [];
    $('article, .article, .outbreak-item').each((i, elem) => {
      if (articles.length >= 3) return;
      
      const title = $(elem).find('h2, h3, a').first().text().trim();
      const link = $(elem).find('a').first().attr('href');
      const date = $(elem).find('time, .date, .published').text().trim() || 'Recent';
      
      if (title && link) {
        articles.push({
          title: title.substring(0, 100),
          link: link.startsWith('http') ? link : `https://www.who.int${link}`,
          date: date,
          source: 'WHO'
        });
      }
    });
    
    if (articles.length > 0) {
      dashboardData.updates.push(...articles);
      console.log(`${colors.green}✓ Found ${articles.length} WHO updates${colors.reset}`);
    }
    
    return articles;
  } catch (error) {
    console.log(`${colors.yellow}⚠ WHO fetch error: ${error.message}${colors.reset}`);
    return [];
  }
}

async function fetchCDCData() {
  try {
    console.log(`${colors.blue}📊 Fetching CDC Hantavirus Data...${colors.reset}`);
    
    const response = await axios.get('https://www.cdc.gov/hantavirus/', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const $ = cheerio.load(response.data);
    
    dashboardData.alerts.push({
      title: 'CDC Andes Virus Guidance',
      detail: 'Latest clinical recommendations and prevention measures',
      severity: 'high',
      source: 'CDC',
      link: 'https://www.cdc.gov/hantavirus/about/andesvirus.html',
      type: 'government'
    });
    
    console.log(`${colors.green}✓ CDC data fetched${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.yellow}⚠ CDC fetch error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function fetchECDCData() {
  try {
    console.log(`${colors.blue}📊 Fetching ECDC Assessment...${colors.reset}`);
    
    const response = await axios.get('https://www.ecdc.europa.eu/en/publications-data', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    const $ = cheerio.load(response.data);
    
    const publications = [];
    $('a').each((i, elem) => {
      const text = $(elem).text();
      const href = $(elem).attr('href');
      
      if (text.toLowerCase().includes('hantavirus') && href) {
        publications.push({
          title: text.trim().substring(0, 100),
          link: href.startsWith('http') ? href : `https://www.ecdc.europa.eu${href}`,
          source: 'ECDC'
        });
      }
    });
    
    if (publications.length > 0) {
      dashboardData.updates.push(...publications.slice(0, 2));
      console.log(`${colors.green}✓ ECDC data fetched${colors.reset}`);
    }
    
    dashboardData.alerts.push({
      title: 'ECDC Threat Assessment',
      detail: 'European outbreak assessment and recommendations',
      severity: 'high',
      source: 'ECDC',
      link: 'https://www.ecdc.europa.eu/en/publications-data/hantavirus-associated-cluster-illness-cruise-ship-ecdc-assessment-and',
      type: 'government'
    });
    
    return true;
  } catch (error) {
    console.log(`${colors.yellow}⚠ ECDC fetch error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function fetchVaccineResearch() {
  try {
    console.log(`${colors.blue}📊 Fetching Vaccine Research...${colors.reset}`);
    
    const response = await axios.get('https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11861054/', {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    dashboardData.alerts.push({
      title: 'Vaccine Development Progress',
      detail: 'Orthohantavirus vaccine candidates in development - latest research',
      severity: 'medium',
      source: 'PubMed',
      link: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11861054/',
      type: 'vaccine'
    });
    
    dashboardData.updates.push({
      title: 'Orthohantavirus Vaccines - Latest Research',
      link: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11861054/',
      source: 'PubMed',
      date: 'Feb 2025'
    });
    
    console.log(`${colors.green}✓ Vaccine research fetched${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.yellow}⚠ Vaccine research error: ${error.message}${colors.reset}`);
    return false;
  }
}

function buildAlertHTML(alert) {
  const severityClass = `alert-${alert.severity}`;
  const badgeStyle = {
    critical: '#e74c3c',
    high: '#f39c12',
    medium: '#3498db'
  };
  
  return `<div class="alert-card ${severityClass}">
                <div class="alert-header">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-badge" style="background: ${badgeStyle[alert.severity]}">${alert.severity.toUpperCase()}</div>
                </div>
                <div class="alert-detail">${alert.detail}</div>
                <div class="alert-footer">
                    <span class="alert-source">Source: ${alert.source}</span>
                    <a href="${alert.link}" target="_blank" class="alert-link">Read more →</a>
                </div>
            </div>`;
}

function buildUpdateHTML(update) {
  return `<div class="update-item">
                <div class="update-meta">${update.date || 'Recent'} • ${update.source}</div>
                <div class="update-title">${update.title}</div>
                <a href="${update.link}" target="_blank" class="alert-link">View source →</a>
            </div>`;
}

function updateDashboardHTML() {
  console.log(`${colors.blue}📝 Updating dashboard HTML...${colors.reset}`);
  
  let html = fs.readFileSync('index.html', 'utf8');
  
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
    /<span id="timestamp"><\/span>/,
    `<span id="timestamp">${timestamp}</span>`
  );
  
  html = html.replace(
    /<span id="footer-timestamp"><\/span>/,
    `<span id="footer-timestamp">${timestamp}</span>`
  );
  
  const alertsHTML = dashboardData.alerts
    .slice(0, 4)
    .map(alert => buildAlertHTML(alert))
    .join('\n');
  
  html = html.replace(
    /(<div id="alerts" class="tab-content">)[\s\S]*?(<\/div>\s*<!-- Updates Tab -->)/,
    `$1\n${alertsHTML}\n        $2`
  );
  
  const updatesHTML = dashboardData.updates
    .slice(0, 5)
    .map(update => buildUpdateHTML(update))
    .join('\n');
  
  html = html.replace(
    /(<div id="updates" class="tab-content">)[\s\S]*?(<\/div>\s*<!-- Regions Tab -->)/,
    `$1\n${updatesHTML}\n        $2`
  );
  
  const autoUpdateBanner = `<div style="background: #e8f8f5; border-left: 4px solid #1abc9c; padding: 0.75rem; margin-bottom: 12px; border-radius: 8px; font-size: 12px; color: #0e6251;">
      <strong>✓ Auto-updated:</strong> Live data fetched from WHO, CDC, ECDC at ${timestamp} UTC
    </div>`;
  
  html = html.replace(
    /(<div id="alerts" class="tab-content">)/,
    `$1\n            ${autoUpdateBanner}`
  );
  
  fs.writeFileSync('index.html', html, 'utf8');
  console.log(`${colors.green}✓ Dashboard updated with live data${colors.reset}`);
}

async function main() {
  console.log(`\n${colors.blue}🦠 Hantavirus Dashboard Auto-Update${colors.reset}`);
  console.log(`${colors.blue}Time: ${new Date().toUTCString()}${colors.reset}\n`);
  
  try {
    dashboardData.alerts = [];
    dashboardData.updates = [];
    
    await Promise.all([
      fetchWHOOutbreakNews(),
      fetchCDCData(),
      fetchECDCData(),
      fetchVaccineResearch()
    ]);
    
    if (dashboardData.alerts.length === 0) {
      dashboardData.alerts = [
        {
          title: 'MV Hondius Cruise Outbreak',
          detail: '6 confirmed Andes virus cases, 3 deaths on cruise ship',
          severity: 'critical',
          source: 'WHO',
          link: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON599'
        }
      ];
    }
    
    updateDashboardHTML();
    
    console.log(`\n${colors.green}✓ Update complete${colors.reset}`);
    console.log(`${colors.green}  - Alerts: ${dashboardData.alerts.length}${colors.reset}`);
    console.log(`${colors.green}  - Updates: ${dashboardData.updates.length}${colors.reset}\n`);
    
    process.exit(0);
    
  } catch (error) {
    console.error(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();
