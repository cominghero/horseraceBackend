import axios from 'axios';
import cheerio from 'cheerio';

const raceUrl = 'https://www.sportsbet.com.au/horse-racing/australia-nz/moonee-valley/race-1-9759568';

axios.get(raceUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const $ = cheerio.load(response.data);

  console.log('=== All elements with data-automation-id ===\n');

  const autoIds = new Set();
  $('[data-automation-id]').each((i, el) => {
    const autoId = $(el).attr('data-automation-id');
    if (autoId && !autoIds.has(autoId)) {
      autoIds.add(autoId);
    }
  });

  const sortedIds = Array.from(autoIds).sort();

  console.log(`Found ${sortedIds.length} unique automation IDs\n`);

  // Filter for potentially relevant ones
  console.log('=== IDs containing "result", "header", "time", "date" ===');
  sortedIds.forEach(id => {
    if (id.match(/(result|header|time|date|info)/i)) {
      console.log(`  - ${id}`);
    }
  });

  console.log('\n=== IDs containing "racecard" ===');
  sortedIds.forEach(id => {
    if (id.match(/racecard/i)) {
      console.log(`  - ${id}`);
    }
  });

  console.log('\n=== First 50 automation IDs (alphabetically) ===');
  sortedIds.slice(0, 50).forEach(id => console.log(`  - ${id}`));
});
