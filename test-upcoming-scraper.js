import { scrapeUpcomingRaces } from './scraper.js';

async function test() {
  console.log('Testing scrapeUpcomingRaces...\n');

  const result = await scrapeUpcomingRaces('horse/today');

  console.log('\n📊 RESULTS:');
  console.log('='.repeat(70));
  console.log(JSON.stringify(result, null, 2));
  console.log('='.repeat(70));
  console.log(`\nTotal racetracks: ${result.length}`);
  console.log(`Total races: ${result.reduce((sum, track) => sum + track.completedRaces.length, 0)}`);
}

test().catch(console.error);
