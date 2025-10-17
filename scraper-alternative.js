/**
 * ALTERNATIVE SCRAPER WITH MULTIPLE STRATEGIES
 * 
 * This file contains alternative approaches to scraping the race card
 * Use this if the main scraper.js approach doesn't work
 * 
 * Strategy 1: Class pattern matching
 * Strategy 2: Button/Link analysis
 * Strategy 3: Table-like structure parsing
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Strategy 1: Look for elements with specific data attributes or ARIA labels
 */
export async function scrapeRaceCardStrategy1(raceUrl) {
  try {
    console.log('\n🔄 STRATEGY 1: Data attributes and ARIA labels\n');
    
    const response = await axios.get(raceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const horses = [];

    // Look for elements with data attributes that might identify horses
    const horseCells = $('[data-testid*="horse"]');
    console.log(`Found ${horseCells.length} elements with horse in data-testid`);

    // Also try aria-labels
    const ariaElements = $('[aria-label*="horse"]');
    console.log(`Found ${ariaElements.length} elements with horse in aria-label\n`);

    // If found, process them
    if (horseCells.length > 0) {
      horseCells.slice(0, 5).each((idx, el) => {
        const $el = $(el);
        console.log(`Horse cell ${idx}: ${$el.text().trim().substring(0, 100)}`);
      });
    }

    return horses;
  } catch (error) {
    console.error('Strategy 1 error:', error.message);
    return [];
  }
}

/**
 * Strategy 2: Look for button elements containing betting odds
 */
export async function scrapeRaceCardStrategy2(raceUrl) {
  try {
    console.log('\n🔄 STRATEGY 2: Button and link analysis\n');
    
    const response = await axios.get(raceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const horses = [];

    // Look for all buttons (usually contain bet odds)
    const buttons = $('button');
    console.log(`Found ${buttons.length} buttons total\n`);

    // Group buttons that contain numbers (odds)
    const oddsButtons = [];
    buttons.each((idx, btn) => {
      const text = $(btn).text().trim();
      // Check if it contains numbers and dots (like "3.50")
      if (/\d+\.\d+/.test(text)) {
        oddsButtons.push(text);
      }
    });

    console.log(`Found ${oddsButtons.length} buttons with odds format (number.number)\n`);
    console.log('Sample odds buttons:', oddsButtons.slice(0, 10).join(', '));

    return horses;
  } catch (error) {
    console.error('Strategy 2 error:', error.message);
    return [];
  }
}

/**
 * Strategy 3: Parse as table-like structure using rows and cells
 */
export async function scrapeRaceCardStrategy3(raceUrl) {
  try {
    console.log('\n🔄 STRATEGY 3: Table-like structure parsing\n');
    
    const response = await axios.get(raceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const horses = [];

    // Look for row-like divs (usually have similar structure)
    // Often parents have specific data-testid or role="row"
    const rows = $('[role="row"]');
    console.log(`Found ${rows.length} elements with role="row"\n`);

    // If not found, try looking for divs that repeat
    if (rows.length === 0) {
      // Find containers that might have horse entries
      const mainContainer = $('main') || $('[role="main"]');
      const potentialRows = mainContainer.find('> div > div');
      console.log(`Found ${potentialRows.length} potential row containers`);
      
      // Sample them
      potentialRows.slice(0, 3).each((idx, el) => {
        const $el = $(el);
        const text = $el.text().trim().substring(0, 80);
        console.log(`  Row ${idx}: ${text}...`);
      });
    }

    return horses;
  } catch (error) {
    console.error('Strategy 3 error:', error.message);
    return [];
  }
}

/**
 * Strategy 4: Text pattern matching (looks for common patterns like horse numbers)
 */
export async function scrapeRaceCardStrategy4(raceUrl) {
  try {
    console.log('\n🔄 STRATEGY 4: Text pattern matching\n');
    
    const response = await axios.get(raceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = response.data;
    const horses = [];

    // Look for patterns like "1." or "2." at the start (horse numbers)
    const horseNumberPattern = /\b(\d+)\.\s+([A-Z\s]+)/g;
    let match;
    const matches = [];
    
    while ((match = horseNumberPattern.exec(html)) !== null) {
      matches.push({
        number: match[1],
        name: match[2].trim()
      });
    }

    console.log(`Found ${matches.length} potential horse numbers using pattern matching\n`);
    
    if (matches.length > 0) {
      console.log('First 5 horses:');
      matches.slice(0, 5).forEach((h, idx) => {
        console.log(`  ${idx + 1}. #${h.number}: ${h.name}`);
      });
    }

    return horses;
  } catch (error) {
    console.error('Strategy 4 error:', error.message);
    return [];
  }
}

/**
 * Run all strategies for comprehensive debugging
 */
export async function runAllStrategies(raceUrl) {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Testing All Scraping Strategies      ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\nURL: ${raceUrl}\n`);

  try {
    await scrapeRaceCardStrategy1(raceUrl);
    await scrapeRaceCardStrategy2(raceUrl);
    await scrapeRaceCardStrategy3(raceUrl);
    await scrapeRaceCardStrategy4(raceUrl);
    
    console.log('\n✅ All strategies completed\n');
  } catch (error) {
    console.error('Error running strategies:', error.message);
  }
}

// Test if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const url = 'https://www.sportsbet.com.au/horse-racing/australia-nz/ipswich/race-3-9733774';
  runAllStrategies(url);
}