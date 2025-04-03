import 'dotenv/config';
import axios from 'axios';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import functions from '@google-cloud/functions-framework';

// Variables
const minInnings = 1;
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// API endpoints..
// http://statsapi.mlb.com/api/v1/schedule/games/?sportId=1
// http://statsapi.mlb.com/api/v1.1/game/778505/feed/live

/**
 * Get Live Game IDs
 *
 * @returns a Promise – an array of currently live game IDs, or an error
 */
const getLiveGameIDs = () => {
  return new Promise((resolve, reject) => {
    axios
      .get('http://statsapi.mlb.com/api/v1/schedule/games/?sportId=1')
      .then((res) => {
        resolve(
          res.data.dates[0].games
            .filter((game) => game.status.abstractGameState === 'Live')
            .map((game) => game.gamePk)
        );
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * Output Game Info
 * Grab game info for a given game ID
 *
 * @param {int|string} gameID ID of the game to get info for
 * @returns a Promise – either a game object, or an error
 */
const getGameData = (gameID) => {
  return new Promise((resolve, reject) => {
    axios
      .get(`http://statsapi.mlb.com/api/v1.1/game/${gameID}/feed/live`)
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * Send a text message
 *
 * @param {Object} gameObj Object with game data
 * @returns a Promise – either an object with the text message ID and the text it sent, or an error
 */
const sendTextMessage = (gameObj) => {
  return new Promise((resolve, reject) => {
    const noHitterText = activeNoHitterStringConstructor(gameObj);
    client.messages
      .create({
        body: noHitterText,
        to: process.env.PERSONAL_NUMBER, // Text your number
        from: process.env.TWILIO_NUMBER // From a valid Twilio number
      })
      .then((message) => {
        console.log('Text message sent', message.sid, noHitterText);
        resolve({
          messageID: message.sid,
          noHitterText
        });
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * Active No Hitter String Contructor
 * Make a string from a game object to send as a text message
 *
 * @param {Object} gameObj Object with game data
 * @returns a String – a human readable string of the no hitter status
 */
const activeNoHitterStringConstructor = (gameObj) => {
  const homeHits = gameObj.liveData.linescore.teams.home.hits;
  const awayHits = gameObj.liveData.linescore.teams.away.hits;
  const homeRuns = gameObj.liveData.linescore.teams.home.runs;
  const awayRuns = gameObj.liveData.linescore.teams.away.runs;
  const inning = gameObj.liveData.linescore.currentInningOrdinal;
  const inningHalf = gameObj.liveData.linescore.inningHalf;
  const homeTeam = gameObj.gameData.teams.home.name;
  const awayTeam = gameObj.gameData.teams.away.name;
  if (homeHits === 0 && awayHits === 0) {
    return `Both the ${homeTeam} (home) and the ${awayTeam} (away) have no hitters going. It's the ${inningHalf.toLowerCase()} of the ${inning}. The score is ${homeRuns} to ${awayRuns}.`;
  } else if (homeHits === 0) {
    return `The ${awayTeam} (away) have let up no hits against the ${homeTeam} (home). It's the ${inningHalf.toLowerCase()} of the ${inning}. The score is ${homeRuns} to ${awayRuns}.`;
  } else if (awayHits === 0) {
    return `The ${homeTeam} (home) have let up no hits against the ${awayTeam} (away). It's the ${inningHalf.toLowerCase()} of the ${inning}. The score is ${homeRuns} to ${awayRuns}.`;
  }
};

/**
 * Run Everything
 * Our biiiiig beautiful boy
 */
functions.http('main', (req, res) => {
  // Get all live game IDs
  getLiveGameIDs()
    .then(async (data) => {
      // If we have any live games
      if (data.length) {
        // Get all live games data
        const liveGamesData = [];
        for (const gameID of data) {
          const gameData = await getGameData(gameID);
          liveGamesData.push(gameData);
        }
        // Filter it out into two arrays,
        // one with active no nos going on
        // and another without.
        // only care about games after the fifth inning in both cases
        const liveNoNosData = liveGamesData.filter(
          (gameData) =>
            (gameData.liveData.linescore.teams.home.hits === 0 ||
              gameData.liveData.linescore.teams.away.hits === 0) &&
            gameData.liveData.linescore.currentInning >= minInnings
        );
        const liveHitsData = liveGamesData.filter(
          (gameData) =>
            gameData.liveData.linescore.teams.home.hits > 0 &&
            gameData.liveData.linescore.teams.away.hits > 0 &&
            gameData.liveData.linescore.currentInning >= minInnings
        );
        // If we have any no nos in progress
        if (liveNoNosData.length) {
          // Loop through these and check
          // if we've already sent a text this inning
          for (const noHitterInProgress of liveNoNosData) {
            // Home team stuff...
            if (noHitterInProgress.liveData.linescore.teams.home.hits === 0) {
              const { data, error } = await supabase
                .from('MLB Teams')
                .select('*')
                .eq('id', noHitterInProgress.gameData.teams.home.id);
              // If we've already marked this as an active no hitter
              if (data[0].active_no_hitter) {
                // Check if the current inning is not equal to the texted inning
                if (
                  noHitterInProgress.liveData.linescore.currentInning !==
                  data[0].texted_inning
                ) {
                  console.log(
                    'what inning we think it is, vs the inning we texted...'
                  );
                  console.log(
                    noHitterInProgress.liveData.linescore.currentInning,
                    data[0].texted_inning
                  );
                  // We haven't sent a text this inning, so send one
                  // and update the db to reflect this
                  await sendTextMessage(noHitterInProgress, 'home');
                  try {
                    await supabase
                      .from('MLB Teams')
                      .update({
                        texted_inning:
                          noHitterInProgress.liveData.linescore.currentInning,
                        active_no_hitter: true
                      })
                      .eq('id', noHitterInProgress.gameData.teams.home.id)
                      .select();
                  } catch (err) {
                    console.log(err);
                  }
                } else {
                  console.log(
                    'active no hitter going on, but already sent a text this inning'
                  );
                  console.log(
                    activeNoHitterStringConstructor(noHitterInProgress, 'home')
                  );
                }
              } else {
                // mark it as an active no hitter, and send a text
                await sendTextMessage(noHitterInProgress);
                try {
                  await supabase
                    .from('MLB Teams')
                    .update({
                      texted_inning:
                        noHitterInProgress.liveData.linescore.currentInning,
                      active_no_hitter: true
                    })
                    .eq('id', noHitterInProgress.gameData.teams.home.id)
                    .select();
                } catch (err) {
                  console.log(err);
                }
              }
            }
            // Away team stuff...
            if (noHitterInProgress.liveData.linescore.teams.away.hits === 0) {
              const { data, error } = await supabase
                .from('MLB Teams')
                .select('*')
                .eq('id', noHitterInProgress.gameData.teams.away.id);
              // If we've already marked this as an active no hitter
              if (data[0].active_no_hitter) {
                // Check if the current inning is not equal to the texted inning
                if (
                  noHitterInProgress.liveData.linescore.currentInning !==
                  data[0].texted_inning
                ) {
                  console.log(
                    'what inning we think it is, vs the inning we texted...'
                  );
                  console.log(
                    noHitterInProgress.liveData.linescore.currentInning,
                    data[0].texted_inning
                  );
                  // We haven't sent a text this inning, so send one
                  // and update the db to reflect this
                  await sendTextMessage(noHitterInProgress, 'away');
                  try {
                    await supabase
                      .from('MLB Teams')
                      .update({
                        texted_inning:
                          noHitterInProgress.liveData.linescore.currentInning,
                        active_no_hitter: true
                      })
                      .eq('id', noHitterInProgress.gameData.teams.away.id)
                      .select();
                  } catch (err) {
                    console.log(err);
                  }
                } else {
                  console.log(
                    'active no hitter going on, but already sent a text this inning'
                  );
                  console.log(
                    activeNoHitterStringConstructor(noHitterInProgress)
                  );
                }
              } else {
                // mark it as an active no hitter, and send a text
                await sendTextMessage(noHitterInProgress, 'away');
                try {
                  await supabase
                    .from('MLB Teams')
                    .update({
                      texted_inning:
                        noHitterInProgress.liveData.linescore.currentInning,
                      active_no_hitter: true
                    })
                    .eq('id', noHitterInProgress.gameData.teams.away.id)
                    .select();
                } catch (err) {
                  console.log(err);
                }
              }
            }
          }
        } else {
          console.log('No no-hitters currently in progress');
        }
        // If we have live games with hits
        if (liveHitsData.length) {
          // Loop through and check if our db has any of
          // these games as a no-hitter in progress
          for (const hitterInProgress of liveHitsData) {
            const { data: homeData, error: homeError } = await supabase
              .from('MLB Teams')
              .select('*')
              .eq('id', hitterInProgress.gameData.teams.home.id);
            const { data: awayData, error: awayError } = await supabase
              .from('MLB Teams')
              .select('*')
              .eq('id', hitterInProgress.gameData.teams.away.id);
            if (homeError || awayError) {
              console.log(
                'Error fetching data from supabase',
                homeError,
                awayError
              );
            }
            // If we had an active no hitter for home team
            if (homeData[0].active_no_hitter) {
              // Update the db to reflect it's no longer a no hitter
              await supabase
                .from('MLB Teams')
                .update({
                  active_no_hitter: false
                })
                .eq('id', hitterInProgress.gameData.teams.home.id)
                .select();
              // Send a text message saying this
              // [TODO abstract sendTextMessage function to account for different strings]
            }
            // if we had an active no hitter for away team
            if (awayData[0].active_no_hitter) {
              // Update the db to reflect it's no longer a no hitter
              await supabase
                .from('MLB Teams')
                .update({
                  active_no_hitter: false
                })
                .eq('id', hitterInProgress.gameData.teams.away.id)
                .select();
              // Send a text message saying this
              // [TODO abstract sendTextMessage function to account for different strings]
            }
          }
        }
      } else {
        console.log('No live games in progress');
      }
      res.status(200).send({
        message: 'Success'
      });
    })
    .catch((error) => {
      console.log('ERROR', error);
      res.status(400).send({
        error
      });
    });
});
