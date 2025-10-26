import axios from 'axios';
import * as cheerio from 'cheerio';

const SPORTSBET_URL = 'https://www.sportsbet.com.au/racing-schedule/horse/today';

console.log('Fetching page and examining HTML structure for time...\n');

axios.get(SPORTSBET_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const $ = cheerio.load(response.data);

  // Find race links with Fixed Odds
  const raceLinks = $('a[href*="/horse-racing/"]').filter(function() {
    const href = $(this).attr('href');
    const hasFixedOddsIcon = $(this).find('i.fixedodds_f1q5kl4f').length > 0;
    return href && href.includes('/race-') && hasFixedOddsIcon;
  });

  console.log(`Found ${raceLinks.length} race links\n`);

  // Examine first 3 race links
  raceLinks.slice(0, 3).each((index, link) => {
    const $link = $(link);
    const href = $link.attr('href');
    const title = $link.attr('title');

    console.log(`\n=== Race ${index + 1}: ${title} ===`);
    console.log(`URL: ${href}`);

    // Get the full HTML of this link
    const fullHTML = $link.html();
    console.log('\nFull HTML:');
    console.log(fullHTML);

    // Try different selectors
    console.log('\n--- Testing selectors ---');

    // Test 1: Original selector
    const test1 = $link.find('span.defaultTimer_f17adqu9');
    console.log(`span.defaultTimer_f17adqu9: Found ${test1.length}, Text: "${test1.text()}"`);

    // Test 2: All spans
    const allSpans = $link.find('span');
    console.log(`\nAll spans (${allSpans.length}):`);
    allSpans.each((i, span) => {
      const text = $(span).text().trim();
      const classes = $(span).attr('class');
      console.log(`  Span ${i}: "${text}" | Classes: ${classes}`);
    });

    // Test 3: Look for time pattern
    const linkText = $link.text();
    console.log(`\nAll text in link: "${linkText}"`);
    const timeMatch = linkText.match(/\d{1,2}:\d{2}/);
    if (timeMatch) {
      console.log(`Time pattern found: ${timeMatch[0]}`);
    }

    console.log('\n' + '='.repeat(60));
  });
})
.catch(error => {
  console.error('Error:', error.message);
});
