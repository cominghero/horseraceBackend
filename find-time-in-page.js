import axios from 'axios';
import fs from 'fs';

const SPORTSBET_URL = 'https://www.sportsbet.com.au/racing-schedule/horse/today';

console.log('Fetching page and searching for time patterns...\n');

axios.get(SPORTSBET_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const html = response.data;

  // Save HTML to file
  fs.writeFileSync('page-html.txt', html, 'utf-8');
  console.log('Saved HTML to page-html.txt\n');

  // Search for time patterns
  const timePattern = /\d{1,2}:\d{2}/g;
  const matches = html.match(timePattern);

  if (matches) {
    console.log(`Found ${matches.length} time patterns:`);
    // Get unique times
    const uniqueTimes = [...new Set(matches)];
    console.log(uniqueTimes.slice(0, 20));
  } else {
    console.log('No time patterns found in HTML');
  }

  // Search for "defaultTimer"
  if (html.includes('defaultTimer')) {
    console.log('\n✅ "defaultTimer" found in HTML');
    const timerMatches = html.match(/.{0,100}defaultTimer.{0,100}/g);
    if (timerMatches) {
      console.log('\nContext around "defaultTimer":');
      timerMatches.slice(0, 3).forEach((match, i) => {
        console.log(`${i + 1}: ${match}`);
      });
    }
  } else {
    console.log('\n❌ "defaultTimer" NOT found in HTML');
  }

  // Check page length
  console.log(`\nTotal HTML length: ${html.length} characters`);
})
.catch(error => {
  console.error('Error:', error.message);
});
