// Supabase client and save/load helpers for Taiwan Carbon Tools.
// Loaded as ES module via <script type="module" src="./supabase-client.js"></script>
// or via `import` from another module script. Runs directly in the browser — no bundler.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://bgrvjtaaqltawghdqthy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yBhKwvmOYAvDSO61Op2dYA_zyezESw8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 58-char alphabet: full [A-Za-z0-9] minus ambiguous glyphs (0, O, I, l).
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';

export function generateShortId() {
  const arr = new Uint32Array(6);
  crypto.getRandomValues(arr);
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += ID_ALPHABET[arr[i] % ID_ALPHABET.length];
  }
  return id;
}

export async function saveResult(type, data, total) {
  if (type !== 'household' && type !== 'business') {
    throw new Error('Invalid calculator type: ' + type);
  }
  const id = generateShortId();
  const { error } = await supabase
    .from('saved_results')
    .insert({
      id,
      calculator_type: type,
      data,
      total_co2e: total
    });
  if (error) throw new Error(error.message || 'Database insert failed');
  return id;
}

export async function loadResult(id) {
  if (!id || typeof id !== 'string' || !/^[A-Za-z0-9]+$/.test(id) || id.length > 32) {
    return null;
  }
  const { data, error } = await supabase
    .from('saved_results')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message || 'Database query failed');
  return data || null;
}
