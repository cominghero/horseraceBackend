import { scrapeRaceCardByUrl } from './scraper.js';

const tomorrowRaceUrl = '/horse-racing/australia-nz/sale/race-1-9763544';

console.log('Testing tomorrow race scraping...\n');

scrapeRaceCardByUrl(tomorrowRaceUrl)
  .then(horses => {
    console.log(`\nHorses found: ${horses.length}`);

    if (horses.length > 0) {
      console.log(`\nFirst 3 horses:`);
      horses.slice(0, 3).forEach(h => {
        console.log(`  ${h.horseNumber}. ${h.horseName} - Jockey: ${h.jockey} - Odds: $${h.odds.winFixed}`);
      });
    }
  });
