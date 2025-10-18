import { scrapeCompletedRaces, logCompletedRaces } from './scraper.js';

async function test() {
  try {
    console.log('📍 Fetching completed races...');
    const results = await scrapeCompletedRaces();
    
    console.log(`✅ Found ${results.length} racetracks`);
    console.log('📝 Logging to file...');
    
    const filepath = logCompletedRaces(results);
    
    console.log(`✅ Done! File saved to: ${filepath}`);
    console.log('\n📋 Preview:');
    results.forEach((track, i) => {
      console.log(`  [${i+1}] ${track.racetrack} - ${track.completedRaces.length} races`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();