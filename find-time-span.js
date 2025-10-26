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

  console.log('=== Searching for span.size16_f6irgbz ===\n');

  const timeSpan = $('span.size16_f6irgbz');
  console.log(`Found ${timeSpan.length} span elements with class size16_f6irgbz\n`);

  if (timeSpan.length > 0) {
    console.log('✅ FOUND THE TIME SPAN!\n');

    timeSpan.each((i, el) => {
      const text = $(el).text().trim();
      const parent = $(el).parent();
      const parentClass = parent.attr('class');
      const parentAutoId = parent.attr('data-automation-id');

      console.log(`Span ${i}:`);
      console.log(`  Text: "${text}"`);
      console.log(`  Parent class: ${parentClass}`);
      console.log(`  Parent automation-id: ${parentAutoId}`);
      console.log(`  Full HTML: ${$(el).parent().html().substring(0, 300)}\n`);
    });
  } else {
    console.log('❌ NOT FOUND - The span is likely JavaScript-rendered\n');

    // Try alternative selectors
    console.log('=== Trying alternative patterns ===\n');

    const sizeSpans = $('span[class*="size16"]');
    console.log(`Spans with "size16" in class: ${sizeSpans.length}`);

    sizeSpans.each((i, el) => {
      const text = $(el).text().trim();
      if (text.match(/\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}:\d{2}/)) {
        console.log(`  Found: "${text}" - class: ${$(el).attr('class')}`);
      }
    });
  }
});
