import axios from 'axios';
import cheerio from 'cheerio';

const raceUrl = 'https://www.sportsbet.com.au/horse-racing/australia-nz/moonee-valley/race-1-9759568';

axios.get(raceUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const $ = cheerio.load(response.data);

  console.log('=== META TAGS ===\n');

  $('meta').each((i, el) => {
    const name = $(el).attr('name');
    const property = $(el).attr('property');
    const content = $(el).attr('content');

    if (content) {
      console.log(`[${name || property || 'unnamed'}]`);
      console.log(`  ${content}\n`);
    }
  });

  console.log('\n=== TITLE TAG ===');
  console.log($('title').text());

  console.log('\n=== CANONICAL URL ===');
  console.log($('link[rel="canonical"]').attr('href'));

  console.log('\n=== Full page description ===');
  const desc = $('meta[data-automation-id="page-description"]').attr('content');
  console.log(desc);
});
