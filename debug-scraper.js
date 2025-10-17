import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugPageStructure() {
  try {
    const url = 'https://www.sportsbet.com.au/horse-racing/australia-nz/ipswich/race-3-9733774';
    
    console.log('Fetching page...');
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    console.log('\n=== DEBUGGING PAGE STRUCTURE ===\n');
    
    // Find racecardBody
    const racecardBody = $('div[class*="racecardBody_"]');
    console.log(`📍 Found racecardBody elements: ${racecardBody.length}`);
    
    if (racecardBody.length > 0) {
      const divs = racecardBody.find('> div');
      console.log(`📊 Direct children divs: ${divs.length}\n`);
      
      // Show the first few divs and their classes
      divs.slice(0, 5).each((index, el) => {
        const $el = $(el);
        const className = $el.attr('class') || 'NO CLASS';
        const textContent = $el.text().trim().substring(0, 50);
        console.log(`Div ${index}: class="${className}"`);
        console.log(`  Text: "${textContent}"`);
      });
    }
    
    // Look for racecard-outcome elements
    console.log('\n\n=== LOOKING FOR RACECARD-OUTCOME ELEMENTS ===\n');
    const outcomes = $('[class*="racecard-outcome-"]');
    console.log(`Found elements with "racecard-outcome-": ${outcomes.length}`);
    
    // Let's look at different patterns
    console.log('\n\n=== SEARCHING FOR PATTERNS ===\n');
    
    // Look for any div with "racecard" in the class
    const allRacecard = $('div[class*="racecard"]');
    console.log(`Elements with "racecard" in class: ${allRacecard.length}`);
    
    // Let's find the race card body and inspect its structure more deeply
    if (racecardBody.length > 0) {
      console.log('\n\n=== DETAILED STRUCTURE OF RACECARDbody ===\n');
      
      const directChildren = racecardBody.find('> div');
      console.log(`Direct children count: ${directChildren.length}`);
      
      // For each child, show its structure
      directChildren.slice(0, 10).each((index, element) => {
        const $elem = $(element);
        const children = $elem.find('> div');
        const classList = $elem.attr('class') || '';
        const hasRacecard = classList.includes('racecard-outcome');
        
        console.log(`\nChild ${index}:`);
        console.log(`  Has "racecard-outcome": ${hasRacecard}`);
        console.log(`  Class: ${classList.substring(0, 100)}`);
        console.log(`  Direct children: ${children.length}`);
        console.log(`  Text: "${$elem.text().trim().substring(0, 40)}"`);
      });
    }
    
    console.log('\n\n=== FULL HTML SEARCH ===\n');
    // Save some HTML snippet for inspection
    if (racecardBody.length > 0) {
      const html = racecardBody.html();
      if (html) {
        console.log('First 500 chars of racecardBody HTML:');
        console.log(html.substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugPageStructure();