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
    
    // console.log(`\n📍 Fetching race card from: ${fullUrl}`);
    
    const response = await axios.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const horses = [];

    // Find all horse outcome containers
    // Each horse is in a div with data-automation-id="racecard-outcome-*"
    const horseContainers = $('div[data-automation-id^="racecard-outcome-"]').filter(function() {
      return $(this).find('div[data-automation-id="racecard-outcome-name"]').length > 0;
    });
    // console.log(horseContainers.length);
    
    // if (horseContainers.length === 0) {
    //   console.warn('⚠️ No horse containers found');
    //   return horses;
    // }
    
    // console.log(`✅ Found ${horseContainers.length} horses`);

    let horseCount = 0;
    horseContainers.each((index, container) => {
      const $container = $(container);
      
      // ========== HORSE NUMBER AND NAME ==========
      // Located in: div[data-automation-id="racecard-outcome-name"] > span:first
      const nameSpan = $container.find('div[data-automation-id="racecard-outcome-name"] > span').first();
      const horseInfoText = nameSpan.text().trim();
      
      let horseNumber = '';
      let horseName = '';
      
      const horseMatch = horseInfoText.match(/^(\d+)\.\s+(.+)$/);
      if (horseMatch) {
        horseNumber = horseMatch[1];
        horseName = horseMatch[2].trim();
      } else {
        console.warn(`⚠️ Could not parse horse info: "${horseInfoText}"`);
        return; // Skip this horse
      }

      horseCount++;
      const rank = horseCount;

      // ========== FLUCTUATING ODDS ==========
      // Located in: div[class*="priceFlucsContainer_"] > span (3 spans)
      const flucContainer = $container.find('div[class*="priceFlucsContainer_"]');
      const flucSpans = flucContainer.find('> span');
      
      let open = '0.00';
      let fluc1 = '0.00';
      let fluc2 = '0.00';
      
      if (flucSpans.length >= 1) {
        const openText = $(flucSpans[0]).text().trim();
        const openMatch = openText.match(/(\d+[.,]\d{1,2})/);
        if (openMatch) open = openMatch[1].replace(',', '.');
      }
      if (flucSpans.length >= 2) {
        const fluc1Text = $(flucSpans[1]).text().trim();
        const fluc1Match = fluc1Text.match(/(\d+[.,]\d{1,2})/);
        if (fluc1Match) fluc1 = fluc1Match[1].replace(',', '.');
      }
      if (flucSpans.length >= 3) {
        const fluc2Text = $(flucSpans[2]).text().trim();
        const fluc2Match = fluc2Text.match(/(\d+[.,]\d{1,2})/);
        if (fluc2Match) fluc2 = fluc2Match[1].replace(',', '.');
      }

      // ========== FIXED ODDS ==========
      // Located in: div[class*="priceContainer_"] > div[data-automation-id*="L-price"]
      // Each has button > div > div > div > span (inside the button)
      const fixedContainer = $container.find('div[class*="priceContainer_"]');
      const priceDivs = fixedContainer.find('> div[data-automation-id*="L-price"]');
      
      let winFixed = '0.00';
      let placeFixed = '0.00';
      let eachWayFixed = '0.00';
      
      // Extract from first price div (WIN)
      if (priceDivs.length >= 1) {
        const winSpan = $(priceDivs[0]).find('button span[data-automation-id*="odds-button-text"]').first();
        if (winSpan.length > 0) {
          const winText = winSpan.text().trim();
          const winMatch = winText.match(/(\d+[.,]\d{1,2})/);
          if (winMatch) winFixed = winMatch[1].replace(',', '.');
        }
      }
      
      // Extract from second price div (PLACE)
      if (priceDivs.length >= 2) {
        const placeSpan = $(priceDivs[1]).find('button span[data-automation-id*="odds-button-text"]').first();
        if (placeSpan.length > 0) {
          const placeText = placeSpan.text().trim();
          const placeMatch = placeText.match(/(\d+[.,]\d{1,2})/);
          if (placeMatch) placeFixed = placeMatch[1].replace(',', '.');
        }
      }
      
      // Extract from third price div (EACH WAY)
      if (priceDivs.length >= 3) {
        const ewSpan = $(priceDivs[2]).find('button span[data-automation-id*="odds-button-text"]').first();
        if (ewSpan.length > 0) {
          const ewText = ewSpan.text().trim();
          // Each way might show "EW" instead of odds, so handle that
          const ewMatch = ewText.match(/(\d+[.,]\d{1,2})/);
          if (ewMatch) eachWayFixed = ewMatch[1].replace(',', '.');
        }
      }

      // Build horse object (same output structure)
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
      // console.log(`\n🐴 Rank ${rank} - Horse #${horseNumber}: ${horseName}`);
      // console.log(`   📊 Odds: Open=${open} | Fluc1=${fluc1} | Fluc2=${fluc2}`);
      // console.log(`   💰 Fixed: Win=${winFixed} | Place=${placeFixed} | Each Way=${eachWayFixed}`);
    });
    // console.log(horses);
    
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