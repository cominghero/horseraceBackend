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
      
      // Check if this is a outcomeCard element (horse entry)
      if (!elementClass.includes('outcomeCard_')) {
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

      // Extract odds values from the text
      // The odds appear concatenated at the end before 'EW'
      // Pattern: "15.0012.0013.0014.003.60EW" means: 15.00|12.00|13.00|14.00|3.60
      let open = '';
      let fluc1 = '';
      let fluc2 = '';
      let winFixed = '';
      let placeFixed = '';
      let eachWayFixed = '';

      // Find the odds section - extract everything between last letter+number and 'EW'
      const ewMatch = containerText.match(/(.+?)EW/);
      if (ewMatch) {
        const oddsSection = ewMatch[1];
        
        // Extract odds using the correct pattern: each odds is digit(s).digit(s)
        // But we need to get them in the right order from the trainer name onwards
        // Format: "T: TrainerName15.0012.0013.0014.003.60"
        // Find where trainer ends and odds begin
        const trainerMatch = oddsSection.match(/T:\s*([A-Za-z\s]+)(\d+\.\d+)/);
        
        if (trainerMatch) {
          // Get the part after trainer name
          const trainerEnd = oddsSection.indexOf(trainerMatch[2]);
          const oddsString = oddsSection.substring(trainerEnd);
          
          // Extract odds values with pattern: digits.twoDigits
          // This regex matches: optional leading zeros, digits, dot, 2+ digits
          const oddsMatches = oddsString.match(/(\d+\.?\d{2,})/g) || [];
          
          // Process odds matches to extract individual values
          // Each odds should be separated correctly
          let odds = [];
          for (let i = 0; i < oddsMatches.length; i++) {
            let match = oddsMatches[i];
            // Handle cases like "15.0012" which should split into "15.00" and "12"
            // Look for patterns like XX.XXYY where YY starts a new number
            
            // For "15.0012", split it properly
            if (match.match(/\d{2}\.\d{4,}/)) {
              // This is a concatenated odds like "15.0012"
              // Extract in pairs: "15.00" then "12.00" or "12"
              const num = match;
              const beforeDot = num.substring(0, num.indexOf('.'));
              const afterDot = num.substring(num.indexOf('.') + 1);
              
              odds.push(beforeDot + '.' + afterDot.substring(0, 2));
              
              // Check if there are more digits after the first 2
              if (afterDot.length > 2) {
                odds.push(afterDot.substring(2));
              }
            } else {
              odds.push(match);
            }
          }
          
          // Parse the extracted odds
          if (odds.length >= 5) {
            open = parseFloat(odds[0]).toFixed(2);
            fluc1 = parseFloat(odds[1]).toFixed(2);
            fluc2 = parseFloat(odds[2]).toFixed(2);
            winFixed = parseFloat(odds[3]).toFixed(2);
            eachWayFixed = parseFloat(odds[4]).toFixed(2);
            placeFixed = eachWayFixed;
          }
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