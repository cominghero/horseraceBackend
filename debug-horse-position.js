import axios from 'axios';
import * as cheerio from 'cheerio';

// Use a sample race URL
const raceUrl = 'https://www.sportsbet.com.au/horse-racing/australia-nz/sale/race-1-9763544';

console.log('Examining horse position/rank data...\n');

axios.get(raceUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const $ = cheerio.load(response.data);

  // Find horse containers
  const horseContainers = $('div[data-automation-id^="racecard-outcome-"]').filter(function() {
    return $(this).find('div[data-automation-id="racecard-outcome-name"]').length > 0;
  });

  console.log(`Found ${horseContainers.length} horses\n`);

  // Examine first 3 horses
  horseContainers.slice(0, 3).each((index, container) => {
    const $container = $(container);

    console.log(`\n${'='.repeat(70)}`);
    console.log(`HORSE ${index + 1}`);
    console.log('='.repeat(70));

    // Get automation ID (might contain position info)
    const automationId = $container.attr('data-automation-id');
    console.log(`Automation ID: ${automationId}`);

    // Get horse name/number
    const nameSpan = $container.find('div[data-automation-id="racecard-outcome-name"] > span').first();
    const horseInfoText = nameSpan.text().trim();
    console.log(`Horse Info: ${horseInfoText}`);

    // Check for barrier/position info
    const allSpans = $container.find('span[data-automation-id*="info"]');
    console.log(`\nInfo spans found: ${allSpans.length}`);
    allSpans.each((i, span) => {
      const id = $(span).attr('data-automation-id');
      const text = $(span).text().trim();
      console.log(`  ${id}: ${text}`);
    });

    // Check for any numbered elements
    const allText = $container.text();
    console.log(`\nAll text in container:`);
    console.log(allText.substring(0, 300));

    // Look for barrier info specifically
    const barrierSpan = $container.find('span[data-automation-id*="barrier"]');
    if (barrierSpan.length > 0) {
      console.log(`\n✅ Barrier found: ${barrierSpan.text()}`);
    }
  });
})
.catch(error => {
  console.error('Error:', error.message);
});
