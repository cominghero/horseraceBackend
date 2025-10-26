import axios from 'axios';
import cheerio from 'cheerio';

const raceUrl = 'https://www.sportsbet.com.au/horse-racing/australia-nz/moonee-valley/race-1-9759568';

console.log('Fetching race page to find time...\n');

axios.get(raceUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const $ = cheerio.load(response.data);

  console.log('=== Searching for time in race page ===\n');

  // Look for common time patterns
  const bodyText = $('body').text();
  const timeMatches = bodyText.match(/\d{1,2}:\d{2}/g);

  if (timeMatches) {
    console.log('Time patterns found:', timeMatches.slice(0, 10));
  }

  // Look for specific elements that might contain time
  console.log('\n=== Searching for timer/time elements ===');
  const timers = $('span[class*="timer"], span[class*="Timer"], span[class*="time"], span[class*="Time"]');
  console.log('Timer spans found:', timers.length);

  timers.each((i, el) => {
    const text = $(el).text().trim();
    const classes = $(el).attr('class');
    if (text && text.match(/\d{1,2}:\d{2}/)) {
      console.log(`  ${i}: "${text}" - classes: ${classes}`);
    }
  });

  // Look for date/time in specific locations
  console.log('\n=== Checking header/title areas ===');
  const headers = $('h1, h2, h3, [class*="header"], [class*="Header"], [class*="title"], [class*="Title"]');
  headers.each((i, el) => {
    const text = $(el).text().trim();
    if (text.match(/\d{1,2}:\d{2}/)) {
      console.log(`Header ${i}: "${text}"`);
    }
  });

  // Save first 5000 chars of HTML to check structure
  console.log('\n=== First 3000 chars of body HTML ===');
  console.log($('body').html().substring(0, 3000));
});
