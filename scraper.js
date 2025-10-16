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
  main();
}