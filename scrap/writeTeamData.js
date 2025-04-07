import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

axios
  .get('http://statsapi.mlb.com/api/v1/teams')
  .then(async (res) => {
    const mlbTeamsArr = res.data.teams.filter((team) => team.sport.id === 1);
    for (const mlbTeam of mlbTeamsArr) {
      const { data, error } = await supabase.from('MLB Teams').insert({
        id: mlbTeam.id,
        name: mlbTeam.name,
        code: mlbTeam.code,
        active_no_hitter: false,
        texted_inning: 0
      });
      if (error) {
        console.log('error inserting', error);
      }
    }
  })
  .catch((err) => {
    console.log(err);
  });
