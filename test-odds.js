import { scrapeRaceCardByUrl } from './scraper.js';

const url = 'https://www.sportsbet.com.au/horse-racing/australia-nz/ipswich/race-3-9733774';

console.log('\n=== TESTING UPDATED ODDS PARSER ===\n');

try {
  const horses = await scrapeRaceCardByUrl(url);
  
  console.log('\n=== RESULTS ===\n');
  horses.slice(0, 5).forEach(h => {
    console.log(`${h.rank}. ${h.horseName} (#${h.horseNumber})`);
    console.log(`   Open: ${h.odds.open} | Fluc1: ${h.odds.fluc1} | Fluc2: ${h.odds.fluc2}`);
    console.log(`   Win: ${h.odds.winFixed} | Place: ${h.odds.placeFixed} | EW: ${h.odds.eachWayFixed}\n`);
  });
  
  console.log(`Total horses: ${horses.length}`);
} catch (error) {
  console.error('Error:', error.message);
}