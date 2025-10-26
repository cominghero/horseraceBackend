import { scrapeUpcomingRaces } from './scraper.js';

console.log('Testing scrapeUpcomingRaces to verify time extraction...\n');

scrapeUpcomingRaces('today')
  .then(results => {
    console.log('\n✅ Test Results:\n');

    results.forEach(track => {
      console.log(`\n🏇 ${track.racetrack}:`);
      track.completedRaces.forEach(race => {
        console.log(`   ${race.raceNumber} - Time: ${race.time} - ${race.link}`);
      });
    });

    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
