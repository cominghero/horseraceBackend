import { scrapeUpcomingRaces } from './scraper.js';

console.log('Testing time extraction from upcoming races...\n');

scrapeUpcomingRaces('today')
  .then(racetracks => {
    console.log('\n=== TIME EXTRACTION TEST RESULTS ===\n');

    racetracks.forEach(track => {
      console.log(`\n🏇 ${track.racetrack}`);
      console.log('─'.repeat(50));

      track.completedRaces.forEach(race => {
        console.log(`  ${race.raceNumber}: ${race.time}`);
      });
    });

    // Check if any times were successfully extracted
    const timesFound = racetracks.flatMap(t => t.completedRaces).filter(r => r.time !== 'TBD');
    const totalRaces = racetracks.flatMap(t => t.completedRaces).length;

    console.log(`\n📊 Summary:`);
    console.log(`   Total races: ${totalRaces}`);
    console.log(`   Times extracted: ${timesFound.length}`);
    console.log(`   Times missing (TBD): ${totalRaces - timesFound.length}`);

    if (timesFound.length > 0) {
      console.log(`\n✅ Time extraction is working!`);
    } else {
      console.log(`\n❌ No times extracted - check the selector`);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
