import { scrapeAllCompletedRacesWithCards, scrapeAllUpcomingRacesWithCards } from './scraper.js';
import fs from 'fs';

console.log('='.repeat(80));
console.log('ENDPOINT 1: scrapeAllCompletedRacesWithCards()');
console.log('='.repeat(80));

console.log('\nFetching completed races (limiting to 1 race for demo)...\n');

scrapeAllCompletedRacesWithCards()
  .then(data => {
    // Take only first racetrack and first race for demo
    const demo = data.slice(0, 1).map(track => ({
      ...track,
      completedRaces: track.completedRaces.slice(0, 1).map(race => ({
        ...race,
        horses: race.horses.slice(0, 2) // Only show 2 horses for brevity
      }))
    }));

    console.log('STRUCTURE:');
    console.log(JSON.stringify(demo, null, 2));

    // Save full data
    fs.writeFileSync('completed-races-sample.json', JSON.stringify(data, null, 2));
    console.log('\n✅ Full data saved to: completed-races-sample.json');
  })
  .catch(err => console.error('Error:', err.message));
