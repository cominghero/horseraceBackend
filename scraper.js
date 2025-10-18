import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for file operations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPORTSBET_URL = 'https://www.sportsbet.com.au/racing-schedule/horse/today';
const LOGS_DIR = path.join(__dirname, 'logs');

/**
 * Ensure logs directory exists
 */
function ensureLogsDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

/**
 * Log scraping results to a text file
 * @param {Array} allRacetracksData - All scraped race data
 * @param {number} totalRaceCount - Total races scraped
 */
function logScrapingResults(allRacetracksData, totalRaceCount) {
  try {
    ensureLogsDir();
    
    const timestamp = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString('en-AU').replace(/\//g, '-');
    const timeStr = new Date().toLocaleTimeString('en-AU').replace(/:/g, '-');
    const filename = `scraping-results-${dateStr}_${timeStr}.txt`;
    const filepath = path.join(LOGS_DIR, filename);
    
    let logContent = `HORSE RACING SCRAPING RESULTS LOG\n`;
    logContent += `${'='.repeat(70)}\n`;
    logContent += `Timestamp: ${timestamp}\n`;
    logContent += `Total Racetracks: ${allRacetracksData.length}\n`;
    logContent += `Total Races Scraped: ${totalRaceCount}\n`;
    logContent += `${'='.repeat(70)}\n\n`;
    
    // Log details for each racetrack
    allRacetracksData.forEach((trackData, trackIndex) => {
      const { racetrack, tracklinkUrl, completedRaces } = trackData;
      
      logContent += `\n[${trackIndex + 1}] RACETRACK: ${racetrack}\n`;
      logContent += `-`.repeat(70) + `\n`;
      logContent += `Track URL: ${tracklinkUrl}\n`;
      logContent += `Total Races: ${completedRaces.length}\n\n`;
      
      // Log each race
      completedRaces.forEach((race, raceIndex) => {
        const { raceNumber, result, link, horses, horseCount } = race;
        
        logContent += `  ${raceNumber}. Result: ${result} | Horses: ${horseCount}\n`;
        logContent += `     Link: ${link}\n`;
        
        // Log horses for this race
        if (horses && horses.length > 0) {
          logContent += `     Horses:\n`;
          horses.forEach((horse) => {
            const { rank, horseNumber, horseName, odds } = horse;
            const placeOdds = odds?.placeFixed || 'N/A';
            logContent += `       - [${rank}] #${horseNumber} ${horseName} (Place: ${placeOdds})\n`;
          });
        }
        
        logContent += `\n`;
      });
    });
    
    // Write to file
    fs.writeFileSync(filepath, logContent, 'utf-8');
    console.log(`📄 Scraping results logged to: ${filepath}`);
    
    return filepath;
  } catch (error) {
    console.error('❌ Error logging scraping results:', error.message);
  }
}

/**
 * Log completed races to a text file
 * @param {Array} completedRacesData - Result from scrapeCompletedRaces()
 * @returns {string} Path to the log file
 */
export function logCompletedRaces(completedRacesData) {
  try {
    ensureLogsDir();
    
    const timestamp = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString('en-AU').replace(/\//g, '-');
    const timeStr = new Date().toLocaleTimeString('en-AU').replace(/:/g, '-');
    const filename = `completed-races-${dateStr}_${timeStr}.txt`;
    const filepath = path.join(LOGS_DIR, filename);
    
    let logContent = `COMPLETED RACES LOG\n`;
    logContent += `${'='.repeat(80)}\n`;
    logContent += `Timestamp: ${timestamp}\n`;
    logContent += `Total Racetracks: ${completedRacesData.length}\n`;
    logContent += `${'='.repeat(80)}\n\n`;
    
    // Calculate total races
    let totalRaceCount = 0;
    completedRacesData.forEach(track => {
      totalRaceCount += track.completedRaces.length;
    });
    logContent += `Total Races: ${totalRaceCount}\n\n`;
    
    // Log details for each racetrack
    completedRacesData.forEach((trackData, trackIndex) => {
      const { racetrack, country, tracklinkUrl, completedRaces } = trackData;
      
      logContent += `\n[${ trackIndex + 1}] RACETRACK: ${racetrack}\n`;
      logContent += `-`.repeat(80) + `\n`;
      logContent += `Country: ${country}\n`;
      logContent += `Track URL: ${tracklinkUrl}\n`;
      logContent += `Total Races: ${completedRaces.length}\n\n`;
      
      // Log each race
      completedRaces.forEach((race, raceIndex) => {
        const { raceNumber, result, link } = race;
        
        logContent += `  ${raceNumber}. Result: ${result}\n`;
        logContent += `     Link: ${link || 'N/A'}\n\n`;
      });
    });
    
    // Write to file
    fs.writeFileSync(filepath, logContent, 'utf-8');
    console.log(`📄 Completed races logged to: ${filepath}`);
    
    return filepath;
  } catch (error) {
    console.error('❌ Error logging completed races:', error.message);
  }
}

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
      let raceIndex = 0; // Track actual races found

      raceCells.each((cellIndex, cell) => {
        const $cell = $(cell);
        let raceFoundInCell = false; // Flag to prevent duplicate adds per cell
        
        // Look for race results (numbers separated by commas)
        // Results are in: div > div (second div) > div > div
        const resultDivs = $cell.find('div > div');
        
        resultDivs.each((divIndex, div) => {
          if (raceFoundInCell) return; // Skip if already found a race in this cell
          
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
              raceIndex++;
              completedRaces.push({
                raceNumber: `R${raceIndex}`,
                result: resultText,
                link: raceLink || null
              });
              raceFoundInCell = true; // Mark that we found a race in this cell
            }
          }
        });

        // Alternative: Check direct text content for results (only if nested check didn't find anything)
        if (!raceFoundInCell) {
          const cellText = $cell.text().trim();
          if (isRaceResult(cellText)) {
            const raceLink = $cell.find('a').attr('href');
            raceIndex++;
            completedRaces.push({
              raceNumber: `R${raceIndex}`,
              result: cellText,
              link: raceLink || null
            });
          }
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
 * @param {string} raceUrl - The race card URL to scrape (can be relative or absolute)
 * @returns {Promise<Array>} Array of horse data with odds
 */
export async function scrapeRaceCardByUrl(raceUrl) {
  try {
    // Convert relative URL to full URL if needed
    const fullUrl = raceUrl.startsWith('http') 
      ? raceUrl 
      : `https://www.sportsbet.com.au${raceUrl}`;
    
    console.log(`\n📍 Fetching race card from: ${fullUrl}`);
    
    const response = await axios.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const horses = [];

    // Find the main race card container using data-automation-id
    // Try multiple selectors since Sportsbet may use different container IDs
    let racecardBody = $('[data-automation-id*="racecard"]');
    
    // If not found, look for elements containing outcome cards (horses)
    if (racecardBody.length === 0) {
      racecardBody = $('[data-automation-id*="outcome"]').parent();
    }
    
    // Fallback to looking for divs with outcome card classes
    if (racecardBody.length === 0) {
      racecardBody = $('div[class*="outcomeCard_"]').parent();
    }
    
    if (racecardBody.length === 0) {
      console.warn('⚠️ Race card body container not found');
      console.log('ℹ️ Trying to find outcome cards directly...');
      // Continue anyway and look for outcome cards directly
    } else {
      console.log(`✅ Found race card container`);
    }

    // Get all outcome cards (horses) - either from container or directly
    let allDivs = racecardBody.find('[data-automation-id*="outcome"]');
    
    // If no outcome cards found through container, search entire page
    if (allDivs.length === 0) {
      allDivs = $('[data-automation-id*="outcome"]');
    }
    
    // Fallback: look for outcomeCard classes
    if (allDivs.length === 0) {
      allDivs = $('div[class*="outcomeCard_"]');
    }
    
    console.log(`📊 Found ${allDivs.length} outcome cards (horses) in race card`);

    // Process each horse
    let horseCount = 0;
    allDivs.each((index, element) => {
      const $element = $(element);
      
      // Verify this is an outcome card (horse entry)
      const dataId = $element.attr('data-automation-id') || '';
      const elementClass = $element.attr('class') || '';
      
      // Check if it's a valid outcome/horse card
      const isOutcomeCard = dataId.includes('outcome') || elementClass.includes('outcomeCard_');
      if (!isOutcomeCard) {
        return;
      }

      horseCount++;
      const rank = horseCount;

      // Extract the nested divs
      const nestedDivs = $element.find('> div');
      
      if (nestedDivs.length < 1) {
        console.warn(`⚠️ Expected nested divs for horse at rank ${rank}, found ${nestedDivs.length}`);
        return;
      }

      // ========== FIRST DIV: All horse data (outcomeDetailsContainer) ==========
      const firstDiv = $(nestedDivs[0]);
      const containerText = firstDiv.text().trim();
      
      // Extract horse number and name from the beginning
      // Format: "1. Brave Boy (8)..."
      let horseNumber = '';
      let horseName = '';
      
      const horseMatch = containerText.match(/^(\d+)\.\s+([A-Za-z\s]+)\s*\(/);
      if (horseMatch) {
        horseNumber = horseMatch[1];
        horseName = horseMatch[2].trim();
      }

      // Extract odds using data-automation-id attributes (more reliable)
      let open = '0.00';
      let fluc1 = '0.00';
      let fluc2 = '0.00';
      let winFixed = '0.00';
      let placeFixed = '0.00';
      let eachWayFixed = '0.00';

      // Method 1: Try to extract odds from data-automation-id elements
      // Elements have ids like: "racecard-outcome-{index}-{type}-price"
      const rankIndex = rank - 1; // Convert to 0-based index
      
      // Try different attribute name patterns used by Sportsbet
      const priceSelectors = [
        { attr: `data-automation-id="racecard-outcome-${rankIndex}-O-price"`, field: 'open' },
        { attr: `data-automation-id="racecard-outcome-${rankIndex}-F1-price"`, field: 'fluc1' },
        { attr: `data-automation-id="racecard-outcome-${rankIndex}-F2-price"`, field: 'fluc2' },
        { attr: `data-automation-id="racecard-outcome-${rankIndex}-W-price"`, field: 'winFixed' },
        { attr: `data-automation-id="racecard-outcome-${rankIndex}-L-price"`, field: 'placeFixed' }, // L = Last (Place)
        { attr: `data-automation-id="racecard-outcome-${rankIndex}-EW-price"`, field: 'eachWayFixed' },
      ];
      
      let foundAnyOdds = false;
      priceSelectors.forEach(({ attr, field }) => {
        // Extract the attribute value from the selector string
        const selectorAttr = attr.split('"')[1];
        const priceEl = $element.find(`[data-automation-id="${selectorAttr}"]`);
        
        if (priceEl.length > 0) {
          const text = priceEl.text().trim();
          // Updated regex to handle 1-2 decimal places and comma/dot separators
          const match = text.match(/(\d+[.,]\d{1,2})/);
          if (match) {
            // Normalize comma to dot for consistency
            const normalizedPrice = match[1].replace(',', '.');
            eval(`${field} = '${normalizedPrice}'`);
            foundAnyOdds = true;
          }
        }
      });
      
      // Method 2: Fallback - Try to find all price containers and extract in order
      if (!foundAnyOdds) {
        // Look for any elements with price data (contains decimal numbers)
        const allPriceContainers = $element.find('[data-automation-id*="price"]');
        
        if (allPriceContainers.length > 0) {
          const prices = [];
          allPriceContainers.each((idx, el) => {
            const text = $(el).text().trim();
            // Updated regex to handle 1-2 decimal places and comma/dot separators
            const match = text.match(/(\d+[.,]\d{1,2})/);
            if (match) {
              // Normalize comma to dot for consistency
              const normalizedPrice = match[1].replace(',', '.');
              if (!prices.includes(normalizedPrice)) {
                prices.push(normalizedPrice);
              }
            }
          });
          
          // Assign extracted prices to odds fields
          if (prices.length >= 1) winFixed = prices[0];
          if (prices.length >= 2) placeFixed = prices[1];
          if (prices.length >= 3) eachWayFixed = prices[2];
          if (prices.length >= 4) open = prices[3];
          if (prices.length >= 5) fluc1 = prices[4];
          if (prices.length >= 6) fluc2 = prices[5];
          
          foundAnyOdds = prices.length > 0;
        }
      }

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
      console.log(`   📊 Odds: Open=${open} | Fluc1=${fluc1} | Fluc2=${fluc2}`);
      console.log(`   💰 Fixed: Win=${winFixed} | Place=${placeFixed} | Each Way=${eachWayFixed}`);
      
      // Debug: Check if odds are all 0.00 (potential extraction issue)
      if (open === '0.00' && fluc1 === '0.00' && winFixed === '0.00') {
        console.log(`   ⚠️  DEBUG: No odds found using standard extraction`);
        console.log(`   ℹ️  HTML text sample: "${containerText.substring(0, 150)}..."`);
      }
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
 * Scrape all completed races and their race cards
 * Returns array of {raceUrl, horses[]} and saves to database
 * @param {object} db - Database instance (optional, for saving data)
 * @returns {Promise<Array>} Array of races with horse data
 */
export async function scrapeAllCompletedRacesWithCards(db = null) {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  SCRAPING ALL COMPLETED RACES         ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Step 1: Get all completed races with structure: racetrack, completedRaces array
    console.log('📍 Step 1: Fetching completed races...');
    const completedRacesData = await scrapeCompletedRaces();
    
    console.log(`✅ Found ${completedRacesData.length} racetracks\n`);
    
    // Log completed races to file
    logCompletedRaces(completedRacesData);

    // Step 2: For each racetrack, scrape race cards for each race
    console.log('📍 Step 2: Scraping race cards for each race...\n');
    
    const allRacetracksData = [];
    let totalRaceCount = 0;

    for (const trackData of completedRacesData) {
      const { racetrack, tracklinkUrl, completedRaces } = trackData;
      
      console.log(`\n🏇 Processing: ${racetrack}`);
      
      // Scrape horses for each race in this racetrack
      const completedRacesWithHorses = [];
      
      for (let i = 0; i < completedRaces.length; i++) {
        const race = completedRaces[i];
        const { raceNumber, result, link } = race;
        
        try {
          console.log(`  [${i + 1}/${completedRaces.length}] ${raceNumber}: ${result}`);
          
          // Scrape horse data from the race link
          const horses = await scrapeRaceCardByUrl(link);
          
          // Merge horses into race object
          const raceWithHorses = {
            raceNumber,
            result,
            link,
            horses,
            horseCount: horses.length
          };
          
          completedRacesWithHorses.push(raceWithHorses);
          console.log(`    ✅ Found ${horses.length} horses`);
          totalRaceCount++;
          
        } catch (error) {
          console.log(`    ⚠️  Failed: ${error.message}`);
          // Still add the race, but with empty horses array
          completedRacesWithHorses.push({
            raceNumber,
            result,
            link,
            horses: [],
            horseCount: 0
          });
        }
      }
      
      // Add this racetrack with all its races and horses
      const trackWithHorses = {
        racetrack,
        tracklinkUrl,
        completedRaces: completedRacesWithHorses
      };
      
      allRacetracksData.push(trackWithHorses);
    }

    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║  COMPLETED: Scraped ${totalRaceCount} races        ║`);
    console.log(`╚════════════════════════════════════════╝\n`);

    // Log results to text file
    logScrapingResults(allRacetracksData, totalRaceCount);

    return allRacetracksData;

  } catch (error) {
    console.error('❌ Error scraping all races:', error.message);
    throw error;
  }
}

/**
 * Save race data to database
 * @param {object} db - Database instance
 * @param {object} raceData - Race data with horses
 */
async function saveRaceToDB(db, raceData) {
  try {
    // Create race entry
    const newRace = {
      id: Math.max(...(db.data.races || []).map(r => r.id), 0) + 1,
      name: raceData.raceName,
      track: raceData.trackName,
      date: new Date().toISOString().split('T')[0],
      url: raceData.raceUrl,
      scrapedAt: raceData.scrapedAt
    };

    if (!db.data.races) db.data.races = [];
    db.data.races.push(newRace);

    // Create horse entries linked to this race
    if (!db.data.horses) db.data.horses = [];
    
    raceData.horses.forEach(horse => {
      const newHorse = {
        id: Math.max(...db.data.horses.map(h => h.id), 0) + 1,
        number: horse.horseNumber,
        name: horse.horseName,
        rank: horse.rank,
        odds: horse.odds,
        raceId: newRace.id
      };
      db.data.horses.push(newHorse);
    });

    await db.write();
    console.log(`  💾 Saved to database`);
  } catch (error) {
    console.error(`  ❌ DB save error: ${error.message}`);
  }
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
    
    // Log results to file
    logCompletedRaces(results);
    
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
    main().catch(console.error);
  }
}