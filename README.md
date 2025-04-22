# No No Watcher

<div align="center">
  <img src="./public/baseball.png" width="360" style="display: block; margin: 0 auto">
  <h3 align="center">Swing batter, batter</h3>
  <p align="center">
    A real-time MLB no-hitter monitoring system that sends you a text when an active no-hitter is in progress.
  </p>
</div>

## Features

- Real-time monitoring of all live MLB games
- SMS notifications via Twilio when a no-hitter is detected
- Database tracking of active no-hitters

## Tech Stack

- Node.js
- Twilio (SMS notifications)
- Supabase (Database)
- MLB Stats API
- Google Cloud Functions (Deployment)

## Prerequisites

Before you begin, ensure you have:

- Node.js installed
- A Twilio account with:
  - Account SID
  - Auth Token
  - Phone number
- A Supabase account with:
  - Project URL
  - Secret Key
  - Database table named "MLB Teams"

## Setup

1. Clone the repository:

   ```bash
   git clone git@github.com:twotabsofacid/no-no-watcher.git
   cd no-no-watcher
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Copy `.env-example` to `.env`
   - Fill in your Twilio and Supabase credentials

4. Initialize the database:
   ```bash
   node scrap/writeTeamData.js
   ```

## Usage

This is a meant to run on a GCP cloud run instance, with entrypoint `main`. When it's running in the cloud a scheduler will ping it every five minutes to trigger. When running locally, do

```bash
curl -X GET 127.0.0.1:8080
```

to trigger the function.

Every day there's a scheduled cleanup of the database, which you can trigger through

```bash
curl -X GET 127.0.0.1:8080/clean
```

### Development

To run locally, do:

```bash
npm run dev
```

## Configuration

The system currently has the following configurable parameters:

- Minimum innings required for notification (default: 6)
- Maximum hits allowed for no-hitter classification (default: 0, but adjustable for testing)

## Future Improvements

- Deploy to gcp with cloud scheduler to run every 5 minutes during normal MLB gametimes
- Cloud scheduler to run `/clean` every day before we trigger the above
- Clean up code, double check it's actually working
- Create mock endpoints with data for testing

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a new branch following these conventions:
   - For new features: `feature/descriptive-name`
   - For bug fixes: `fix/descriptive-name`
   - For hotfixes: `hotfix/descriptive-name`
   - For documentation: `docs/descriptive-name`
3. Make your changes
4. Submit a pull request with a clear description of your changes

Example branch names:

- `feature/add-email-notifications`
- `fix/incorrect-inning-count`
- `hotfix/critical-api-error`
- `docs/update-readme`

## License

GPL 3.0. See txt.
