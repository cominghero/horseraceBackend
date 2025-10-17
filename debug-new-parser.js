import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://www.sportsbet.com.au/horse-racing/australia-nz/ipswich/race-3-9733774';

async function debugNewParser() {
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
      if (horseNum > 3) return; // First 3 horses
      
      const nestedDivs = $element.find('> div');
      const firstDiv = $(nestedDivs[0]);
      const containerText = firstDiv.text().trim();
      
      const horseMatch = containerText.match(/^(\d+)\.\s+([A-Za-z\s]+)\s*\(/);
      const horseName = horseMatch ? horseMatch[2].trim() : 'Unknown';
      
      console.log(`\n🐴 HORSE #${horseNum} - ${horseName}:`);
      
      const ewMatch = containerText.match(/(.+?)EW/);
      if (ewMatch) {
        const oddsSection = ewMatch[1];
        console.log(`Odds section: "${oddsSection}"`);
        
        const trainerMatch = oddsSection.match(/T:\s*([A-Za-z\s]+?)(\d+\.\d+)/);
        console.log(`Trainer match: ${trainerMatch ? 'Found' : 'NOT FOUND'}`);
        
        if (trainerMatch) {
          console.log(`  Trainer: "${trainerMatch[1]}"`);
          console.log(`  First odds: "${trainerMatch[2]}"`);
          
          const trainerEnd = oddsSection.indexOf(trainerMatch[2]);
          const oddsString = oddsSection.substring(trainerEnd);
          console.log(`Odds string: "${oddsString}"`);
          
          const oddsMatches = oddsString.match(/(\d+\.?\d{2,})/g) || [];
          console.log(`Odds matches: [${oddsMatches.join(', ')}]`);
          
          let odds = [];
          for (let i = 0; i < oddsMatches.length; i++) {
            let match = oddsMatches[i];
            if (match.match(/\d{2}\.\d{4,}/)) {
              const num = match;
              const beforeDot = num.substring(0, num.indexOf('.'));
              const afterDot = num.substring(num.indexOf('.') + 1);
              odds.push(beforeDot + '.' + afterDot.substring(0, 2));
              if (afterDot.length > 2) {
                odds.push(afterDot.substring(2));
              }
            } else {
              odds.push(match);
            }
          }
          console.log(`Parsed odds: [${odds.join(', ')}]`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugNewParser();