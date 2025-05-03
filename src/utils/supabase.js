// src/utils/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validación básica para asegurarte de que las variables de entorno están cargadas
if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Error: Missing Supabase URL or Key. Make sure you have set them in your .env file and restarted the development server.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
