import fs from 'fs';
const envStr = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envStr.split('\n').filter(Boolean).map(l => l.split('=').map(s => s.trim().replace(/^"|"$/g, ''))));
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_PUBLISHABLE_KEY;

async function run() {
  const tkRes = await fetch(`${SUPABASE_URL}/rest/v1/toolkits?select=id,slug,access_level`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const toolkits = await tkRes.json();
  console.log('TOOLKITS:', toolkits);

  const catRes = await fetch(`${SUPABASE_URL}/rest/v1/toolkit_categories?select=id,slug,toolkit_id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const categories = await catRes.json();
  
  const promptRes = await fetch(`${SUPABASE_URL}/rest/v1/prompts?select=slug,access_level,category_id,toolkit_id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const prompts = await promptRes.json();

  fs.writeFileSync('dump.json', JSON.stringify({ toolkits, categories, prompts }, null, 2));
}
run();
