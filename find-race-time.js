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

  console.log('Looking for race time in the page header/title area...\n');

  // Check for elements with "race" in class or data attributes
  const raceElements = $('[class*="race"], [class*="Race"], [data-automation-id*="race"]');

  console.log(`Found ${raceElements.length} elements with "race" in attributes\n`);

  // Look for the main race header/title
  const raceHeader = $('[data-automation-id*="header"], [data-automation-id*="title"]');
  console.log('=== Race header elements ===');
  raceHeader.slice(0, 10).each((i, el) => {
    const autoId = $(el).attr('data-automation-id');
    const text = $(el).text().trim().substring(0, 100);
    if (text) {
      console.log(`${i}. [${autoId}]: "${text}"`);
    }
  });

  // Check the existing extractRaceDateFromUrl selector
  console.log('\n=== Checking results-header (from extractRaceDateFromUrl) ===');
  const resultsHeader = $('div[data-automation-id="results-header"]');
  console.log('Results header found:', resultsHeader.length);

  if (resultsHeader.length > 0) {
    const headerCells = resultsHeader.find('> div');
    console.log('Header cells found:', headerCells.length);

    headerCells.each((i, cell) => {
      const text = $(cell).find('span').text().trim();
      console.log(`  Cell ${i}: "${text}"`);
    });
  }

  // Look for any divs with time pattern
  console.log('\n=== All divs containing time pattern ===');
  $('div').each((i, el) => {
    const text = $(el).text();
    if (text.match(/^\d{1,2}:\d{2}/) && text.length < 50) {
      const classes = $(el).attr('class');
      const autoId = $(el).attr('data-automation-id');
      console.log(`"${text}" - class: ${classes} - autoId: ${autoId}`);
    }
  });
});
