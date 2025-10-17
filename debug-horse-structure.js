import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://www.sportsbet.com.au/horse-racing/australia-nz/ipswich/race-3-9733774';

async function debugHorseStructure() {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const racecardBody = $('div[class*="racecardBody_"]');
    const allDivs = racecardBody.find('> div');
    
    console.log(`\n=== HORSE STRUCTURE ANALYSIS ===\n`);
    
    let horseNum = 0;
    allDivs.each((index, element) => {
      const $element = $(element);
      const elementClass = $element.attr('class') || '';
      
      if (!elementClass.includes('outcomeCard_')) {
        return;
      }
      
      horseNum++;
      if (horseNum > 2) return; // Only first 2 horses
      
      console.log(`\n🐴 HORSE #${horseNum}:`);
      console.log(`Class: ${elementClass.substring(0, 80)}`);
      
      const nestedDivs = $element.find('> div');
      console.log(`\nNested divs: ${nestedDivs.length}`);
      
      nestedDivs.each((divIdx, div) => {
        const $div = $(div);
        const divClass = $div.attr('class') || '';
        const divText = $div.text().trim().substring(0, 100);
        const spans = $div.find('span');
        const buttons = $div.find('button');
        
        console.log(`\n  DIV ${divIdx}:`);
        console.log(`    Class: ${divClass.substring(0, 60)}`);
        console.log(`    Spans: ${spans.length}, Buttons: ${buttons.length}`);
        console.log(`    Text: ${divText}`);
        
        // Show nested structure
        const subDivs = $div.find('> div');
        if (subDivs.length > 0) {
          console.log(`    Sub-divs: ${subDivs.length}`);
          subDivs.slice(0, 3).each((subIdx, subDiv) => {
            const $subDiv = $(subDiv);
            const subText = $subDiv.text().trim().substring(0, 50);
            console.log(`      SUB-DIV ${subIdx}: ${subText}`);
          });
        }
      });
    });
    
    // Also show all text content
    console.log(`\n\n=== FULL TEXT CONTENT OF FIRST HORSE ===\n`);
    let firstHorse = null;
    allDivs.each((index, element) => {
      const $element = $(element);
      const elementClass = $element.attr('class') || '';
      if (elementClass.includes('outcomeCard_')) {
        if (!firstHorse) {
          firstHorse = $element;
        }
      }
    });
    
    if (firstHorse) {
      console.log(firstHorse.text());
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugHorseStructure();