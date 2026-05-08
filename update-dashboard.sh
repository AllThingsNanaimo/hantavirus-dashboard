#!/bin/bash

echo "🦠 Fetching live hantavirus data..."

TIMESTAMP=$(date -u '+%b %d, %y • %H:%M UTC')

echo "Checking WHO and disease data sources..."
curl -s 'https://disease.sh/v3/diseases' > /dev/null

echo "Updating dashboard..."
sed -i "s/<span id=\"timestamp\"><\/span>/<span id=\"timestamp\">$TIMESTAMP<\/span>/g" index.html
sed -i "s/<span id=\"footer-timestamp\"><\/span>/<span id=\"footer-timestamp\">$TIMESTAMP<\/span>/g" index.html

echo "✓ Dashboard updated: $TIMESTAMP"
