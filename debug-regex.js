import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://www.sportsbet.com.au/horse-racing/australia-nz/ipswich/race-3-9733774';

async function debugRegex() {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const racecardBody = $('div[class*="racecardBody_"]');
    const allDivs = racecardBody.find('> div');
    
    let horseNum = 0;
    allDivs.each((index, element) => {
      const $element = $(element);
      const elementClass = $element.attr('class') || '';
      
      if (!elementClass.includes('outcomeCard_')) {
        return;
      }
      
      horseNum++;
      if (horseNum > 2) return; // Only first 2 horses
      
      const nestedDivs = $element.find('> div');
      const firstDiv = $(nestedDivs[0]);
      const containerText = firstDiv.text().trim();
      
      console.log(`\n🐴 HORSE #${horseNum}:`);
      console.log(`Full text: "${containerText}"`);
      
      // Extract using the same regex as scraper.js
      const ewMatch = containerText.match(/(.+?)EW/);
      if (ewMatch) {
        const oddsSection = ewMatch[1];
        console.log(`\nOdds section (before EW): "${oddsSection}"`);
        
        // Apply the same regex
        const numbersInOdds = oddsSection.match(/\d+\.?\d*/g) || [];
        console.log(`\nAll numbers found: [${numbersInOdds.join(', ')}]`);
        
        // Filter for odds
        const odds = numbersInOdds.filter(n => {
          const num = parseFloat(n);
          const valid = num > 0.5 && num < 1000;
          console.log(`  ${n} (${num}) - ${valid ? '✓' : '✗'}`);
          return valid;
        });
        
        console.log(`\nFiltered odds: [${odds.join(', ')}]`);
        
        if (odds.length >= 5) {
          const startIdx = odds.length - 5;
          console.log(`\nTaking last 5 (from index ${startIdx}):`);
          console.log(`  Open: ${odds[startIdx]}`);
          console.log(`  Fluc1: ${odds[startIdx + 1]}`);
          console.log(`  Fluc2: ${odds[startIdx + 2]}`);
          console.log(`  Win Fixed: ${odds[startIdx + 3]}`);
          console.log(`  Each Way: ${odds[startIdx + 4]}`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugRegex();