# No No Watcher

> Watches for no-hitters

The goal of this code is to check live games for no hitters in progress and text you when there is one. It does this by getting data from `http://statsapi.mlb.com/api/`. Currently it just runs in the terminal. There's a lot of next steps, here are some of them:

* Add a texting service so you get messages while out and about
* Add a database of some kind so that we're not just constantly texting (e.g. maybe it texts you every inning after the 6th to alert you that a no-hitter is still in progress)
* Get this running in the cloud with a scheduler, so it only checks every so often and only during normal hours when baseball would possibly be happening

## Getting Started

Clone this repo, install dependencies with `npm i`, and run with `npm run start` or `npm run dev`.