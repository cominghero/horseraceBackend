import axios from 'axios';
import * as cheerio from 'cheerio';

const SPORTSBET_URL = 'https://www.sportsbet.com.au/racing-schedule/horse/today';

/**
 * Scrapes completed race results from Sportsbet
 * @returns {Promise<Array>} Array of racetracks with completed results
 */
export async function scrapeCompletedRaces() {
  try {
    console.log('Fetching racing schedule from Sportsbet...');
    const response = await axios.get(SPORTSBET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Find all tr tags (racetrack rows)
    const rows = $('tr');
    
    rows.each((index, row) => {
      const $row = $(row);
      
      // Get the first td which contains the track info
      const firstTd = $row.find('td').first();
      const countrySpan = firstTd.find('a > div > div > div > span').text().trim();
      
      // Only process Australian racetracks
      if (countrySpan !== 'Australia') {
        return; // Skip this row
      }

      // Get the track name
      const trackNameElement = firstTd.find('a > div > div > div');
      let trackName = '';
      trackNameElement.contents().each((i, node) => {
        if (node.type === 'text') {
          trackName = $(node).text().trim();
        }
      });

      // Get the track link
      const trackLink = firstTd.find('a').attr('href');

      // Get all race cells (td elements after the first one)
      const raceCells = $row.find('td').slice(1);
      const completedRaces = [];

      raceCells.each((cellIndex, cell) => {
        const $cell = $(cell);
        
        // Look for race results (numbers separated by commas)
        // Results are in: div > div (second div) > div > div
        const resultDivs = $cell.find('div > div');
        
        resultDivs.each((divIndex, div) => {
          const $div = $(div);
          
          // Check if this div contains two sub-divs
          const subDivs = $div.find('> div');
          if (subDivs.length >= 2) {
            // The second sub-div might contain results
            const secondDiv = subDivs.eq(1);
            const resultText = secondDiv.text().trim();
            
            // Check if it matches the pattern of race results (e.g., "4,5,3")
            if (isRaceResult(resultText)) {
              const raceLink = $cell.find('a').attr('href');
              completedRaces.push({
                raceNumber: `R${cellIndex + 1}`,
                result: resultText,
                link: raceLink || null
              });
            }
          }
        });

        // Alternative: Check direct text content for results
        const cellText = $cell.text().trim();
        if (isRaceResult(cellText) && completedRaces.length === 0) {
          const raceLink = $cell.find('a').attr('href');
          completedRaces.push({
            raceNumber: `R${cellIndex + 1}`,
            result: cellText,
            link: raceLink || null
          });
        }
      });

      // Only add if there are completed races
      if (completedRaces.length > 0) {
        results.push({
          racetrack: trackName,
          country: countrySpan,
          tracklinkUrl: trackLink,
          completedRaces: completedRaces
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Error scraping Sportsbet:', error.message);
    throw error;
  }
}

/**
 * Check if text matches race result pattern (numbers separated by commas)
 * @param {string} text
 * @returns {boolean}
 */
function isRaceResult(text) {
  // Pattern: numbers separated by commas (e.g., "4,5,3" or "1,2,3")
  return /^\d+,\d+,\d+$/.test(text);
}

/**
 * Scrapes race card data from a specific race URL
 * Extracts horse numbers, names, ranks, and betting odds
 * @param {string} raceUrl - The race card URL to scrape
 * @returns {Promise<Array>} Array of horse data with odds
 */
export async function scrapeRaceCardByUrl(raceUrl) {
  try {
    console.log(`\n📍 Fetching race card from: ${raceUrl}`);
    
    const response = await axios.get(raceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const horses = [];

    // Find the main race card container
    const racecardBody = $('div[class*="racecardBody_"]');
    
    if (racecardBody.length === 0) {
      console.warn('⚠️ Race card body container not found');
      return [];
    }

    console.log(`✅ Found race card container`);

    // Get all direct child divs
    const allDivs = racecardBody.find('> div');
    console.log(`📊 Found ${allDivs.length} direct child divs in race card body`);

    // Process each horse (skip first div, start from second)
    let horseCount = 0;
    allDivs.each((index, element) => {
      // Skip the first div
      if (index === 0) {
        return;
      }

      const $element = $(element);
      const elementClass = $element.attr('class') || '';
      
      // Check if this is a racecard-outcome element (more flexible matching)
      if (!elementClass.includes('racecard-outcome')) {
        return;
      }

      horseCount++;
      const rank = horseCount;

      // Extract the three main nested divs
      const nestedDivs = $element.find('> div');
      
      if (nestedDivs.length < 3) {
        console.warn(`⚠️ Expected 3 nested divs for horse at rank ${rank}, found ${nestedDivs.length}`);
        return;
      }

      // ========== FIRST DIV: Horse Number and Name ==========
      const firstDiv = $(nestedDivs[0]);
      const horseInfoSpan = firstDiv.find('div > span').first();
      const horseInfoText = horseInfoSpan.text().trim();
      
      // Parse "number.name" format
      let horseNumber = '';
      let horseName = '';
      
      if (horseInfoText.includes('.')) {
        const parts = horseInfoText.split('.');
        horseNumber = parts[0].trim();
        horseName = parts.slice(1).join('.').trim();
      } else {
        horseNumber = horseInfoText.trim();
        horseName = '';
      }

      // ========== SECOND DIV: Betting Rates (open, Fluc1, Fluc2) ==========
      const secondDiv = $(nestedDivs[1]);
      const rateSpans = secondDiv.find('span');
      
      let open = '';
      let fluc1 = '';
      let fluc2 = '';

      rateSpans.each((spanIndex, span) => {
        const spanText = $(span).text().trim();
        // Try to identify which rate this is by position or class
        if (spanIndex === 0) {
          open = spanText;
        } else if (spanIndex === 1) {
          fluc1 = spanText;
        } else if (spanIndex === 2) {
          fluc2 = spanText;
        }
      });

      // ========== THIRD DIV: Fixed Rates (win, place, each way) ==========
      const thirdDiv = $(nestedDivs[2]);
      const fixedRateDivs = thirdDiv.find('> div');
      
      let winFixed = '';
      let placeFixed = '';
      let eachWayFixed = '';

      fixedRateDivs.each((divIndex, div) => {
        const $div = $(div);
        // Navigate: div > div > div > button > div > 2nd div > span
        const targetSpan = $div.find('div > div > button > div > div > span').first();
        const rateValue = targetSpan.text().trim();

        if (divIndex === 0) {
          winFixed = rateValue;
        } else if (divIndex === 1) {
          placeFixed = rateValue;
        } else if (divIndex === 2) {
          eachWayFixed = rateValue;
        }
      });

      // Build horse object
      const horseData = {
        rank,
        horseNumber,
        horseName,
        odds: {
          open,
          fluc1,
          fluc2,
          winFixed,
          placeFixed,
          eachWayFixed
        }
      };

      horses.push(horseData);

      // Log to console for verification
      console.log(`\n🐴 Rank ${rank} - Horse #${horseNumber}: ${horseName}`);
      console.log(`   Open: ${open} | Fluc1: ${fluc1} | Fluc2: ${fluc2}`);
      console.log(`   Win Fixed: ${winFixed} | Place Fixed: ${placeFixed} | Each Way: ${eachWayFixed}`);
    });

    console.log(`\n✅ Successfully scraped ${horses.length} horses from race card\n`);
    return horses;

  } catch (error) {
    console.error('❌ Error scraping race card:', error.message);
    throw error;
  }
}

/**
 * Format race card results for JSON output
 * @param {Array} horses - Array of horse data
 * @param {string} raceUrl - The race URL
 * @returns {object}
 */
export function formatRaceCardAsJSON(horses, raceUrl) {
  return {
    timestamp: new Date().toISOString(),
    source: 'Sportsbet Australia',
    raceUrl,
    totalHorses: horses.length,
    horses
  };
}

/**
 * Format results for JSON output
 * @param {Array} results
 * @returns {object}
 */
export function formatAsJSON(results) {
  return {
    timestamp: new Date().toISOString(),
    source: 'Sportsbet Australia',
    racetracks: results
  };
}

// Test race card scraper with example URL or provided URL
async function testRaceCardScraper(providedUrl = null) {
  try {
    const exampleUrl = providedUrl || 'https://www.sportsbet.com.au/horse-racing/australia-nz/matamata/race-1-9733540';
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  🐴 Testing Race Card Scraper         ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    console.log('Step 1: Scraping race card with console output verification...\n');
    const horses = await scrapeRaceCardByUrl(exampleUrl);
    
    console.log('\n═══════════════════════════════════════════════');
    console.log('Step 2: JSON Output\n');
    const jsonOutput = formatRaceCardAsJSON(horses, exampleUrl);
    console.log(JSON.stringify(jsonOutput, null, 2));
    
    console.log('\n═══════════════════════════════════════════════');
    console.log(`\n✅ Test completed successfully!\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Main execution for testing
async function main() {
  try {
    console.log('\n=== Starting Race Results Scraper ===\n');
    
    const results = await scrapeCompletedRaces();
    
    console.log('\n--- Console Output ---');
    console.log(`Found ${results.length} Australian racetracks with completed races:\n`);
    
    results.forEach((track) => {
      console.log(`📍 ${track.racetrack}`);
      console.log(`   Link: ${track.tracklinkUrl}`);
      console.log(`   Completed Races:`);
      track.completedRaces.forEach((race) => {
        console.log(`     ${race.raceNumber}: ${race.result} ${race.link ? `(${race.link})` : ''}`);
      });
      console.log();
    });

    console.log('\n--- JSON Output ---');
    const jsonOutput = formatAsJSON(results);
    console.log(JSON.stringify(jsonOutput, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check for command line argument to choose which test to run
  const testType = process.argv[2];
  const urlParam = process.argv[3];
  
  if (testType === 'race-card') {
    testRaceCardScraper(urlParam);
  } else {
    main();
  }
}