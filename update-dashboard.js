#!/usr/bin/env node

const fs = require('fs');

try {
  console.log('🦠 Updating dashboard...');
  
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
    /<span id="timestamp"><\/span>/g,
    `<span id="timestamp">${timestamp}</span>`
  );
  
  html = html.replace(
    /<span id="footer-timestamp"><\/span>/g,
    `<span id="footer-timestamp">${timestamp}</span>`
  );
  
  fs.writeFileSync('index.html', html, 'utf8');
  
  console.log('✓ Dashboard updated at ' + timestamp);
  process.exit(0);
  
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
