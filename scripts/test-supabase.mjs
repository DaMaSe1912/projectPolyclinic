import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection with URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: doctors, error: docErr } = await supabase.from('doctors').select('*');
  if (docErr) {
    console.error('Doctors select error:', docErr.message);
  } else {
    console.log(`Success! Fetched ${doctors.length} doctors from Supabase:`, doctors.map(d => d.name));
  }

  const { data: queue, error: qErr } = await supabase.from('queue').select('*');
  if (qErr) {
    console.error('Queue select error:', qErr.message);
  } else {
    console.log(`Success! Fetched ${queue.length} queue items from Supabase:`, queue.map(q => `${q.queue_number} (${q.patient_name})`));
  }
}

test();

