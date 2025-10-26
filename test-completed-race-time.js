import { extractRaceDateFromUrl } from './scraper.js';

// This should be a completed race from today
const completedRaceUrl = 'https://www.sportsbet.com.au/horse-racing/australia-nz/randwick/race-1-9759457';

console.log('Testing extractRaceDateFromUrl with a completed race...\n');
console.log(`URL: ${completedRaceUrl}\n`);

extractRaceDateFromUrl(completedRaceUrl)
  .then(dateTime => {
    console.log(`\nResult: "${dateTime}"`);

    if (dateTime) {
      console.log('\n✅ Time extraction WORKS for completed races!');
    } else {
      console.log('\n❌ Time extraction FAILED');
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
