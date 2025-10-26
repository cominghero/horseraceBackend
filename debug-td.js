import axios from 'axios';
import cheerio from 'cheerio';

const url = 'https://www.sportsbet.com.au/racing-schedule/tomorrow';

axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const $ = cheerio.load(response.data);

  // Find first TD with race
  const firstTd = $('td[data-automation-id*="horse-racing-section"]').first();

  if (firstTd.length > 0) {
    console.log('Found TD!');
    console.log('\nTD HTML (first 2000 chars):\n');
    console.log(firstTd.html().substring(0, 2000));

    console.log('\n\n=== All text in TD ===');
    console.log(firstTd.text());

    console.log('\n\n=== Searching for time patterns ===');
    const allText = firstTd.text();
    const timeMatch = allText.match(/\d{1,2}:\d{2}/g);
    console.log('Time matches found:', timeMatch);
  } else {
    console.log('No TD found');
  }
});
