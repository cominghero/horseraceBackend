import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const testRaceUrl = 'https://www.sportsbet.com.au/horse-racing/australia-nz/moonee-valley/race-1-9759568';

async function inspectHTML() {
  try {
    console.log('🔍 Fetching Sportsbet race page...\n');
    console.log(`URL: ${testRaceUrl}\n`);

    const response = await axios.get(testRaceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30000
    });

    console.log(`✅ Page fetched (${response.data.length} chars)\n`);

    const $ = cheerio.load(response.data);

    console.log('📊 SEARCHING FOR DATE/TIME:\n');

    // 1. Check for results-header
    console.log('1️⃣ Looking for results-header:');
    const resultsHeader = $('div[data-automation-id="results-header"]');
    console.log(`   Found: ${resultsHeader.length}`);

    if (resultsHeader.length > 0) {
      const cells = resultsHeader.find('> div');
      console.log(`   Cells in header: ${cells.length}\n`);
      cells.each((i, cell) => {
        const text = $(cell).text().trim();
        console.log(`     Cell ${i}: "${text}"`);
      });
    }

    // 2. Search for date pattern in text
    console.log('\n2️⃣ Searching for date patterns in page text:');
    const bodyText = $('body').text();
    const dateMatches = bodyText.match(/\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}:\d{2}/g);
    if (dateMatches) {
      console.log(`   Found: ${[...new Set(dateMatches)].join(', ')}`);
    } else {
      console.log('   None found');
    }

    // 3. Check for span.size16
    console.log('\n3️⃣ Looking for span.size16_f6irgbz or similar:');
    const timeSpans = $('span[class*="size16"]');
    console.log(`   Found: ${timeSpans.length}`);

    // 4. Find all automation IDs
    console.log('\n4️⃣ All data-automation-id values:');
    const autoDataElements = $('[data-automation-id]');
    console.log(`   Total elements: ${autoDataElements.length}`);
    
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