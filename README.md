# No No Watcher

> Watches for no-hitters

The goal of this code is to check live games for no hitters in progress and text you when there is one. It does this by getting data from `http://statsapi.mlb.com/api/`. Currently it just runs in the terminal. There's a lot of next steps, here are some of them:

* Get this running in the cloud with a scheduler, so it only checks every so often and only during normal hours when baseball would possibly be happening
* Fix the tesing variables to be production ready (e.g. rn it classifies a no-hitter as a team having fewer than 5 hits at any point in the game, when this should be zero hits and probably after the 5th inning)
* DRYYYYYY THIS OUT

## Getting Started

Clone this repo, install dependencies with `npm i`, and run with `npm run start` or `npm run dev`.

You'll need a Twilio account with auth token stuff (see `.env-example`), and a supabase account with a database table called `MLB Teams`. After you've created the table you can set this up programmatically by running `node scrap/writeTeamData.js`.