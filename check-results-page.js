import axios from 'axios';
import cheerio from 'cheerio';

// Use a race that should have results (from earlier today or yesterday)
const raceUrl = 'https://www.sportsbet.com.au/horse-racing/australia-nz/moonee-valley/race-1-9759568';

console.log('Checking race results page for date/time...\n');
console.log(`URL: ${raceUrl}\n`);

axios.get(raceUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const $ = cheerio.load(response.data);

  console.log('=== Looking for results-header ===');
  const resultsHeader = $('div[data-automation-id="results-header"]');
  console.log('results-header found:', resultsHeader.length);

  if (resultsHeader.length > 0) {
    console.log('\n✅ Found results-header! Extracting content...\n');

    const headerCells = resultsHeader.find('> div');
    console.log(`Found ${headerCells.length} cells in header\n`);

    headerCells.each((i, cell) => {
      const cellHtml = $(cell).html();
      const cellText = $(cell).text().trim();
      console.log(`Cell ${i}:`);
      console.log(`  Text: "${cellText}"`);
      console.log(`  HTML: ${cellHtml ? cellHtml.substring(0, 200) : 'empty'}\n`);
    });
  } else {
    console.log('❌ results-header NOT found\n');
    console.log('=== Searching for alternative date/time locations ===\n');

    // Search for any element with date/time pattern
    $('[data-automation-id*="result"]').each((i, el) => {
      const autoId = $(el).attr('data-automation-id');
      const text = $(el).text().trim();
      if (text.length < 100 && text.length > 0) {
        console.log(`[${autoId}]: "${text}"`);
      }
    });

    // Look for spans with date-like content
    console.log('\n=== All spans with date patterns ===');
    $('span').each((i, el) => {
      const text = $(el).text().trim();
      // Look for date patterns like "23 Oct" or time like "10:15"
      if (text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|\d{1,2}:\d{2}/)) {
        const classes = $(el).attr('class');
        const autoId = $(el).attr('data-automation-id');
        console.log(`"${text}" - class: ${classes || 'none'} - autoId: ${autoId || 'none'}`);
      }
    });
  }

  console.log('\n=== Checking full page text for date patterns ===');
  const bodyText = $('body').text();
  const dateMatches = bodyText.match(/\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}:\d{2}/g);
  if (dateMatches) {
    console.log('Found date patterns:', dateMatches.slice(0, 5));
  }
})
.catch(error => {
  console.error('Error:', error.message);
});
