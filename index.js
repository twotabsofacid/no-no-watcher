import axios from 'axios';

// API endpoints..
// http://statsapi.mlb.com/api/v1/schedule/games/?sportId=1
// http://statsapi.mlb.com/api/v1.1/game/778505/feed/live

class NoNo {
  /**
   * Get Game IDs
   * @returns a Promise – an array of currently live game IDs (or an empty array), or an error
   */
  getGameIds() {
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
  }
  /**
   * Get Game Info
   * Grab no hitter info for a given game ID
   *
   * @param {int|string} gameId ID of the game to get info for
   * @returns a Promise – either a string of game info, or false, or an error
   */
  getGameInfo(gameId) {
    return new Promise((resolve, reject) => {
      axios
        .get(`http://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`)
        .then((res) => {
          // handle success
          const homeHits = res.data.liveData.linescore.teams.home.hits;
          const awayHits = res.data.liveData.linescore.teams.away.hits;
          const homeRuns = res.data.liveData.linescore.teams.home.runs;
          const awayRuns = res.data.liveData.linescore.teams.away.runs;
          const inning = res.data.liveData.linescore.currentInningOrdinal;
          const inningHalf = res.data.liveData.linescore.inningHalf;
          const homeTeam = res.data.gameData.teams.home.name;
          const awayTeam = res.data.gameData.teams.away.name;
          if (homeHits === 0 && awayHits === 0) {
            resolve(
              `Both the ${homeTeam} (home) and the ${awayTeam} (away) have no hitters going. It's the ${inningHalf.toLowerCase()} of the ${inning}. The score is ${homeRuns} to ${awayRuns}.`
            );
          } else if (homeHits === 0) {
            resolve(
              `The ${awayTeam} (away) have let up no hits against the ${homeTeam} (home). It's the ${inningHalf.toLowerCase()} of the ${inning}. The score is ${homeRuns} to ${awayRuns}.`
            );
          } else if (awayHits === 0) {
            resolve(
              `The ${homeTeam} (home) have let up no hits against the ${awayTeam} (away). It's the ${inningHalf.toLowerCase()} of the ${inning}. The score is ${homeRuns} to ${awayRuns}.`
            );
          }
          resolve(false);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

const batterUp = new NoNo();
batterUp
  .getGameIds()
  .then(async (data) => {
    if (data.length) {
      const noHitterInfo = [];
      for (const id of data) {
        const gameInfo = await batterUp.getGameInfo(id);
        if (gameInfo) {
          noHitterInfo.push(gameInfo);
        }
      }
      if (noHitterInfo.length) {
        // Do something with all the no hitter info
        noHitterInfo.forEach((noHitter) => {
          console.log(noHitter);
        });
      } else {
        console.log(
          `Currently there are ${data.length} live games, but no no-hitters are taking place.`
        );
      }
    } else {
      console.log('No live games in progress');
    }
  })
  .catch((err) => {
    console.log('ERROR', err);
  });
