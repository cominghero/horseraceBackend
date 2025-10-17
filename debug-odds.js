import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://www.sportsbet.com.au/horse-racing/australia-nz/ipswich/race-3-9733774';

async function debugOdds() {
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
      console.log(`\nFull text:\n${containerText}`);
      console.log(`\n---`);
      
      const allNumbers = containerText.match(/\d+\.\d+/g) || [];
      console.log(`\nAll decimal numbers found: ${allNumbers.length}`);
      allNumbers.forEach((num, idx) => {
        console.log(`  ${idx}: ${num}`);
      });
      
      console.log(`\n---`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugOdds();