import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/VITE_SUPABASE_URL="(.*?)"/);
const keyMatch = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
  const { data: toolkits } = await supabase.from('toolkits').select('id, slug, name');
  const { data: prompts } = await supabase.from('prompts').select('slug, toolkit_id').eq('status', 'published');
  
  console.log(JSON.stringify({ toolkits, prompts }, null, 2));
}

run();
