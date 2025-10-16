# Horse Betting Backend

Simple Express.js backend for the horse betting application.

## Installation

```bash
npm install
```

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## Running the Web Scraper

To test the Sportsbet racing schedule scraper:

```bash
npm run scrape
```

This will:
1. Fetch the Sportsbet horse racing schedule
2. Parse for Australian racetracks
3. Extract completed races with results
4. Output to console for verification
5. Display formatted JSON output

## API Endpoints

### Health Check
- `GET /api/health` - Check if backend is running

### Web Scraper
- `GET /api/scrape/completed-races` - Scrapes Sportsbet for completed Australian race results

### Races
- `GET /api/races` - Get all races
- `GET /api/races/:id` - Get specific race with horses
- `POST /api/races` - Create a new race

### Horses
- `GET /api/horses` - Get all horses
- `GET /api/horses/:id` - Get specific horse
- `POST /api/horses` - Add a new horse to a race

### Bets
- `GET /api/bets` - Get all bets
- `GET /api/bets/:id` - Get specific bet
- `POST /api/bets` - Place a new bet
- `PATCH /api/bets/:id` - Update bet status

## Database

This backend uses **lowDB** for lightweight JSON-based data storage. Data is persisted in `db.json` file automatically.

## Environment Variables

Create a `.env` file based on `.env.example`:

```
PORT=5000
NODE_ENV=development
```

## Next Steps

- Connect to a database (MongoDB, PostgreSQL, etc.)
- Add authentication/authorization
- Add input validation
- Add proper error handling
- Add logging
- Deploy to production