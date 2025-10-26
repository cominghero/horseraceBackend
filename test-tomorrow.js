import { scrapeUpcomingRaces } from './scraper.js';

scrapeUpcomingRaces('tomorrow')
  .then(results => {
    console.log('\n✅ Tomorrow races:\n');
    results.slice(0, 2).forEach(track => {
      console.log(`\n🏇 ${track.racetrack}:`);
      track.completedRaces.slice(0, 5).forEach(race => {
        console.log(`   ${race.raceNumber} - Time: "${race.time}" - ${race.link}`);
      });
    });
    process.exit(0);
  });
