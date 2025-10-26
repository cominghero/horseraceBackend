import axios from 'axios';
import fs from 'fs';

const SPORTSBET_URL = 'https://www.sportsbet.com.au/racing-schedule/horse/today';

console.log('Searching for JSON data in page...\n');

axios.get(SPORTSBET_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const html = response.data;

  // Search for common patterns where apps embed data
  const patterns = [
    /window\.__INITIAL_STATE__\s*=\s*({.+?});/s,
    /window\.__STATE__\s*=\s*({.+?});/s,
    /window\.APP_STATE\s*=\s*({.+?});/s,
    /__NEXT_DATA__.*?({.+?})<\/script>/s,
    /self\.__next_f\.push.*?(\[.+?\])/gs,
  ];

  let foundData = false;

  patterns.forEach((pattern, index) => {
    const match = html.match(pattern);
    if (match) {
      console.log(`✅ Found data pattern ${index + 1}`);
      const jsonStr = match[1];
      console.log(`Length: ${jsonStr.length} characters`);
      console.log(`First 500 chars: ${jsonStr.substring(0, 500)}`);

      // Try to parse as JSON
      try {
        const data = JSON.parse(jsonStr);
        console.log('✅ Valid JSON');

        // Save to file
        const filename = `embedded-data-${index + 1}.json`;
        fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Saved to ${filename}\n`);

        foundData = true;
      } catch (e) {
        console.log('❌ Not valid JSON');
      }
      console.log('\n' + '-'.repeat(80) + '\n');
    }
  });

  if (!foundData) {
    console.log('No embedded JSON data found in common patterns');

    // Search for any large JSON objects
    console.log('\nSearching for large JSON-like structures...');
    const jsonLike = html.match(/\{[^{}]{1000,}\}/g);
    if (jsonLike) {
      console.log(`Found ${jsonLike.length} large JSON-like structures`);
    }
  }
})
.catch(error => {
  console.error('Error:', error.message);
});
