import axios from 'axios';
import cheerio from 'cheerio';

const url = 'https://www.sportsbet.com.au/racing-schedule/tomorrow';

axios.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})
.then(response => {
  const $ = cheerio.load(response.data);

  // Find first race link with Fixed Odds icon
  const firstLink = $('a[href*="/horse-racing/"]').filter(function() {
    const href = $(this).attr('href');
    const hasFixedOddsIcon = $(this).find('i.fixedodds_f1q5kl4f').length > 0;
    return href && href.includes('/race-') && hasFixedOddsIcon;
  }).first();

  if (firstLink.length > 0) {
    console.log('Found race link!');
    console.log('HTML of first race link:\n');
    console.log(firstLink.html().substring(0, 1000));
    console.log('\n\nSearching for time spans:');
    console.log('span with defaultTimer:', firstLink.find('span[class*="defaultTimer"]').length);
    console.log('span with Timer:', firstLink.find('span[class*="Timer"]').length);
    console.log('All spans:', firstLink.find('span').length);

    console.log('\n\nAll span texts:');
    firstLink.find('span').each((i, span) => {
      const text = $(span).text().trim();
      const classes = $(span).attr('class');
      if (text) {
        console.log(`${i}: "${text}" - classes: ${classes}`);
      }
    });
  } else {
    console.log('No race link found');
  }
});
