import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

/**
 * Advanced debugging script to inspect the exact HTML structure of the race card page
 * This helps identify the correct selectors needed
 */

async function debugAndExtractStructure(url) {
  try {
    console.log('🔍 Fetching page...\n');
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    console.log('=== STAGE 1: FINDING MAIN CONTAINER ===\n');
    
    // Find racecardBody
    const racecardBody = $('div[class*="racecardBody"]');
    console.log(`✓ Found racecardBody elements: ${racecardBody.length}`);
    
    if (racecardBody.length === 0) {
      console.log('\n⚠️ Race card body not found. Searching for alternative patterns...\n');
      
      // Try alternative selectors
      const alternatives = [
        { name: 'div[class*="racecard"]', count: $('div[class*="racecard"]').length },
        { name: 'div[class*="race"]', count: $('div[class*="race"]').length },
        { name: 'div[role="table"]', count: $('div[role="table"]').length },
      ];
      
      alternatives.forEach(alt => {
        console.log(`  ${alt.name}: ${alt.count} elements`);
      });
      
      return;
    }
    
    console.log('\n=== STAGE 2: ANALYZING DIRECT CHILDREN ===\n');
    
    const directChildren = racecardBody.find('> div');
    console.log(`Total direct children: ${directChildren.length}\n`);
    
    // Analyze structure of first 15 children
    const childrenToAnalyze = Math.min(15, directChildren.length);
    console.log(`Analyzing first ${childrenToAnalyze} children:\n`);
    
    directChildren.slice(0, childrenToAnalyze).each((index, element) => {
      const $el = $(element);
      const classAttr = $el.attr('class') || '';
      const childCount = $el.find('> div').length;
      const text = $el.text().trim().substring(0, 60);
      const hasRacecard = classAttr.includes('racecard-outcome');
      
      console.log(`Child ${index}:`);
      console.log(`  ├─ Has "racecard-outcome": ${hasRacecard ? '✓' : '✗'}`);
      console.log(`  ├─ Direct div children: ${childCount}`);
      console.log(`  ├─ Class: ${classAttr.substring(0, 80)}...`);
      console.log(`  └─ Text preview: "${text}..."\n`);
    });
    
    // Find the pattern of racecard-outcome elements
    console.log('=== STAGE 3: FINDING RACECARD-OUTCOME ELEMENTS ===\n');
    const outcomes = racecardBody.find('> div[class*="racecard-outcome"]');
    console.log(`Found elements with "racecard-outcome" in class: ${outcomes.length}\n`);
    
    if (outcomes.length === 0) {
      console.log('⚠️  No racecard-outcome elements found. Checking structure of non-first divs...\n');
      
      // Get all divs that are not the first one and have "racecard" in their class
      const racecardsInBody = racecardBody.find('> div').slice(1);
      console.log(`Non-first divs: ${racecardsInBody.length}`);
      
      racecardsInBody.slice(0, 3).each((idx, elem) => {
        const classStr = $(elem).attr('class') || '';
        console.log(`  ${idx}: ${classStr}`);
      });
    }
    
    // Save sample HTML for inspection
    console.log('\n=== STAGE 4: EXTRACTING SAMPLE HORSE DATA ===\n');
    
    let horseIndex = 0;
    (outcomes.length > 0 ? outcomes : racecardBody.find('> div').slice(1)).each((outIndex, element) => {
      if (horseIndex >= 3) return; // Only show first 3
      
      const $outcome = $(element);
      const nestedDivs = $outcome.find('> div');
      
      console.log(`Sample Horse ${horseIndex + 1}:`);
      console.log(`  Total nested divs: ${nestedDivs.length}\n`);
      
      nestedDivs.slice(0, 3).each((divIdx, div) => {
        const $div = $(div);
        const allSpans = $div.find('span');
        const allButtons = $div.find('button');
        
        console.log(`  Nested div ${divIdx}:`);
        console.log(`    ├─ Spans found: ${allSpans.length}`);
        console.log(`    ├─ Buttons found: ${allButtons.length}`);
        
        if (allSpans.length > 0) {
          console.log(`    └─ Span texts:`);
          allSpans.slice(0, 3).each((spanIdx, span) => {
            const text = $(span).text().trim().substring(0, 50);
            console.log(`       ${spanIdx}: "${text}"`);
          });
        }
      });
      
      console.log('\n');
      horseIndex++;
    });
    
    // Save HTML snippet for manual inspection
    const htmlSnippet = racecardBody.html().substring(0, 2000);
    fs.writeFileSync('html-snippet.html', htmlSnippet);
    console.log('✓ Saved HTML snippet to: html-snippet.html\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('⚠️ Network error: Cannot reach the website from this environment');
      console.error('Please run this script on your local machine instead');
    }
  }
}

const url = 'https://www.sportsbet.com.au/horse-racing/australia-nz/ipswich/race-3-9733774';
console.log(`\n📍 URL: ${url}\n`);
console.log('═'.repeat(60) + '\n');

debugAndExtractStructure(url);