import { scrapeRaceCardByUrl, formatRaceCardAsJSON } from './scraper.js';

async function test() {
  const url = 'https://www.sportsbet.com.au/horse-racing/australia-nz/ipswich/race-3-9733774';
  
  try {
    console.log('Starting test...');
    console.log('URL:', url);
    console.log('\n');
    
    const horses = await scrapeRaceCardByUrl(url);
    
    console.log('\n\n=== JSON OUTPUT ===\n');
    const jsonOutput = formatRaceCardAsJSON(horses, url);
    console.log(JSON.stringify(jsonOutput, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

test();