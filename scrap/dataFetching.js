import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

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

// getLiveGameIDs().then((data) => {
//   data.forEach(async (datum) => {
//     const gameData = await getGameData(datum);
//     console.log(gameData);
//   });
// });

const { data, error } = await supabase
  .from('MLB Teams')
  .select('*')
  .eq('id', `108`);
console.log('what the fuck', data);
