import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const testRaceUrl = 'https://www.sportsbet.com.au/horse-racing/australia-nz/caulfield/race-1-9733983';

async function inspectHTML() {
  try {
    console.log('🔍 Fetching Sportsbet page...\n');
    
    const response = await axios.get(testRaceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    console.log('📊 ANALYZING HTML STRUCTURE:\n');
    
    // Find all elements with data-automation-id
    const autoDataElements = $('[data-automation-id]');
    console.log(`1️⃣ Elements with data-automation-id: ${autoDataElements.length}`);
    
    // Get unique data-automation-id values
    const uniqueIds = new Set();
    autoDataElements.each((i, el) => {
      const id = $(el).attr('data-automation-id');
      uniqueIds.add(id);
    });
    
    console.log('\n📋 Sample data-automation-id values:');
    Array.from(uniqueIds).slice(0, 20).forEach(id => {
      console.log(`   - ${id}`);
    });
    
    // Look for outcome-related elements
    console.log('\n\n2️⃣ Searching for outcome-related elements:');
    const outcomeElements = $('[data-automation-id*="outcome"]');
    console.log(`   Found: ${outcomeElements.length}`);
    
    if (outcomeElements.length > 0) {
      console.log('   Sample IDs:');
      let count = 0;
      outcomeElements.each((i, el) => {
        if (count < 5) {
          console.log(`     - ${$(el).attr('data-automation-id')}`);
          count++;
        }
      });
    }
    
    // Look for horse/runner elements
    console.log('\n3️⃣ Searching for horse/runner elements:');
    const horseElements = $('[data-automation-id*="runner"], [data-automation-id*="horse"], [class*="outcomeCard"]');
    console.log(`   Found: ${horseElements.length}`);
    
    // Look for price elements
    console.log('\n4️⃣ Searching for price elements:');
    const priceElements = $('[data-automation-id*="price"]');
    console.log(`   Found with "price": ${priceElements.length}`);
    
    if (priceElements.length > 0) {
      console.log('   Sample IDs:');
      let count = 0;
      priceElements.each((i, el) => {
        if (count < 5) {
          const id = $(el).attr('data-automation-id');
          const text = $(el).text().trim().substring(0, 20);
          console.log(`     - ${id} | Text: "${text}"`);
          count++;
        }
      });
    }
    
    // Save full HTML to file for manual inspection
    const filename = 'sportsbet-page-debug.html';
    fs.writeFileSync(filename, response.data);
    console.log(`\n💾 Full HTML saved to: ${filename}`);
    
    // Also look for runner/horse info
    console.log('\n5️⃣ Looking for runner information:');
    const allDivs = $('div');
    console.log(`   Total divs: ${allDivs.length}`);
    
    // Find divs with class containing specific patterns
    const outcomeCardDivs = allDivs.filter((i, el) => {
      const cls = $(el).attr('class') || '';
      return cls.includes('outcome') || cls.includes('runner') || cls.includes('horse');
    });
    console.log(`   Divs with outcome/runner/horse in class: ${outcomeCardDivs.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspectHTML();