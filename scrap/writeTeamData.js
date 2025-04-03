import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
// let { data, error } = await supabase.from('MLB Teams').select('*');
// console.log(data);

axios
  .get('http://statsapi.mlb.com/api/v1/teams')
  .then((res) => {
    const thingsArr = res.data.teams.filter((team) => team.sport.id === 1);
    // console.log(thingsArr);
    console.log(
      thingsArr.map((thing) => [thing.name, thing.id, thing.teamCode])
    );
    thingsArr.forEach(async (thing) => {
      const { data, error } = await supabase
        .from('MLB Teams')
        .update({ texted_inning: 0 })
        .eq('id', thing.id) // Use .eq() to specify which row to update
        .select();
    });
  })
  .catch((err) => {
    console.log(err);
  });
