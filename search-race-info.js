import axios from 'axios';
import cheerio from 'cheerio';

// Test with a completed race (today's race)
const raceUrl = 'https://www.sportsbet.com.au/horse-racing/australia-nz/moonee-valley/race-1-9759568';

axios.get(raceUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const $ = cheerio.load(response.data);

  console.log('=== Searching for race info/details ===\n');

  // Look for elements with "info" or "detail" in class/id
  const infoElements = $('[class*="info"], [class*="Info"], [class*="detail"], [class*="Detail"]');
  console.log(`Found ${infoElements.length} info/detail elements`);

  // Look for specific race info
  $('[data-automation-id*="info"], [data-automation-id*="detail"], [data-automation-id*="race"]').each((i, el) => {
    const autoId = $(el).attr('data-automation-id');
    const text = $(el).text().trim();

    if (text && text.length < 200 && text.match(/\d/)) {
      console.log(`\n[${autoId}]`);
      console.log(`Text: "${text.substring(0, 150)}"`);
    }
  });

  // Look at the contextual nav which shows "Moonee Valley"
  console.log('\n\n=== Contextual Nav Area ===');
  const contextNav = $('[data-automation-id*="contextual"]');
  contextNav.each((i, el) => {
    const autoId = $(el).attr('data-automation-id');
    const html = $(el).html();
    if (html && html.length < 500) {
      console.log(`\n[${autoId}]:`);
      console.log(html.substring(0, 400));
    }
  });
});
