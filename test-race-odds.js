import { scrapeRaceCardByUrl } from './scraper.js';

// Test with a known race URL
const testRaceUrl = '/horse-racing/australia-nz/caulfield/race-1-9733983';

async function testOdds() {
  try {
    console.log('🏇 Testing odds extraction...\n');
    console.log(`📍 Testing race URL: ${testRaceUrl}\n`);
    
    const horses = await scrapeRaceCardByUrl(testRaceUrl);
    
    console.log('\n\n📊 ODDS EXTRACTION RESULTS:');
    console.log('═'.repeat(80));
    
    if (horses.length === 0) {
      console.log('⚠️ No horses scraped');
      return;
    }
    
    console.log(`✅ Successfully scraped ${horses.length} horses\n`);
    
    // Show each horse's odds
    horses.forEach((horse) => {
      console.log(`\n🐴 #${horse.horseNumber} ${horse.horseName}`);
      console.log(`   Open: ${horse.odds.open || '0.00'}`);
      console.log(`   Win:  ${horse.odds.winFixed || '0.00'}`);
      console.log(`   Place: ${horse.odds.placeFixed || '0.00'}`);
      console.log(`   E/W:  ${horse.odds.eachWayFixed || '0.00'}`);
    });
    
    // Check if we have real odds
    const nonZeroOdds = horses.filter(h => 
      h.odds.winFixed !== '0.00' || h.odds.placeFixed !== '0.00'
    );
    
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`✅ Horses with extracted odds: ${nonZeroOdds.length}/${horses.length}`);
    
    if (nonZeroOdds.length === 0) {
      console.log('⚠️  WARNING: No odds were extracted! The HTML structure may have changed.');
      console.log('   Please check the DevTools to verify the data-automation-id attributes.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testOdds();