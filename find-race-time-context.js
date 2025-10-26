import axios from 'axios';

const SPORTSBET_URL = 'https://www.sportsbet.com.au/racing-schedule/horse/today';

console.log('Searching for race times in context...\n');

axios.get(SPORTSBET_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const html = response.data;

  // Search for race URLs with context
  const racePattern = /\/horse-racing\/australia-nz\/[^\/]+\/race-\d+-\d+/g;
  const raceMatches = html.match(racePattern);

  if (raceMatches) {
    console.log(`Found ${raceMatches.length} race URL references\n`);

    // Get first race URL
    const firstRace = raceMatches[0];
    console.log(`First race: ${firstRace}\n`);

    // Find context around this race URL (500 chars before and after)
    const raceIndex = html.indexOf(firstRace);
    const contextStart = Math.max(0, raceIndex - 500);
    const contextEnd = Math.min(html.length, raceIndex + 500);
    const context = html.substring(contextStart, contextEnd);

    console.log('Context around first race:');
    console.log('='.repeat(80));
    console.log(context);
    console.log('='.repeat(80));

    // Look for time pattern near the race
    const timePattern = /\d{1,2}:\d{2}/;
    const timeMatch = context.match(timePattern);
    if (timeMatch) {
      console.log(`\n✅ Time found near race: ${timeMatch[0]}`);
    } else {
      console.log('\n❌ No time pattern found near this race URL');
    }
  }
})
.catch(error => {
  console.error('Error:', error.message);
});
