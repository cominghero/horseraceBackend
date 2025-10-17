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
      
      // Find EW match
      const ewMatch = containerText.match(/(.+)EW/);
      if (ewMatch) {
        const beforeEW = ewMatch[1];
        console.log(`\nBefore EW: "${beforeEW}"`);
        
        // Try to find trainer name and extract odds from after it
        const trainerMatch = containerText.match(/T:\s*([A-Za-z\s]+?)(\d+\.\d+)/);
        if (trainerMatch) {
          console.log(`\nTrainer: ${trainerMatch[1]}`);
          const afterTrainer = containerText.substring(containerText.indexOf(trainerMatch[1]) + trainerMatch[1].length);
          console.log(`After trainer: "${afterTrainer}"`);
          
          // Extract the concatenated odds
          const oddsMatch = afterTrainer.match(/(\d+\.\d+\d+\.\d+\d+\.\d+\d+\.\d+\d+\.\d+)EW/);
          if (oddsMatch) {
            console.log(`\nConcatenated odds string: "${oddsMatch[1]}"`);
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugOdds();